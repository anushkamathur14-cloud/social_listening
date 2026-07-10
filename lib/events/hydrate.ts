import { parseChannelPayload } from "../creative/channel-payload";
import type { Channel } from "../channels";
import type { AppEvent, Market, PerformanceSnapshot, SignalType } from "../types";

export interface DbCampaignRow {
  id: string;
  creativeId: string;
  triggerId: string;
  platform: string;
  platformId: string;
  status: string;
  budget: number;
  targeting: string;
  market: string;
  launchedAt: string | null;
  channel: string | null;
  publishAdapter: string | null;
}

/** Dashboard rows from GET /api/campaigns (campaignId vs id) */
interface ApiCampaignDashboardRow {
  campaignId: string;
  creativeId: string;
  platform: string;
  platformId: string;
  status: string;
  budget: number;
  market: string;
  channel: string;
  publishAdapter: string;
  routedAt: string;
  simulated?: boolean;
  performance?: PerformanceSnapshot | null;
}

export interface DbPerformanceRow {
  id: string;
  campaignId: string;
  impressions: number;
  clicks: number;
  ctr: number;
  cpa: number;
  spend: number;
  recordedAt: string;
}

interface DbCreativeRow {
  id: string;
  triggerId: string;
  persona: string;
  market: string;
  headline: string;
  copy: string;
  cta: string;
  imagePrompt: string;
  signalContext: string;
  attribution: string;
  complianceStatus: string;
  createdAt: string;
  channel: string | null;
  imageUrl: string | null;
  description: string | null;
  channelPayload?: string | null;
}

export function creativesToEvents(rows: DbCreativeRow[]): AppEvent[] {
  return rows.map((row) => ({
    id: `hydrate-${row.id}`,
    type: "creative_generated" as const,
    timestamp: row.createdAt,
    data: {
      creative: {
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
        signalSummary: row.signalContext,
        attribution: row.attribution,
        complianceStatus: row.complianceStatus,
        createdAt: row.createdAt,
        channelPayload: parseChannelPayload(row.channelPayload),
      },
    },
  }));
}

export function mergeEventHistory(
  existing: AppEvent[],
  incoming: AppEvent[]
): AppEvent[] {
  const seen = new Set(existing.map((e) => eventKey(e)));
  const merged = [...existing];
  for (const event of incoming) {
    const key = eventKey(event);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(event);
    }
  }
  return merged.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function eventKey(event: AppEvent): string {
  if (event.type === "creative_generated") {
    const c = event.data.creative as { id: string };
    return `creative:${c.id}`;
  }
  if (event.type === "signal_detected") {
    const s = event.data.signal as { id: string };
    return `signal:${s.id}`;
  }
  if (event.type === "campaign_published") {
    const c = event.data.creative as { id: string };
    if (c?.id) return `publish:${c.id}`;
  }
  if (event.type === "performance_update") {
    return `perf:${event.data.campaignId as string}`;
  }
  return `${event.type}:${event.id}`;
}

function dbCreativeRowToVariant(row: DbCreativeRow) {
  return {
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
    signalSummary: row.signalContext,
    attribution: row.attribution,
    complianceStatus: row.complianceStatus,
    createdAt: row.createdAt,
    channelPayload: parseChannelPayload(row.channelPayload),
  };
}

export function campaignPublishedToEvent(params: {
  campaign: {
    id: string;
    creativeId: string;
    triggerId?: string;
    platform: string;
    platformId: string;
    status: string;
    budget?: number;
    targeting?: string;
    market: string;
    launchedAt?: string | null;
    channel?: string | null;
    publishAdapter?: string | null;
  };
  creative: DbCreativeRow | ReturnType<typeof dbCreativeRowToVariant>;
  publishAdapter?: string;
  publishPayload?: unknown;
  simulated?: boolean;
  message?: string;
}): AppEvent {
  const parsed =
    typeof params.creative.channelPayload === "object" &&
    params.creative.channelPayload !== null
      ? (params.creative as ReturnType<typeof dbCreativeRowToVariant>)
      : dbCreativeRowToVariant(params.creative as DbCreativeRow);

  const publishedCreative = {
    ...parsed,
    complianceStatus: "published",
  };

  return {
    id: `hydrate-publish-${params.campaign.creativeId}`,
    type: "campaign_published",
    timestamp: params.campaign.launchedAt ?? new Date().toISOString(),
    data: {
      campaign: {
        id: params.campaign.id,
        creativeId: params.campaign.creativeId,
        triggerId: params.campaign.triggerId ?? parsed.triggerId,
        platform: params.campaign.platform,
        platformId: params.campaign.platformId,
        status: params.campaign.status,
        budget: params.campaign.budget ?? 75,
        targeting: params.campaign.targeting ?? "",
        market: params.campaign.market,
        channel: (params.campaign.channel ?? parsed.channel) as Channel,
        publishAdapter:
          params.publishAdapter ??
          params.campaign.publishAdapter ??
          undefined,
        launchedAt: params.campaign.launchedAt ?? undefined,
      },
      creative: publishedCreative,
      publishAdapter:
        params.publishAdapter ?? params.campaign.publishAdapter ?? undefined,
      publishPayload: params.publishPayload,
      simulated: params.simulated ?? true,
      message: params.message,
    },
  };
}

