/**
 * Meta Marketing API adapter — NOT wired in demo mode.
 *
 * In production, this module would:
 * 1. Create ad creative via POST /{ad-account-id}/adcreatives
 * 2. Create ad set with geo/persona targeting
 * 3. Create ad linking creative → ad set
 *
 * Demo uses lib/deploy/simulator.ts instead.
 */

import type { Campaign, CreativeVariant } from "../../types";

export interface MetaDeployPayload {
  name: string;
  objectStorySpec: {
    link_data: {
      message: string;
      name: string;
      description?: string;
      call_to_action: { type: string; value: { link: string } };
    };
  };
  targeting: Record<string, unknown>;
  dailyBudget: number;
  creativeNotes?: string[];
}

export function toMetaPayload(
  creative: CreativeVariant,
  budget: number
): MetaDeployPayload {
  const ctaType =
    creative.cta.toLowerCase().includes("order") ||
    creative.cta.toLowerCase().includes("shop")
      ? "SHOP_NOW"
      : creative.cta.toLowerCase().includes("book")
        ? "BOOK_TRAVEL"
        : "LEARN_MORE";

  return {
    name: `signal-${creative.market}-${creative.persona}-${Date.now()}`,
    objectStorySpec: {
      link_data: {
        message: creative.copy,
        name: creative.headline,
        description: creative.description,
        call_to_action: {
          type: ctaType,
          value: { link: creative.attribution },
        },
      },
    },
    targeting: {
      geo_locations: { regions: [{ key: creative.market }] },
      flexible_spec: [{ interests: [{ name: creative.persona }] }],
    },
    dailyBudget: budget * 100,
    creativeNotes:
      creative.channelPayload?.kind === "meta"
        ? creative.channelPayload.creativeNotes
        : undefined,
  };
}

export async function deployToMeta(
  _creative: CreativeVariant,
  _budget: number
): Promise<Campaign> {
  throw new Error(
    "Meta API not configured. Set META_ACCESS_TOKEN and replace simulator with this adapter."
  );
}
