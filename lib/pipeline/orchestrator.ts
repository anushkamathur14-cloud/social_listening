import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { config, parseActiveMarkets, parseChannels } from "../config";
import { DEFAULT_ACTIVE_MARKETS } from "../markets";
import { DEFAULT_CHANNELS } from "../channels";
import { parseChannelPayload } from "../creative/channel-payload";
import { generateCreatives } from "../creative/generator";
import type { LlmRunOptions } from "../creative/llm-config";
import { applyComplianceFixes, validateCreative } from "../compliance/rules";
import { db, initDb } from "../db/client";
import { campaigns, creatives, pipelineRuns, settings } from "../db/schema";
import { publishToChannel } from "../deploy/publisher";
import { broadcaster } from "../events/broadcaster";
import { optimizeCampaigns } from "../optimize/simulator";
import { fetchRedditSignals } from "../signals/reddit";
import { fetchTrafficSignals } from "../signals/traffic";
import { fetchTrendSignals } from "../signals/trends";
import { fetchWeatherSignals } from "../signals/weather";
import {
  evaluateSignal,
  getSignalById,
  persistSignal,
  persistTrigger,
} from "../triggers/engine";
import type {
  Channel,
  DemoSettings,
  Market,
  PipelineStage,
  Signal,
  SignalType,
} from "../types";

let pipelinePaused = false;
let activeMarkets: Market[] = config.defaultActiveMarkets;
let selectedChannels: Channel[] = DEFAULT_CHANNELS;
let optimizerInterval: ReturnType<typeof setInterval> | null = null;
let pollerInterval: ReturnType<typeof setInterval> | null = null;
let initialized = false;

export async function ensureInitialized() {
  if (!initialized) {
    initDb();
    await loadSettings();
    initialized = true;
  }
}

async function loadSettings() {
  const rows = await db.select().from(settings);
  for (const row of rows) {
    if (row.key === "pipelinePaused") pipelinePaused = row.value === "true";
    if (row.key === "activeMarkets") activeMarkets = parseActiveMarkets(row.value);
    if (row.key === "selectedChannels") selectedChannels = parseChannels(row.value);
  }
}

async function saveSetting(key: string, value: string) {
  await db
    .insert(settings)
    .values({ key, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } });
}

export function isPipelinePaused() {
  return pipelinePaused;
}

export async function setPipelinePaused(paused: boolean) {
  pipelinePaused = paused;
  await saveSetting("pipelinePaused", String(paused));
  broadcaster.emitEvent(paused ? "pipeline_paused" : "pipeline_resumed", {});
}

export async function setActiveMarkets(markets: Market[]) {
  activeMarkets = markets.filter((m) => config.markets.includes(m));
  if (activeMarkets.length === 0) activeMarkets = DEFAULT_ACTIVE_MARKETS;
  await saveSetting("activeMarkets", JSON.stringify(activeMarkets));
}

export function getActiveMarkets(): Market[] {
  return activeMarkets;
}

export async function setSelectedChannels(channels: Channel[]) {
  selectedChannels = channels.length > 0 ? channels : DEFAULT_CHANNELS;
  await saveSetting("selectedChannels", JSON.stringify(selectedChannels));
}

export function getSelectedChannels(): Channel[] {
  return selectedChannels;
}

function signalInActiveMarkets(signal: Signal): boolean {
  if (signal.market === "US") {
    return activeMarkets.length > 0;
  }
  return activeMarkets.includes(signal.market);
}

async function emitStage(
  runId: string,
  triggerId: string,
  stage: PipelineStage,
  timings: Partial<Record<PipelineStage, number>>,
  status: "running" | "completed" | "failed" = "running",
  extra?: Record<string, unknown>
) {
  broadcaster.emitEvent("pipeline_stage", {
    runId,
    triggerId,
    stage,
    status,
    timings,
    ...extra,
  });
}

