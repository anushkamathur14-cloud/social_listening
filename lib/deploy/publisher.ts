import { nanoid } from "nanoid";
import { CHANNEL_MAP, type Channel as AdChannel } from "../channels";
import { toMetaPayload } from "./adapters/meta";
import { toSmartlyPayload } from "./adapters/smartly";
import type { Campaign, CreativeVariant, Platform } from "../types";

function platformId(channel: AdChannel): string {
  const id = nanoid(8);
  const prefixes: Record<AdChannel, string> = {
    meta: `meta_camp_${id}`,
    smartly: `smartly_adset_${id}`,
    google_search: `google_ad_${id}`,
    display: `dv360_creative_${id}`,
  };
  return prefixes[channel];
}

function toPlatform(channel: AdChannel): Platform {
  if (channel === "google_search") return "google_search";
  if (channel === "display") return "display";
  if (channel === "smartly") return "smartly";
  return "meta";
}

export async function publishToChannel(
  creative: CreativeVariant,
  budget = 75
): Promise<Campaign & { publishPayload: unknown; publishAdapter: string }> {
  const spec = CHANNEL_MAP[creative.channel as AdChannel];
  const latency = 1500 + Math.random() * 2000;
  await new Promise((resolve) => setTimeout(resolve, latency));

  let publishPayload: unknown;
  switch (spec.publishAdapter) {
    case "smartly":
      publishPayload = toSmartlyPayload(creative, budget);
      break;
    case "meta":
      publishPayload = toMetaPayload(creative, budget);
      break;
    case "google_ads":
      publishPayload = {
        adGroup: `signal-${creative.market}`,
        headlines: [creative.headline],
        descriptions: [creative.description ?? creative.copy],
        finalUrl: creative.attribution,
      };
      break;
    case "dv360":
      publishPayload = {
        displayName: creative.headline,
        imageUrl: creative.imageUrl,
        clickThroughUrl: creative.attribution,
        dimensions: `${spec.imageWidth}x${spec.imageHeight}`,
      };
      break;
  }

  const campaign: Campaign = {
    id: nanoid(),
    creativeId: creative.id,
    triggerId: creative.triggerId,
    channel: creative.channel as AdChannel,
    platform: toPlatform(creative.channel as AdChannel),
    platformId: platformId(creative.channel as AdChannel),
    status: "active",
    budget,
    targeting: `${creative.market} · ${creative.persona} · ${creative.channel}`,
    market: creative.market,
    publishAdapter: spec.publishLabel,
    launchedAt: new Date().toISOString(),
  };

  return { ...campaign, publishPayload, publishAdapter: spec.publishLabel };
}

export function getPublishSummary(
  campaign: Campaign,
  simulated = true
): string {
  const prefix = simulated ? "[simulated] " : "";
  return `${prefix}Published via ${campaign.publishAdapter ?? campaign.channel} → ${campaign.platformId} ($${campaign.budget}/day)`;
}
