import { desc, inArray } from "drizzle-orm";
import { db } from "../db/client";
import { campaigns, creatives, performance } from "../db/schema";
import { CHANNEL_MAP, type Channel } from "../channels";
import type { CampaignStatus, PerformanceSnapshot, Platform } from "../types";

export interface CampaignDashboardRow {
  campaignId: string;
  creativeId: string;
  headline: string;
  copy: string;
  market: string;
  persona: string;
  channel: Channel;
  channelLabel: string;
  publishAdapter: string;
  platform: Platform;
  platformId: string;
  status: CampaignStatus;
  budget: number;
  routedAt: string;
  simulated: boolean;
  performance: PerformanceSnapshot | null;
}

export async function getCampaignDashboard(): Promise<CampaignDashboardRow[]> {
  const campaignRows = await db
    .select()
    .from(campaigns)
    .orderBy(desc(campaigns.launchedAt));

  if (campaignRows.length === 0) return [];

  const creativeIds = [...new Set(campaignRows.map((c) => c.creativeId))];
  const campaignIds = campaignRows.map((c) => c.id);

  const [creativeRows, perfRows] = await Promise.all([
    db.select().from(creatives).where(inArray(creatives.id, creativeIds)),
    db
      .select()
      .from(performance)
      .where(inArray(performance.campaignId, campaignIds))
      .orderBy(desc(performance.recordedAt)),
  ]);

  const creativeMap = new Map(creativeRows.map((c) => [c.id, c]));
  const latestPerf = new Map<string, PerformanceSnapshot>();
  for (const row of perfRows) {
    if (!latestPerf.has(row.campaignId)) {
      latestPerf.set(row.campaignId, {
        campaignId: row.campaignId,
        impressions: row.impressions,
        clicks: row.clicks,
        ctr: row.ctr,
        cpa: row.cpa,
        spend: row.spend,
        recordedAt: row.recordedAt,
      });
    }
  }

  return campaignRows.map((row) => {
    const creative = creativeMap.get(row.creativeId);
    const channel = (row.channel ?? row.platform ?? "meta") as Channel;
    const spec = CHANNEL_MAP[channel];

    return {
      campaignId: row.id,
      creativeId: row.creativeId,
      headline: creative?.headline ?? "—",
      copy: creative?.copy ?? "",
      market: row.market,
      persona: creative?.persona ?? "—",
      channel,
      channelLabel: spec?.label.split("(")[0].trim() ?? channel,
      publishAdapter: row.publishAdapter ?? spec?.publishLabel ?? channel,
      platform: row.platform as Platform,
      platformId: row.platformId,
      status: row.status as CampaignStatus,
      budget: row.budget,
      routedAt: row.launchedAt ?? new Date().toISOString(),
      simulated: true,
      performance: latestPerf.get(row.id) ?? null,
    };
  });
}