export async function runPipeline(
  triggerId: string,
  signalId: string,
  options?: { force?: boolean; llm?: LlmRunOptions }
) {
  if (pipelinePaused && !options?.force) return;

  const runId = nanoid();
  const timings: Partial<Record<PipelineStage, number>> = {};
  const start = Date.now();
  const channels = selectedChannels;

  await db.insert(pipelineRuns).values({
    id: runId,
    triggerId,
    stage: "detect",
    status: "running",
    startedAt: new Date().toISOString(),
    stageTimings: JSON.stringify(timings),
  });

  const signalRow = await getSignalById(signalId);
  if (!signalRow) return;

  const signal: Signal = {
    id: signalRow.id,
    type: signalRow.type as SignalType,
    market: signalRow.market as Market,
    severity: signalRow.severity as Signal["severity"],
    payload: JSON.parse(signalRow.payload),
    detectedAt: signalRow.detectedAt,
  };

  timings.detect = Date.now() - start;
  await emitStage(runId, triggerId, "detect", timings, "completed", {
    signal: {
      id: signal.id,
      type: signal.type,
      market: signal.market,
      summary: signal.payload.summary,
      sourceUrl: signal.payload.sourceUrl,
      sourceLabel: signal.payload.sourceLabel,
    },
    message: `Signal detected in ${signal.market}: ${signal.payload.summary}`,
    channels,
  });

  const genStart = Date.now();
  await emitStage(runId, triggerId, "generate", timings, "running", {
    message: `Generating for channels: ${channels.join(", ")}`,
  });
  const rawCreatives = await generateCreatives(
    signal,
    triggerId,
    channels,
    options?.llm
  );
  timings.generate = Date.now() - genStart;
  await emitStage(runId, triggerId, "generate", timings, "completed", {
    message: `${rawCreatives.length} channel-specific creatives generated`,
  });

  const valStart = Date.now();
  await emitStage(runId, triggerId, "validate", timings);
  const validatedCreatives = rawCreatives.map((c) => {
    const result = validateCreative(c);
    const fixed = applyComplianceFixes(c, result);
    const forReview = {
      ...fixed,
      complianceStatus:
        fixed.complianceStatus === "blocked"
          ? ("blocked" as const)
          : ("pending_review" as const),
    };
    broadcaster.emitEvent("compliance_result", {
      creativeId: c.id,
      passed: result.passed,
      violations: result.violations,
      autoFixes: result.autoFixes,
      status: forReview.complianceStatus,
    });
    broadcaster.emitEvent("creative_generated", { creative: forReview });
    return forReview;
  });
  timings.validate = Date.now() - valStart;
  await emitStage(runId, triggerId, "validate", timings, "completed", {
    message: "Creatives ready for your review — approve to publish",
  });

  for (const creative of validatedCreatives.filter(
    (c) => c.complianceStatus !== "blocked"
  )) {
    await db.insert(creatives).values({
      id: creative.id,
      triggerId: creative.triggerId,
      persona: creative.persona,
      market: creative.market,
      headline: creative.headline,
      copy: creative.copy,
      cta: creative.cta,
      imagePrompt: creative.imagePrompt,
      signalContext: creative.signalContext,
      attribution: creative.attribution,
      complianceStatus: creative.complianceStatus,
      createdAt: creative.createdAt,
      channel: creative.channel,
      imageUrl: creative.imageUrl ?? null,
      description: creative.description ?? null,
      channelPayload: creative.channelPayload
        ? JSON.stringify(creative.channelPayload)
        : null,
    });
  }

  // Launch stage = awaiting approval (no auto-publish)
  timings.launch = Date.now() - start;
  await emitStage(runId, triggerId, "launch", timings, "completed", {
    message: "Awaiting approval — publish routes to Smartly, Meta, Google Ads, or DV360",
  });

  await db
    .update(pipelineRuns)
    .set({
      status: "completed",
      stage: "launch",
      completedAt: new Date().toISOString(),
      stageTimings: JSON.stringify(timings),
    })
    .where(eq(pipelineRuns.id, runId));
}

export async function processSignal(signal: Signal) {
  if (!signalInActiveMarkets(signal)) {
    return null;
  }

  await persistSignal(signal);
  const trigger = evaluateSignal(signal);
  if (!trigger) return null;

  await persistTrigger(trigger);
  await runPipeline(trigger.id, signal.id);
  return trigger;
}

