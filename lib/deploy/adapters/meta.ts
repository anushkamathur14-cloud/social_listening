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
      call_to_action: { type: string; value: { link: string } };
    };
  };
  targeting: Record<string, unknown>;
  dailyBudget: number;
}

export function toMetaPayload(
  creative: CreativeVariant,
  budget: number
): MetaDeployPayload {
  return {
    name: `signal-${creative.market}-${creative.persona}-${Date.now()}`,
    objectStorySpec: {
      link_data: {
        message: creative.copy,
        name: creative.headline,
        call_to_action: {
          type: "SHOP_NOW",
          value: { link: creative.attribution },
        },
      },
    },
    targeting: {
      geo_locations: { regions: [{ key: creative.market }] },
      flexible_spec: [{ interests: [{ name: creative.persona }] }],
    },
    dailyBudget: budget * 100,
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
