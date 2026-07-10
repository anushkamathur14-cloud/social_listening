import OpenAI from "openai";
import { nanoid } from "nanoid";
import { CHANNEL_MAP, type Channel } from "../channels";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";
import { getStockImageUrl } from "./stock-images";

const PERSONAS = ["commuter", "traveler", "local_shopper"] as const;

interface GeneratedCreative {
  persona: string;
  headline: string;
  copy: string;
  description?: string;
  cta: string;
  imagePrompt: string;
  productOffer?: string;
  visualTreatment?: string;
}

function delayMinutes(signal: Signal): number {
  return (signal.payload.avgDelayMinutes as number) ?? 45;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

function buildForChannel(
  signal: Signal,
  triggerId: string,
  channel: Channel,
  template: GeneratedCreative
): CreativeVariant {
  const spec = CHANNEL_MAP[channel];
  const summary = signal.payload.summary as string;
  const imageUrl =
    spec.format === "image"
      ? getStockImageUrl(signal.type, channel)
      : undefined;

  return stampAttribution({
    id: nanoid(),
    triggerId,
    signalId: signal.id,
    channel,
    persona: template.persona,
    market: signal.market,
    headline: truncate(template.headline, spec.headlineMax),
    copy: truncate(template.copy, spec.copyMax),
    description: template.description
      ? truncate(template.description, spec.descriptionMax ?? 90)
      : undefined,
    cta: template.cta,
    imagePrompt: template.imagePrompt,
    imageUrl,
    productOffer: template.productOffer,
    visualTreatment: template.visualTreatment,
    specLabel: `${spec.label} · ${spec.format === "image" ? `${spec.imageWidth}×${spec.imageHeight}` : "text-only"}`,
    signalContext: summary,
    signalSummary: summary,
    sourceUrl: signal.payload.sourceUrl as string | undefined,
    sourceLabel: signal.payload.sourceLabel as string | undefined,
    complianceStatus: "pending",
    createdAt: new Date().toISOString(),
  });
}

function templatesForSignal(signal: Signal): GeneratedCreative[] {
  const marketLabel = getMarketLabel(signal.market);
  const airport = (signal.payload.airport as string) ?? signal.market;
  const delay = delayMinutes(signal);
  const topic = (signal.payload.topic as string) ?? "local trend";

  const byType: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "commuter",
        headline: "Storm coming. You're covered.",
        copy: `${marketLabel}: pre-order rain gear, batteries & pantry staples — delivered before the rush.`,
        description: "Same-day weather prep kits. Free delivery over $35.",
        cta: "Shop Storm Kit",
        productOffer: "Weather Ready Bundle — free delivery over $35",
        visualTreatment: "Rain-streaked window, warm-lit product box",
        imagePrompt: "Emergency kit on windowsill, storm outside",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: `${delay} min delay? We come to you.`,
        copy: `Stuck at ${airport}? Chargers, snacks & comfort kits delivered to your gate in 45 min.`,
        description: "Terminal delivery at major airports. Code DELAY20 for 20% off.",
        cta: "Order to Gate",
        productOffer: `Terminal Delivery at ${airport}`,
        visualTreatment: "Traveler receiving bag at airport gate",
        imagePrompt: "Airport gate delivery, departure board background",
      },
    ],
    trends: [
      {
        persona: "local_shopper",
        headline: "Trending in your city",
        copy: `${marketLabel} is searching for this now. We stocked up — grab it before shelves clear.`,
        description: "Trending products with same-day delivery in your area.",
        cta: "Shop Trending",
        productOffer: "Trending Now — limited stock",
        visualTreatment: "Product flat lay with trend graph overlay",
        imagePrompt: "Trending product hero shot",
      },
    ],
    reddit: [
      {
        persona: "traveler",
        headline: "Reddit asked. We answered.",
        copy: `"${topic.slice(0, 50)}" is trending in ${marketLabel}. Here's the fix your city is talking about.`,
        description: "Community-driven offer based on local conversation.",
        cta: "See the Fix",
        productOffer: "Community Pick — local conversation",
        visualTreatment: "Social thread to product ad transition",
        imagePrompt: "Mobile social feed to product card",
      },
    ],
    social: [
      {
        persona: "local_shopper",
        headline: "Your city is buzzing",
        copy: `${marketLabel} is talking — we built an offer for this exact moment.`,
        description: "Signal-responsive offer, live for 48 hours.",
        cta: "Shop the Moment",
        productOffer: "48hr local offer",
        visualTreatment: "City skyline with social bubbles",
        imagePrompt: "Cityscape with notification overlays",
      },
    ],
  };

  return byType[signal.type] ?? byType.trends;
}

function mockCreatives(
  signal: Signal,
  triggerId: string,
  channels: Channel[]
): CreativeVariant[] {
  const baseTemplates = templatesForSignal(signal);
  const results: CreativeVariant[] = [];

  for (const channel of channels) {
    const spec = CHANNEL_MAP[channel];
    for (const template of baseTemplates) {
      // Google Search: text-only variant with description line
      if (spec.format === "text") {
        results.push(
          buildForChannel(signal, triggerId, channel, {
            ...template,
            headline: template.headline,
            copy: template.description ?? template.copy,
            description: template.productOffer,
            cta: "Learn More",
          })
        );
      } else {
        results.push(buildForChannel(signal, triggerId, channel, template));
      }
    }
  }

  return results;
}

export async function generateCreatives(
  signal: Signal,
  triggerId: string,
  channels: Channel[]
): Promise<CreativeVariant[]> {
  if (!config.openaiApiKey) {
    return mockCreatives(signal, triggerId, channels);
  }

  try {
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const summary = signal.payload.summary as string;
    const channelSpecs = channels
      .map((c) => {
        const s = CHANNEL_MAP[c];
        return `${c}: ${s.format}, headline≤${s.headlineMax}, copy≤${s.copyMax}`;
      })
      .join("; ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a senior paid social creative director. Generate FINISHED ad units per channel spec.
Return JSON: { "variants": [{ "channel", "persona", "headline", "copy", "description", "cta", "imagePrompt", "productOffer" }] }
One variant per channel. Respect character limits strictly.`,
        },
        {
          role: "user",
          content: `Channels: ${channelSpecs}
Signal: ${signal.type} in ${getMarketLabel(signal.market)}
Context: ${summary}
Generate one variant per channel.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return mockCreatives(signal, triggerId, channels);

    const parsed = JSON.parse(content) as {
      variants: (GeneratedCreative & { channel: Channel })[];
    };

    return parsed.variants
      .filter((v) => channels.includes(v.channel))
      .map((v) => buildForChannel(signal, triggerId, v.channel, v));
  } catch {
    return mockCreatives(signal, triggerId, channels);
  }
}

export async function generateIncrementalVariant(
  winningCreative: CreativeVariant,
  signal: Signal,
  channels: Channel[]
): Promise<CreativeVariant> {
  const variants = await generateCreatives(signal, winningCreative.triggerId, channels);
  const base = variants.find((v) => v.channel === winningCreative.channel) ?? variants[0];
  if (!base) return winningCreative;

  return stampAttribution({
    ...base,
    id: nanoid(),
    headline: truncate(`${winningCreative.headline} v2`, CHANNEL_MAP[base.channel as keyof typeof CHANNEL_MAP].headlineMax),
    copy: `Top performer variant. ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
