import OpenAI from "openai";
import { nanoid } from "nanoid";
import { brand, BRAND_SYSTEM_PROMPT } from "../brand";
import { CHANNEL_MAP, type Channel } from "../channels";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";
import { getStockImageUrl } from "./stock-images";

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
  const topic = (signal.payload.topic as string) ?? "local food trend";
  const beerNote = "21+ for beer.";

  const byType: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "comfort_food_lover",
        headline: "Storm night? Comfort food's here.",
        copy: `${marketLabel} weather alert — curl up with our Storm Comfort Box: soups, kettle chips, craft beer & hot cocoa. Delivered in 45 min.`,
        description: `${brand.products.stormKit}. Free delivery over $40.`,
        cta: "Order Comfort Box",
        productOffer: brand.products.stormKit,
        visualTreatment: "Cozy spread: soup, chips, beer on rainy window sill",
        imagePrompt: "Comfort food flat lay, stormy window, warm lighting",
      },
      {
        persona: "game_day_fan",
        headline: "Rain out? Party in.",
        copy: `Game cancelled by weather in ${marketLabel}? Host indoors — wings, loaded nachos, beer 6-packs delivered before kickoff.`,
        description: `${brand.products.gameDay}. ${beerNote}`,
        cta: "Get Game Day Box",
        productOffer: brand.products.gameDay,
        visualTreatment: "Living room game setup with snacks and beer",
        imagePrompt: "Game day snacks and beer on coffee table",
      },
    ],
    traffic: [
      {
        persona: "airport_traveler",
        headline: `${delay} min delay? Snacks en route.`,
        copy: `Stuck at ${airport}? Our Gate Delay Pack hits your terminal — craft beer, trail mix, beef jerky & sparkling water. 45-min delivery.`,
        description: `${brand.products.airportPack}. Code DELAY20 for 20% off. ${beerNote}`,
        cta: "Order to Gate",
        productOffer: brand.products.airportPack,
        visualTreatment: "Traveler with snack bag and beer at airport gate",
        imagePrompt: "Airport gate snack and beer delivery",
      },
    ],
    trends: [
      {
        persona: "comfort_food_lover",
        headline: "Your city can't stop searching this",
        copy: `${marketLabel} is trending hard on snack bundles & craft beer. We stocked up — same-day delivery before it sells out.`,
        description: brand.products.trendBundle,
        cta: "Shop Trending",
        productOffer: "Trending F&B Bundle — limited stock",
        visualTreatment: "Craft beer and artisan snacks hero shot",
        imagePrompt: "Trending snacks and craft beer flat lay",
      },
    ],
    reddit: [
      {
        persona: "game_day_fan",
        headline: "Reddit's hungry. We're ready.",
        copy: `"${topic.slice(0, 45)}" is blowing up in ${marketLabel}. ${brand.name} built a bundle for exactly this craving.`,
        description: brand.products.redditPick,
        cta: "Grab the Box",
        productOffer: brand.products.redditPick,
        visualTreatment: "Reddit thread fades into appetizing food spread",
        imagePrompt: "Social thread to snack bundle product shot",
      },
    ],
    social: [
      {
        persona: "comfort_food_lover",
        headline: `${marketLabel} is talking food`,
        copy: `Local buzz = local flavors. ${brand.name} drops a limited snack & beer bundle matched to what's trending right now.`,
        description: "48-hour signal-responsive F&B offer.",
        cta: "Order Now",
        productOffer: "Local Cravings Box — 48hr only",
        visualTreatment: "City food scene with delivery bag",
        imagePrompt: "Urban food delivery with snacks and beverages",
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
      if (spec.format === "text") {
        results.push(
          buildForChannel(signal, triggerId, channel, {
            ...template,
            copy: template.description ?? template.copy,
            description: template.productOffer,
            cta: "Order Delivery",
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
          content: `${BRAND_SYSTEM_PROMPT}
Return JSON: { "variants": [{ "channel", "persona", "headline", "copy", "description", "cta", "imagePrompt", "productOffer" }] }
One variant per channel. Respect character limits.`,
        },
        {
          role: "user",
          content: `Channels: ${channelSpecs}
Signal: ${signal.type} in ${getMarketLabel(signal.market)}
Context: ${summary}
Topic: ${signal.payload.topic ?? "n/a"}
Generate one F&B ad variant per channel.`,
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
    copy: `Top F&B performer. ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