async function processInjectedSignal(
  signal: Signal,
  channels?: Channel[],
  llm?: LlmRunOptions
) {
  if (channels?.length) {
    selectedChannels = channels;
    await saveSetting("selectedChannels", JSON.stringify(channels));
  }

  if (!signalInActiveMarkets(signal)) {
    const next = [...new Set([...activeMarkets, signal.market])];
    await setActiveMarkets(next);
  }

  await persistSignal(signal);

  const trigger = {
    id: nanoid(),
    signalId: signal.id,
    type: signal.type,
    market: signal.market,
    rule: "demo_inject: always fire (bypass debounce & rules)",
    firedAt: new Date().toISOString(),
  };

  await persistTrigger(trigger);
  await runPipeline(trigger.id, signal.id, { force: true, llm });
  return { trigger, signalId: signal.id, pipelineStarted: true };
}

export async function pollAllSignals() {
  if (pipelinePaused) return;

  const markets = activeMarkets;

  const results = await Promise.allSettled([
    fetchWeatherSignals(markets),
    fetchTrafficSignals(markets),
    fetchTrendSignals(markets),
    fetchRedditSignals(markets),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const signal of result.value) {
        if (signalInActiveMarkets(signal)) {
          await processSignal(signal);
        }
      }
    }
  }
}

export function startBackgroundJobs() {
  if (pollerInterval || optimizerInterval) return;

  ensureInitialized();

  pollerInterval = setInterval(() => {
    pollAllSignals().catch(console.error);
  }, config.pollIntervalMs);

  optimizerInterval = setInterval(() => {
    optimizeCampaigns().catch(console.error);
  }, 30000);

  setTimeout(() => pollAllSignals().catch(console.error), 3000);
}

export async function injectSignal(
  type: SignalType,
  market: Market,
  channels?: Channel[],
  llm?: LlmRunOptions
) {
  const { createWeatherSignal } = await import("../signals/weather");
  const { createTrafficSignal } = await import("../signals/traffic");
  const { createTrendSignal } = await import("../signals/trends");
  const { createRedditSignal } = await import("../signals/reddit");

  const creators: Record<SignalType, (m: Market) => Signal> = {
    weather: createWeatherSignal,
    traffic: createTrafficSignal,
    trends: createTrendSignal,
    reddit: createRedditSignal,
    social: createRedditSignal,
  };

  const signal = creators[type](market);
  return processInjectedSignal(signal, channels, llm);
}

export async function customizeCreatives(params: {
  signalId: string;
  channels: Channel[];
  customBrief: string;
  llm: LlmRunOptions;
  triggerId?: string;
}) {
  const signalRow = await getSignalById(params.signalId);
  if (!signalRow) return null;

  const signal: Signal = {
    id: signalRow.id,
    type: signalRow.type as SignalType,
    market: signalRow.market as Market,
    severity: signalRow.severity as Signal["severity"],
    payload: JSON.parse(signalRow.payload),
    detectedAt: signalRow.detectedAt,
  };

  const triggerId = params.triggerId ?? nanoid();

  if (!params.triggerId) {
    await persistTrigger({
      id: triggerId,
      signalId: signal.id,
      type: signal.type,
      market: signal.market,
      rule: "custom_llm: user-directed creative generation",
      firedAt: new Date().toISOString(),
    });
  }

  broadcaster.emitEvent("pipeline_stage", {
    runId: nanoid(),
    triggerId,
    stage: "generate",
    status: "running",
    message: `Custom LLM generation: ${params.customBrief.slice(0, 80)}…`,
    timings: {},
  });

  const rawCreatives = await generateCreatives(
    signal,
    triggerId,
    params.channels,
    { ...params.llm, customBrief: params.customBrief }
  );

  const validatedCreatives = rawCreatives.map((c) => {
    const result = validateCreative(c);
    const fixed = applyComplianceFixes(c, result);
    const forReview = {
      ...fixed,
      complianceStatus:
        fixed.complianceStatus === "blocked"
          ? ("blocked" as const)
          : ("pending_review" as const),
    };
    broadcaster.emitEvent("compliance_result", {
      creativeId: c.id,
      passed: result.passed,
      violations: result.violations,
      autoFixes: result.autoFixes,
      status: forReview.complianceStatus,
    });
    broadcaster.emitEvent("creative_generated", {
      creative: forReview,
      customized: true,
      customBrief: params.customBrief,
    });
    return forReview;
  });

  for (const creative of validatedCreatives.filter(
    (c) => c.complianceStatus !== "blocked"
  )) {
    await db.insert(creatives).values({
      id: creative.id,
      triggerId: creative.triggerId,
      persona: creative.persona,
      market: creative.market,
      headline: creative.headline,
      copy: creative.copy,
      cta: creative.cta,
      imagePrompt: creative.imagePrompt,
      signalContext: creative.signalContext,
      attribution: creative.attribution,
      complianceStatus: creative.complianceStatus,
      createdAt: creative.createdAt,
      channel: creative.channel,
      imageUrl: creative.imageUrl ?? null,
      description: creative.description ?? null,
      channelPayload: creative.channelPayload
        ? JSON.stringify(creative.channelPayload)
        : null,
    });
  }

  broadcaster.emitEvent("pipeline_stage", {
    runId: nanoid(),
    triggerId,
    stage: "validate",
    status: "completed",
    message: `${validatedCreatives.length} customized creatives ready for review`,
    timings: {},
  });

  return { triggerId, creatives: validatedCreatives };
}

