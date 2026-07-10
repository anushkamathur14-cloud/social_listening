import OpenAI from "openai";
import { nanoid } from "nanoid";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";

const PERSONAS = ["commuter", "traveler", "local_shopper"] as const;

interface GeneratedCreative {
  persona: string;
  headline: string;
  copy: string;
  cta: string;
  imagePrompt: string;
  productOffer?: string;
  visualTreatment?: string;
}

function buildCreativeBase(
  signal: Signal,
  triggerId: string,
  template: GeneratedCreative
): CreativeVariant {
  const summary = signal.payload.summary as string;
  return stampAttribution({
    id: nanoid(),
    triggerId,
    signalId: signal.id,
    persona: template.persona,
    market: signal.market,
    headline: template.headline,
    copy: template.copy,
    cta: template.cta,
    imagePrompt: template.imagePrompt,
    productOffer: template.productOffer,
    visualTreatment: template.visualTreatment,
    signalContext: summary,
    signalSummary: summary,
    sourceUrl: signal.payload.sourceUrl as string | undefined,
    sourceLabel: signal.payload.sourceLabel as string | undefined,
    complianceStatus: "pending",
    createdAt: new Date().toISOString(),
  });
}

function delayMinutes(signal: Signal): number {
  return (signal.payload.avgDelayMinutes as number) ?? 45;
}

function mockCreatives(signal: Signal, triggerId: string): CreativeVariant[] {
  const summary = signal.payload.summary as string;
  const marketLabel = getMarketLabel(signal.market);
  const airport = (signal.payload.airport as string) ?? signal.market;
  const delay = delayMinutes(signal);

  const templates: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "commuter",
        headline: "Storm coming. You're covered.",
        copy: `Severe weather hitting ${marketLabel}? Pre-order rain gear, batteries & pantry staples — delivered before the rush. Same-day slots still open.`,
        cta: "Shop Storm Kit",
        productOffer: "Weather Ready Bundle — free delivery over $35",
        visualTreatment: "Hero: rain-streaked window with warm-lit product box on sill",
        imagePrompt: "Cozy apartment window, rain outside, curated emergency kit on table",
      },
      {
        persona: "local_shopper",
        headline: "Don't fight the forecast",
        copy: `${marketLabel} under weather alert. Skip sold-out aisles — order flood prep, flashlights & water in one tap. Arrives in 2 hours.`,
        cta: "Get Prepared",
        productOffer: "24hr Weather Prep — 15% off bundles",
        visualTreatment: "Before/after: empty store shelf vs. full doorstep delivery",
        imagePrompt: "Household essentials on doorstep, stormy sky background",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: `${delay} min delay? We come to you.`,
        copy: `Stuck at ${airport}? Order chargers, snacks & comfort kits delivered to your terminal gate. Skip the concession line — live tracking included.`,
        cta: "Order to Gate",
        productOffer: `Terminal Delivery at ${airport} — code DELAY20 for 20% off`,
        visualTreatment: "Split: red delay board vs. calm traveler receiving bag at gate",
        imagePrompt: "Traveler at airport gate receiving delivery bag, departure board blurred",
      },
      {
        persona: "commuter",
        headline: "ORD delays. Zero stress.",
        copy: `Flight pushed ${delay} min at ${marketLabel}? Turn wait time into comfort — neck pillows, headphones & snacks sent to your terminal in 45 min.`,
        cta: "Skip the Wait",
        productOffer: "Airport Comfort Kit — $24.99, gate delivery",
        visualTreatment: "UGC-style: phone order screen overlaid on busy terminal",
        imagePrompt: "Busy airport departure board, calm shopper on phone ordering",
      },
    ],
    trends: [
      {
        persona: "local_shopper",
        headline: "Trending in your city",
        copy: `${marketLabel} is searching hard for this right now. We stocked up early — grab it before the spike clears shelves.`,
        cta: "Shop Trending",
        productOffer: "Trending Now — limited stock, free same-day",
        visualTreatment: "Trend graph animation morphing into product hero shot",
        imagePrompt: "Trending product flat lay, social media aesthetic",
      },
    ],
    reddit: [
      {
        persona: "traveler",
        headline: "Reddit asked. We answered.",
        copy: `"${(signal.payload.topic as string)?.slice(0, 60) ?? "Local thread trending"}" — ${(signal.payload.snippet as string)?.slice(0, 80) ?? ""} Here's the product fix ${marketLabel} is talking about.`,
        cta: "See the Fix",
        productOffer: "Community Pick — based on local conversation",
        visualTreatment: "Reddit post card transitions into polished product ad",
        imagePrompt: "Social thread UI fading into clean product hero on mobile",
      },
    ],
    social: [
      {
        persona: "local_shopper",
        headline: "Your city is buzzing",
        copy: `${marketLabel} is talking — and we built an offer for exactly this moment. Tap in before the conversation moves on.`,
        cta: "Shop the Moment",
        productOffer: "Signal-Responsive Offer — live for 48hrs",
        visualTreatment: "City skyline with floating social bubbles resolving to brand CTA",
        imagePrompt: "City skyline with social notification bubbles",
      },
    ],
  };

  const typeTemplates = templates[signal.type] ?? templates.trends;
  return typeTemplates.map((t) => buildCreativeBase(signal, triggerId, t));
}

