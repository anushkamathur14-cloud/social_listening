import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "../db/client";
import { campaigns, performance } from "../db/schema";
import { broadcaster } from "../events/broadcaster";
import type { Campaign, PerformanceSnapshot, Platform, Market, CampaignStatus } from "../types";

export function generateMetrics(campaign: Campaign): PerformanceSnapshot {
  const impressions = 1000 + Math.floor(Math.random() * 9000);
  const ctr = 0.005 + Math.random() * 0.045;
  const clicks = Math.floor(impressions * ctr);
  const cpa = 5 + Math.random() * 25;
  const spend = clicks * cpa * 0.3;

  return {
    campaignId: campaign.id,
    impressions,
    clicks,
    ctr: Math.round(ctr * 10000) / 100,
    cpa: Math.round(cpa * 100) / 100,
    spend: Math.round(spend * 100) / 100,
    recordedAt: new Date().toISOString(),
  };
}

export async function optimizeCampaigns(): Promise<{
  snapshots: PerformanceSnapshot[];
  actions: Array<{ campaignId: string; action: string }>;
}> {
  const activeCampaigns = await db
    .select()
    .from(campaigns)
    .where(eq(campaigns.status, "active"));

  if (activeCampaigns.length === 0) {
    return { snapshots: [], actions: [] };
  }

  const snapshots: PerformanceSnapshot[] = [];
  const actions: Array<{ campaignId: string; action: string }> = [];

  const campaignById = new Map<string, Campaign>();

  for (const row of activeCampaigns) {
    const campaign: Campaign = {
      id: row.id,
      creativeId: row.creativeId,
      triggerId: row.triggerId,
      platform: row.platform as Platform,
      channel: (row.channel ?? row.platform) as Campaign["channel"],
      platformId: row.platformId,
      status: row.status as CampaignStatus,
      budget: row.budget,
      targeting: row.targeting,
      market: row.market as Market,
      launchedAt: row.launchedAt ?? undefined,
    };
    campaignById.set(campaign.id, campaign);
    const snapshot = generateMetrics(campaign);
    snapshots.push(snapshot);

    await db.insert(performance).values({
      id: nanoid(),
      campaignId: snapshot.campaignId,
      impressions: snapshot.impressions,
      clicks: snapshot.clicks,
      ctr: snapshot.ctr,
      cpa: snapshot.cpa,
      spend: snapshot.spend,
      recordedAt: snapshot.recordedAt,
    });

    broadcaster.emitEvent("performance_update", {
      campaignId: campaign.id,
      creativeId: campaign.creativeId,
      channel: campaign.channel,
      market: campaign.market,
      snapshot,
    });
  }

  const ranked = [...snapshots].sort((a, b) => b.ctr - a.ctr);
  const pauseCount = Math.max(1, Math.floor(ranked.length * 0.3));

  for (let i = ranked.length - pauseCount; i < ranked.length; i++) {
    const snap = ranked[i];
    const camp = campaignById.get(snap.campaignId);
    await db
      .update(campaigns)
      .set({ status: "paused" })
      .where(eq(campaigns.id, snap.campaignId));
    actions.push({ campaignId: snap.campaignId, action: "paused underperformer" });
    broadcaster.emitEvent("optimizer_action", {
      campaignId: snap.campaignId,
      action: "paused",
      reason: "Bottom 30% CTR",
      ctr: snap.ctr,
      channel: camp?.channel,
      market: camp?.market,
    });
  }

  if (ranked.length > 0) {
    const winner = ranked[0];
    const winnerCamp = campaignById.get(winner.campaignId);
    await db
      .update(campaigns)
      .set({ status: "scaled" })
      .where(eq(campaigns.id, winner.campaignId));
    actions.push({ campaignId: winner.campaignId, action: "scaled winner" });
    broadcaster.emitEvent("optimizer_action", {
      campaignId: winner.campaignId,
      action: "scaled",
      reason: "Top CTR performer",
      ctr: winner.ctr,
      channel: winnerCamp?.channel,
      market: winnerCamp?.market,
    });
  }

  return { snapshots, actions };
}

export async function getLatestPerformance(limit = 20) {
  return db
    .select()
    .from(performance)
    .orderBy(desc(performance.recordedAt))
    .limit(limit);
}

export async function getActiveCampaigns() {
  return db.select().from(campaigns).orderBy(desc(campaigns.launchedAt));
}
