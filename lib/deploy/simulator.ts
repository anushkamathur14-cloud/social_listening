import { nanoid } from "nanoid";
import type { Campaign, CreativeVariant, Platform } from "../types";

function randomPlatform(): Platform {
  return Math.random() > 0.5 ? "meta" : "smartly";
}

function platformId(platform: Platform): string {
  const id = nanoid(8);
  return platform === "meta" ? `meta_camp_${id}` : `smartly_adset_${id}`;
}

export async function simulateDeploy(
  creative: CreativeVariant,
  autoLaunch: boolean
): Promise<Campaign> {
  const latency = 2000 + Math.random() * 3000;
  await new Promise((resolve) => setTimeout(resolve, latency));

  const platform = randomPlatform();

  return {
    id: nanoid(),
    creativeId: creative.id,
    triggerId: creative.triggerId,
    platform,
    platformId: platformId(platform),
    status: autoLaunch ? "active" : "pending_approval",
    budget: 50 + Math.floor(Math.random() * 150),
    targeting: `${creative.market} · ${creative.persona} · signal-responsive`,
    market: creative.market,
    launchedAt: autoLaunch ? new Date().toISOString() : undefined,
  };
}

export async function approveCampaign(campaign: Campaign): Promise<Campaign> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return {
    ...campaign,
    status: "active",
    launchedAt: new Date().toISOString(),
  };
}

export function getDeploySummary(campaign: Campaign): string {
  return `Deployed to ${campaign.platform.toUpperCase()} (${campaign.platformId}) — $${campaign.budget}/day`;
}