function dashboardRowToCampaignRow(row: ApiCampaignDashboardRow): DbCampaignRow {
  return {
    id: row.campaignId,
    creativeId: row.creativeId,
    triggerId: "",
    platform: row.platform,
    platformId: row.platformId,
    status: row.status,
    budget: row.budget,
    targeting: "",
    market: row.market,
    launchedAt: row.routedAt,
    channel: row.channel,
    publishAdapter: row.publishAdapter,
  };
}

function normalizeCampaignRows(
  rows: DbCampaignRow[] | ApiCampaignDashboardRow[]
): DbCampaignRow[] {
  if (rows.length === 0) return [];
  const first = rows[0];
  if ("campaignId" in first) {
    return (rows as ApiCampaignDashboardRow[]).map(dashboardRowToCampaignRow);
  }
  return rows as DbCampaignRow[];
}

export function campaignsToEvents(
  campaignRows: DbCampaignRow[],
  creativeRows: DbCreativeRow[]
): AppEvent[] {
  const creativeMap = new Map(creativeRows.map((c) => [c.id, c]));
  return campaignRows
    .map((row) => {
      const creativeRow = creativeMap.get(row.creativeId);
      if (!creativeRow) return null;
      return campaignPublishedToEvent({
        campaign: row,
        creative: creativeRow,
        publishAdapter: row.publishAdapter ?? undefined,
        simulated: true,
        message: `Routed via ${row.publishAdapter ?? row.channel ?? "channel"}`,
      });
    })
    .filter((e): e is AppEvent => e !== null);
}

export function performanceToEvents(rows: DbPerformanceRow[]): AppEvent[] {
  const latest = new Map<string, DbPerformanceRow>();
  for (const row of rows) {
    const existing = latest.get(row.campaignId);
    if (
      !existing ||
      new Date(row.recordedAt).getTime() > new Date(existing.recordedAt).getTime()
    ) {
      latest.set(row.campaignId, row);
    }
  }

  return Array.from(latest.values()).map((row) => ({
    id: `hydrate-perf-${row.campaignId}`,
    type: "performance_update" as const,
    timestamp: row.recordedAt,
    data: {
      campaignId: row.campaignId,
      snapshot: {
        campaignId: row.campaignId,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        cpa: row.cpa,
        spend: row.spend,
        recordedAt: row.recordedAt,
      } satisfies PerformanceSnapshot,
    },
  }));
}

function dashboardPerformanceToEvents(
  rows: ApiCampaignDashboardRow[]
): AppEvent[] {
  const events: AppEvent[] = [];
  for (const row of rows) {
    if (!row.performance) continue;
    events.push({
      id: `hydrate-perf-${row.campaignId}`,
      type: "performance_update",
      timestamp: row.performance.recordedAt,
      data: {
        campaignId: row.campaignId,
        creativeId: row.creativeId,
        snapshot: row.performance,
      },
    });
  }
  return events;
}

function mergePerformanceEvents(events: AppEvent[]): AppEvent[] {
  const latest = new Map<string, AppEvent>();
  for (const event of events) {
    const campaignId = event.data.campaignId as string;
    const existing = latest.get(campaignId);
    if (
      !existing ||
      new Date(event.timestamp).getTime() > new Date(existing.timestamp).getTime()
    ) {
      latest.set(campaignId, event);
    }
  }
  return Array.from(latest.values());
}

export interface DbSignalRow {
  id: string;
  type: string;
  market: string;
  severity: string;
  payload: string;
  detectedAt: string;
}

export function signalsToEvents(rows: DbSignalRow[]): AppEvent[] {
  return rows.map((row) => signalRowToEvent(row));
}

export function signalRowToEvent(row: DbSignalRow): AppEvent {
  return {
    id: `hydrate-signal-${row.id}`,
    type: "signal_detected" as const,
    timestamp: row.detectedAt,
    data: {
      signal: {
        id: row.id,
        type: row.type as SignalType,
        market: row.market as Market,
        severity: row.severity,
        payload: JSON.parse(row.payload),
        detectedAt: row.detectedAt,
      },
    },
  };
}

export function campaignPayloadToEvents(data: {
  creatives?: DbCreativeRow[];
  signals?: DbSignalRow[];
  campaigns?: DbCampaignRow[] | ApiCampaignDashboardRow[];
  performance?: DbPerformanceRow[];
}): AppEvent[] {
  const creatives = data.creatives ?? [];
  const campaignRows = normalizeCampaignRows(data.campaigns ?? []);
  const dashboardRows = (data.campaigns ?? []) as ApiCampaignDashboardRow[];
  const perfEvents = mergePerformanceEvents([
    ...performanceToEvents(data.performance ?? []),
    ...dashboardPerformanceToEvents(dashboardRows),
  ]);

  return [
    ...creativesToEvents(creatives),
    ...signalsToEvents(data.signals ?? []),
    ...campaignsToEvents(campaignRows, creatives),
    ...perfEvents,
  ];
}