export async function generateCreatives(
  signal: Signal,
  triggerId: string
): Promise<CreativeVariant[]> {
  if (!config.openaiApiKey) {
    return mockCreatives(signal, triggerId);
  }

  try {
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const summary = signal.payload.summary as string;
    const sourceLabel = signal.payload.sourceLabel ?? "unknown source";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior paid social creative director at a DTC brand. Generate FINISHED ad units ready for Meta/Instagram — not briefs or ideas.

Rules:
- Write like a real ad: punchy headline, benefit-led body, specific product/offer
- Include productOffer (specific deal/bundle) and visualTreatment (1-line art direction)
- Headline max 40 chars, primary text max 125 chars
- Reference the signal naturally (weather delay, trend, Reddit thread) — don't describe the pipeline
- No meta language like "triggered by" or "signal detected"
- Return JSON: { "variants": [{ "persona", "headline", "copy", "cta", "imagePrompt", "productOffer", "visualTreatment" }] }
- Generate 3 variants for personas: ${PERSONAS.join(", ")}`,
        },
        {
          role: "user",
          content: `Signal type: ${signal.type}
Market: ${getMarketLabel(signal.market)}
Source: ${sourceLabel}
Context: ${summary}
Topic: ${signal.payload.topic ?? "n/a"}
Snippet: ${signal.payload.snippet ?? "n/a"}
Generate 3 creative variants.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return mockCreatives(signal, triggerId);

    const parsed = JSON.parse(content) as { variants: GeneratedCreative[] };

    return parsed.variants.slice(0, 6).map((v) =>
      stampAttribution({
        id: nanoid(),
        triggerId,
        signalId: signal.id,
        persona: v.persona,
        market: signal.market as Market,
        headline: v.headline.slice(0, 40),
        copy: v.copy.slice(0, 200),
        cta: v.cta,
        imagePrompt: v.imagePrompt,
        productOffer: v.productOffer,
        visualTreatment: v.visualTreatment,
        signalContext: summary,
        signalSummary: summary,
        sourceUrl: signal.payload.sourceUrl as string | undefined,
        sourceLabel: signal.payload.sourceLabel as string | undefined,
        complianceStatus: "pending",
        createdAt: new Date().toISOString(),
      })
    );
  } catch {
    return mockCreatives(signal, triggerId);
  }
}

export async function generateIncrementalVariant(
  winningCreative: CreativeVariant,
  signal: Signal
): Promise<CreativeVariant> {
  const variants = await generateCreatives(signal, winningCreative.triggerId);
  const base = variants[0] ?? mockCreatives(signal, winningCreative.triggerId)[0];

  return stampAttribution({
    ...base,
    id: nanoid(),
    headline: `${winningCreative.headline}`.slice(0, 36) + " v2",
    copy: `Top performer variant: ${winningCreative.copy.slice(0, 80)}... ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