export async function publishCreativeById(
  creativeId: string,
  options?: { integrations?: import("../integrations").IntegrationConfig }
) {
  const rows = await db
    .select()
    .from(creatives)
    .where(eq(creatives.id, creativeId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const creative = {
    id: row.id,
    triggerId: row.triggerId,
    channel: (row.channel ?? "meta") as Channel,
    persona: row.persona,
    market: row.market as Market,
    headline: row.headline,
    copy: row.copy,
    description: row.description ?? undefined,
    cta: row.cta,
    imagePrompt: row.imagePrompt,
    imageUrl: row.imageUrl ?? undefined,
    signalContext: row.signalContext,
    attribution: row.attribution,
    complianceStatus: row.complianceStatus as "pending_review",
    createdAt: row.createdAt,
    channelPayload: parseChannelPayload(row.channelPayload),
  };

  const published = await publishToChannel(creative, 75, options);

  await db.insert(campaigns).values({
    id: published.id,
    creativeId: published.creativeId,
    triggerId: published.triggerId,
    platform: published.platform,
    platformId: published.platformId,
    status: published.status,
    budget: published.budget,
    targeting: published.targeting,
    market: published.market,
    launchedAt: published.launchedAt ?? null,
    channel: published.channel,
    publishAdapter: published.publishAdapter ?? null,
  });

  await db
    .update(creatives)
    .set({ complianceStatus: "published" })
    .where(eq(creatives.id, creativeId));

  broadcaster.emitEvent("campaign_published", {
    campaign: published,
    creative,
    publishAdapter: published.publishAdapter,
    publishPayload: published.publishPayload,
    simulated: published.simulated,
    message: published.simulated
      ? `Simulated route to ${published.publishAdapter} — no ad spend. Add API keys in Integrations to go live-ready.`
      : `Routed with your credentials via ${published.publishAdapter}`,
  });

  broadcaster.emitEvent("campaign_launched", { campaign: published, creative });

  setTimeout(() => {
    optimizeCampaigns().catch(console.error);
  }, 2500);

  const publishedCreative = {
    ...creative,
    complianceStatus: "published" as const,
  };

  return { ...published, creative: publishedCreative };
}

// Keep legacy approve endpoint working
export async function approveCampaignById(campaignId: string) {
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  await db
    .update(campaigns)
    .set({ status: "active", launchedAt: new Date().toISOString() })
    .where(eq(campaigns.id, campaignId));

  broadcaster.emitEvent("campaign_approved", { campaign: row });
  return row;
}

export function getDemoSettings(): DemoSettings {
  return {
    market: "NYC",
    activeMarkets,
    selectedChannels,
    autoLaunch: false,
    pipelinePaused,
  };
}
