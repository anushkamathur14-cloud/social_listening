import OpenAI from "openai";
import { nanoid } from "nanoid";
import { brand, BRAND_SYSTEM_PROMPT } from "../brand";
import { CHANNEL_MAP, type Channel } from "../channels";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";
import { getStockImageUrl, getUnsplashCredit } from "./stock-images";

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
    visualTreatment: template.visualTreatment
      ? `${template.visualTreatment} · ${getUnsplashCredit(signal.type)}`
      : getUnsplashCredit(signal.type),
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
  const topic = (signal.payload.topic as string) ?? "local mobility trend";
  const terms = brand.promoDisclaimer;

  const byType: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "daily_commuter",
        headline: "Storm coming? Don't drive.",
        copy: `${marketLabel} weather alert — new riders get up to $5 off your next Uber trip. Stay safe, skip the stress.`,
        description: `${brand.offers.ridesFirstTrip}. ${terms}`,
        cta: "Get Your First Ride",
        productOffer: "Uber Rides · New user acquisition",
        visualTreatment: "Rainy city street, car headlights — Unsplash",
        imagePrompt: "Rainy urban street at night, ride-hailing mood",
      },
      {
        persona: "foodie",
        headline: "Stay in. Uber Eats it.",
        copy: `Bad weather in ${marketLabel}? New users — $0 delivery fee on your first 3 Uber Eats orders. Comfort food without leaving home.`,
        description: brand.offers.eatsNewUser,
        cta: "Order on Uber Eats",
        productOffer: "Uber Eats · New user acquisition",
        visualTreatment: "Food delivery bag at doorstep, rain — Unsplash",
        imagePrompt: "Food delivery at apartment door, storm outside",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: `${delay} min delay? Uber's ready.`,
        copy: `Flight delayed at ${airport}? New riders — 15% off your first Uber trip to the terminal. Reliable pickup when travel gets messy.`,
        description: `${brand.offers.airportPickup}. ${terms}`,
        cta: "Book Airport Ride",
        productOffer: "Uber Rides · Travel acquisition",
        visualTreatment: "Airport terminal, traveler with phone — Unsplash",
        imagePrompt: "Airport departure hall, traveler booking ride",
      },
    ],
    trends: [
      {
        persona: "foodie",
        headline: "Your city is searching this",
        copy: `${marketLabel} is spiking on food delivery searches. New to Uber Eats? $0 delivery on first 3 orders — trending restaurants near you.`,
        description: brand.offers.trendFood,
        cta: "Try Uber Eats",
        productOffer: "Uber Eats · Trend-led UA",
        visualTreatment: "Restaurant food spread — Unsplash",
        imagePrompt: "Trending restaurant dishes, delivery context",
      },
      {
        persona: "daily_commuter",
        headline: "Everyone's riding today",
        copy: `Mobility searches up in ${marketLabel}. First Uber trip up to $5 off — get there without the hassle.`,
        description: brand.offers.ridesFirstTrip,
        cta: "Ride with Uber",
        productOffer: "Uber Rides · Trend-led UA",
        visualTreatment: "City street at dusk — Unsplash",
        imagePrompt: "Urban commute, city lights",
      },
    ],
    reddit: [
      {
        persona: "foodie",
        headline: "Reddit's talking. We're listening.",
        copy: `"${topic.slice(0, 45)}" trending in ${marketLabel}. Uber Eats — new users get $0 delivery on first 3 orders. Join the conversation.`,
        description: brand.offers.redditLocal,
        cta: "Get Uber Eats",
        productOffer: "Uber Eats · Social-led UA",
        visualTreatment: "Phone with food app, city backdrop — Unsplash",
        imagePrompt: "Mobile food ordering in urban setting",
      },
      {
        persona: "traveler",
        headline: "Travel hack from your city",
        copy: `Locals in ${marketLabel} are discussing travel headaches. New riders — first trip up to $5 off with Uber. ${terms}`,
        description: brand.offers.ridesFirstTrip,
        cta: "Sign Up & Ride",
        productOffer: "Uber Rides · Social-led UA",
        visualTreatment: "Traveler at airport — Unsplash",
        imagePrompt: "Airport travel, smartphone ride booking",
      },
    ],
    social: [
      {
        persona: "daily_commuter",
        headline: `${marketLabel} is moving with Uber`,
        copy: `Local buzz = real demand. New users — up to $5 off first ride or $0 delivery on Uber Eats. One app, your whole city.`,
        description: brand.promoDisclaimer,
        cta: "Download Uber",
        productOffer: "Cross-vertical UA · Rides + Eats",
        visualTreatment: "City skyline at night — Unsplash",
        imagePrompt: "Urban mobility, city lights",
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
    for (const template of baseTemplates.slice(0, channel === "google_search" ? 1 : 2)) {
      if (spec.format === "text") {
        results.push(
          buildForChannel(signal, triggerId, channel, {
            ...template,
            copy: template.description ?? template.copy,
            description: template.productOffer,
            cta: "Sign Up",
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
One UA variant per channel.`,
        },
        {
          role: "user",
          content: `Channels: ${channelSpecs}
Signal: ${signal.type} in ${getMarketLabel(signal.market)}
Context: ${summary}
Goal: new user sign-up for the best-matched Uber vertical (Rides, Eats, or Travel).`,
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
    copy: `Top UA variant. ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
