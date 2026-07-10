/**
 * Smartly.io adapter — NOT wired in demo mode.
 *
 * In production, this module would:
 * 1. POST creative payload to Smartly's Creative API or feed a dynamic template
 * 2. Map our CreativeVariant → Smartly ad template variables
 * 3. Return platform ad set / campaign IDs for tracking
 *
 * Demo uses lib/deploy/simulator.ts instead.
 */

import type { Campaign, CreativeVariant } from "../../types";

export interface SmartlyDeployPayload {
  templateId: string;
  variables: {
    headline: string;
    primaryText: string;
    cta: string;
    imageUrl?: string;
    market: string;
    persona: string;
  };
  targeting: {
    geo: string;
    persona: string;
  };
  budget: number;
}

export function toSmartlyPayload(
  creative: CreativeVariant,
  budget: number
): SmartlyDeployPayload {
  return {
    templateId: "signal-responsive-v1",
    variables: {
      headline: creative.headline,
      primaryText: creative.copy,
      cta: creative.cta,
      imageUrl: creative.imageUrl,
      market: creative.market,
      persona: creative.persona,
    },
    targeting: {
      geo: creative.market,
      persona: creative.persona,
    },
    budget,
  };
}

export async function deployToSmartly(
  _creative: CreativeVariant,
  _budget: number
): Promise<Campaign> {
  throw new Error(
    "Smartly API not configured. Set SMARTLY_API_KEY and replace simulator with this adapter."
  );
}
