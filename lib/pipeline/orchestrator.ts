import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { config } from "../config";
import { generateCreatives, generateIncrementalVariant } from "../creative/generator";
import { applyComplianceFixes, validateCreative } from "../compliance/rules";
import { db, initDb } from "../db/client";
import { campaigns, creatives, pipelineRuns, settings } from "../db/schema";
import { approveCampaign, simulateDeploy } from "../deploy/simulator";
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
  DemoSettings,
  Market,
  PipelineStage,
  Signal,
  SignalType,
} from "../types";

let pipelinePaused = false;
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

async function emitStage(
  runId: string,
  triggerId: string,
  stage: PipelineStage,
  timings: Partial<Record<PipelineStage, number>>,
  status: "running" | "completed" | "failed" = "running"
) {
  broadcaster.emitEvent("pipeline_stage", {
    runId,
    triggerId,
    stage,
    status,
    timings,
  });
}

export async function runPipeline(triggerId: string, signalId: string) {
  if (pipelinePaused) return;

  const runId = nanoid();
  const timings: Partial<Record<PipelineStage, number>> = {};
  const start = Date.now();

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

  // Stage 1: Detect (already done)
  timings.detect = Date.now() - start;
  await emitStage(runId, triggerId, "detect", timings, "completed");

  // Stage 2: Generate
  const genStart = Date.now();
  await emitStage(runId, triggerId, "generate", timings);
  const rawCreatives = await generateCreatives(signal, triggerId);
  timings.generate = Date.now() - genStart;
  await emitStage(runId, triggerId, "generate", timings, "completed");

  for (const raw of rawCreatives) {
    broadcaster.emitEvent("creative_generated", { creative: raw });
  }

  // Stage 3: Validate
  const valStart = Date.now();
  await emitStage(runId, triggerId, "validate", timings);
  const validatedCreatives = rawCreatives.map((c) => {
    const result = validateCreative(c);
    const fixed = applyComplianceFixes(c, result);
    broadcaster.emitEvent("compliance_result", {
      creativeId: c.id,
      passed: result.passed,
      violations: result.violations,
      autoFixes: result.autoFixes,
      status: fixed.complianceStatus,
    });
    return fixed;
  });
  timings.validate = Date.now() - valStart;
  await emitStage(runId, triggerId, "validate", timings, "completed");

  const launchable = validatedCreatives.filter(
    (c) => c.complianceStatus === "passed" || c.complianceStatus === "fixed"
  );

  for (const creative of launchable) {
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
    });
  }

  // Stage 4: Launch
  const launchStart = Date.now();
  await emitStage(runId, triggerId, "launch", timings);

  for (const creative of launchable) {
    const campaign = await simulateDeploy(creative, config.autoLaunch);
    await db.insert(campaigns).values({
      id: campaign.id,
      creativeId: campaign.creativeId,
      triggerId: campaign.triggerId,
      platform: campaign.platform,
      platformId: campaign.platformId,
      status: campaign.status,
      budget: campaign.budget,
      targeting: campaign.targeting,
      market: campaign.market,
      launchedAt: campaign.launchedAt ?? null,
    });
    broadcaster.emitEvent("campaign_launched", { campaign, creative });
  }

  timings.launch = Date.now() - launchStart;
  await emitStage(runId, triggerId, "launch", timings, "completed");

  // Stage 5: Optimize (initial pass)
  const optStart = Date.now();
  await emitStage(runId, triggerId, "optimize", timings);
  const { actions } = await optimizeCampaigns();
  timings.optimize = Date.now() - optStart;
  await emitStage(runId, triggerId, "optimize", timings, "completed");

  // Incremental winner regeneration
  const scaledAction = actions.find((a) => a.action === "scaled winner");
  if (scaledAction && launchable.length > 0) {
    const winnerCreative = launchable[0];
    const incremental = await generateIncrementalVariant(winnerCreative, signal);
    broadcaster.emitEvent("creative_generated", {
      creative: incremental,
      incremental: true,
    });
  }

  await db
    .update(pipelineRuns)
    .set({
      status: "completed",
      stage: "optimize",
      completedAt: new Date().toISOString(),
      stageTimings: JSON.stringify(timings),
    })
    .where(eq(pipelineRuns.id, runId));
}

export async function processSignal(signal: Signal) {
  await persistSignal(signal);
  const trigger = evaluateSignal(signal);
  if (!trigger) return null;

  await persistTrigger(trigger);
  await runPipeline(trigger.id, signal.id);
  return trigger;
}

export async function pollAllSignals() {
  if (pipelinePaused) return;

  const results = await Promise.allSettled([
    fetchWeatherSignals(),
    fetchTrafficSignals(),
    fetchTrendSignals(),
    fetchRedditSignals(),
  ]);

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const signal of result.value) {
        await processSignal(signal);
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

  // Initial poll after 3s
  setTimeout(() => pollAllSignals().catch(console.error), 3000);
}

export async function injectSignal(type: SignalType, market: Market) {
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
  return processSignal(signal);
}

export async function approveCampaignById(campaignId: string) {
  const rows = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.id, campaignId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;

  const campaign = {
    id: row.id,
    creativeId: row.creativeId,
    triggerId: row.triggerId,
    platform: row.platform as "meta" | "smartly",
    platformId: row.platformId,
    status: row.status as "pending_approval" | "active" | "paused" | "scaled" | "blocked",
    budget: row.budget,
    targeting: row.targeting,
    market: row.market as Market,
    launchedAt: row.launchedAt ?? undefined,
  };

  const approved = await approveCampaign(campaign);
  await db
    .update(campaigns)
    .set({ status: "active", launchedAt: approved.launchedAt ?? null })
    .where(eq(campaigns.id, campaignId));

  broadcaster.emitEvent("campaign_approved", { campaign: approved });
  return approved;
}

export function getDemoSettings(): DemoSettings {
  return {
    market: "NYC",
    autoLaunch: config.autoLaunch,
    pipelinePaused,
  };
}
