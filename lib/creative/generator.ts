import OpenAI from "openai";
import { nanoid } from "nanoid";
import { brand, BRAND_SYSTEM_PROMPT } from "../brand";
import { CHANNEL_MAP, specSummary, type Channel } from "../channels";
import {
  buildDisplayExtras,
  buildMetaExtras,
  buildMetaPrimaryText,
  buildSearchExtras,
  truncate,
} from "./channel-payload";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { ChannelPayload, CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";
import { getStockImage } from "./stock-images";
import { resolveLlm, type LlmRunOptions } from "./llm-config";

interface GeneratedCreative {
  persona: string;
  headline: string;
  hook: string;
  problem: string;
  solution: string;
  description?: string;
  cta: string;
  imagePrompt: string;
  productOffer?: string;
  visualTreatment?: string;
  vertical?: string;
}

function delayMinutes(signal: Signal): number {
  return (signal.payload.avgDelayMinutes as number) ?? 45;
}

function buildForChannel(
  signal: Signal,
  triggerId: string,
  channel: Channel,
  template: GeneratedCreative
): CreativeVariant {
  const spec = CHANNEL_MAP[channel];
  const summary = signal.payload.summary as string;
  const marketLabel = getMarketLabel(signal.market);
  const offer =
    template.productOffer?.includes("Eats")
      ? brand.offers.eatsNewUser
      : brand.offers.ridesFirstTrip;
  const vertical =
    template.vertical ??
    (template.productOffer?.includes("Eats")
      ? "Eats"
      : template.productOffer?.includes("Travel")
        ? "Travel"
        : "Rides");

  let headline = template.headline;
  let copy = "";
  let description = template.description;
  let channelPayload: ChannelPayload | undefined;

  const hook = template.hook || template.headline;
  const problem = template.problem || summary;
  const solution = template.solution || offer;

  if (channel === "meta" || channel === "smartly") {
    copy = buildMetaPrimaryText(hook, problem, solution, brand.promoDisclaimer);
    headline = truncate(template.headline, spec.headlineMax);
    description = template.description
      ? truncate(template.description, spec.descriptionMax ?? 30)
      : truncate(offer, spec.descriptionMax ?? 30);
    channelPayload = buildMetaExtras(hook, problem, solution);
  } else if (channel === "display") {
    const short = truncate(template.headline, spec.headlineMax);
    const long = truncate(`${template.headline} — ${offer}`, spec.longHeadlineMax ?? 90);
    const desc = truncate(
      `${solution} ${brand.promoDisclaimer}`,
      spec.descriptionMax ?? 90
    );
    headline = short;
    copy = desc;
    description = desc;
    channelPayload = buildDisplayExtras(
      signal.market,
      short,
      long,
      desc,
      offer
    );
  } else if (channel === "google_search") {
    const desc = truncate(
      `${solution} ${brand.promoDisclaimer}`,
      spec.descriptionMax ?? 90
    );
    headline = truncate(template.headline, spec.headlineMax);
    copy = desc;
    description = desc;
    channelPayload = buildSearchExtras(
      signal.market,
      template.headline,
      desc,
      offer,
      vertical
    );
  } else {
    copy = buildMetaPrimaryText(hook, problem, solution, brand.promoDisclaimer);
    headline = truncate(template.headline, spec.headlineMax);
  }

  const stock =
    spec.format === "image"
      ? getStockImage(signal.type, channel, template.persona, signal.market)
      : undefined;

  const primaryAsset = spec.imageAssets?.[0];

  return stampAttribution({
    id: nanoid(),
    triggerId,
    signalId: signal.id,
    channel,
    persona: template.persona,
    market: signal.market,
    headline,
    copy,
    description,
    cta: template.cta,
    imagePrompt: template.imagePrompt,
    imageUrl: stock?.url,
    imageAlt: stock?.alt,
    imageCredit: stock?.credit,
    imageCreditUrl: stock?.creditUrl,
    productOffer: template.productOffer,
    visualTreatment: template.visualTreatment,
    channelPayload,
    specLabel: `${spec.label} · ${specSummary(channel)}`,
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
  const terms = brand.promoDisclaimer;

  const byType: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "daily_commuter",
        headline: "Storm coming? Don't drive.",
        hook: "Storm alert — skip the stress.",
        problem: `${marketLabel} weather is rough right now.`,
        solution: `New riders get up to $5 off your next Uber trip.`,
        description: truncate(`${brand.offers.ridesFirstTrip}. ${terms}`, 30),
        cta: "Get Your First Ride",
        productOffer: "Uber Rides · New user acquisition",
        vertical: "Rides",
        visualTreatment: "Rainy city street — mobile-first · logo safe zone",
        imagePrompt: "Rainy urban street at night, ride-hailing mood",
      },
      {
        persona: "foodie",
        headline: "Stay in. Uber Eats it.",
        hook: "Bad weather? Stay cozy.",
        problem: `Storms in ${marketLabel} — nobody wants to cook.`,
        solution: `New users: $0 delivery on your first 3 Uber Eats orders.`,
        description: truncate(brand.offers.eatsNewUser, 30),
        cta: "Order on Uber Eats",
        productOffer: "Uber Eats · New user acquisition",
        vertical: "Eats",
        visualTreatment: "Food delivery at doorstep — 1:1 + 4:5 variants",
        imagePrompt: "Food delivery at apartment door, storm outside",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: `${delay} min delay? Uber's ready.`,
        hook: "Flight delayed? We've got you.",
        problem: `${airport} avg delay ${delay} minutes — terminals are chaos.`,
        solution: `New riders: 15% off your first Uber trip to the terminal.`,
        description: truncate(`${brand.offers.airportPickup}. ${terms}`, 30),
        cta: "Book Airport Ride",
        productOffer: "Uber Rides · Travel acquisition",
        vertical: "Travel",
        visualTreatment: "Airport terminal · traveler with phone",
        imagePrompt: "Airport departure hall, traveler booking ride",
      },
    ],
    trends: [
      {
        persona: "foodie",
        headline: "Your city is searching this",
        hook: "Trending now in your city.",
        problem: `${marketLabel} food delivery searches are spiking.`,
        solution: `New to Uber Eats? $0 delivery on first 3 orders.`,
        description: truncate(brand.offers.trendFood, 30),
        cta: "Try Uber Eats",
        productOffer: "Uber Eats · Trend-led UA",
        vertical: "Eats",
        visualTreatment: "Restaurant food spread — lifestyle hero",
        imagePrompt: "Trending restaurant dishes, delivery context",
      },
      {
        persona: "daily_commuter",
        headline: "Everyone's riding today",
        hook: "Mobility demand is up.",
        problem: `Ride searches surging in ${marketLabel}.`,
        solution: `First Uber trip up to $5 off — book in seconds.`,
        description: truncate(brand.offers.ridesFirstTrip, 30),
        cta: "Ride with Uber",
        productOffer: "Uber Rides · Trend-led UA",
        vertical: "Rides",
        visualTreatment: "City street at dusk — product hero",
        imagePrompt: "Urban commute, city lights",
      },
    ],
    reddit: [
      {
        persona: "foodie",
        headline: "Your neighbors are ordering in",
        hook: "Locals are talking delivery.",
        problem: `Community threads in ${marketLabel} are buzzing about food delivery.`,
        solution: `New to Uber Eats? $0 delivery on your first 3 orders.`,
        description: truncate(brand.offers.eatsNewUser, 30),
        cta: "Try Uber Eats",
        productOffer: "Uber Eats · Community-led UA",
        vertical: "Eats",
        visualTreatment: "Food delivery at home — social proof angle",
        imagePrompt: "Person receiving food delivery at home",
      },
      {
        persona: "traveler",
        headline: "Need a ride? Locals agree",
        hook: "Travelers are asking about rides.",
        problem: `Airport & commute threads active in ${marketLabel}.`,
        solution: `New riders get up to $5 off your first Uber trip.`,
        description: truncate(brand.offers.ridesFirstTrip, 30),
        cta: "Get Your First Ride",
        productOffer: "Uber Rides · Community-led UA",
        vertical: "Rides",
        visualTreatment: "Traveler booking a ride — trust signal",
        imagePrompt: "Traveler using phone to book airport ride",
      },
    ],
    social: [
      {
        persona: "daily_commuter",
        headline: `${marketLabel} is moving with Uber`,
        hook: "Local buzz = real demand.",
        problem: `Social chatter is up in ${marketLabel}.`,
        solution: `New users — up to $5 off first ride or $0 Eats delivery.`,
        description: truncate(brand.promoDisclaimer, 30),
        cta: "Download Uber",
        productOffer: "Cross-vertical UA · Rides + Eats",
        vertical: "Rides",
        visualTreatment: "City skyline — brand logo safe area",
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
    const templates =
      channel === "google_search" || channel === "display"
        ? baseTemplates.slice(0, 1)
        : baseTemplates.slice(0, 2);

    for (const template of templates) {
      results.push(buildForChannel(signal, triggerId, channel, template));
    }
  }

  return results;
}

export async function generateCreatives(
  signal: Signal,
  triggerId: string,
  channels: Channel[],
  llmOptions?: LlmRunOptions
): Promise<CreativeVariant[]> {
  const llm = resolveLlm(llmOptions);
  if (!llm.apiKey) {
    return mockCreatives(signal, triggerId, channels);
  }

  try {
    const openai = new OpenAI({ apiKey: llm.apiKey });
    const summary = signal.payload.summary as string;
    const channelSpecs = channels
      .map((c) => {
        const s = CHANNEL_MAP[c];
        if (c === "meta" || c === "smartly") {
          return `${c}: Primary Text ${s.copyTarget}-${s.copyMax} (hook first 125), headline≤${s.headlineMax}, description≤${s.descriptionMax}`;
        }
        if (c === "google_search") {
          return `${c}: RSA — ${s.headlineCount} headlines≤${s.headlineMax}, ${s.descriptionCount} descriptions≤${s.descriptionMax}, paths≤${s.pathMax}`;
        }
        if (c === "display") {
          const sizes = (s.imageAssets ?? []).map((img) => `${img.width}×${img.height}`).join(", ");
          return `${c}: IAB banners ${sizes} · short headline≤${s.headlineMax}, long≤${s.longHeadlineMax}, description≤${s.descriptionMax}, business name≤${s.businessNameMax}`;
        }
        return `${c}: headline≤${s.headlineMax}, copy≤${s.copyMax}`;
      })
      .join("; ");

    const directionParts = [
      llm.brandVoice ? `Brand voice: ${llm.brandVoice}` : null,
      llm.customBrief ? `Custom direction: ${llm.customBrief}` : null,
    ].filter(Boolean);

    const response = await openai.chat.completions.create({
      model: llm.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${BRAND_SYSTEM_PROMPT}
Return JSON: { "variants": [{ "channel", "persona", "headline", "hook", "problem", "solution", "description", "cta", "imagePrompt", "productOffer", "vertical" }] }
One UA variant per channel. Follow platform character limits and best practices.`,
        },
        {
          role: "user",
          content: `Channels: ${channelSpecs}
Signal: ${signal.type} in ${getMarketLabel(signal.market)}
Context: ${summary}
Goal: new user sign-up for the best-matched Uber vertical (Rides, Eats, or Travel).
${directionParts.length ? `\n${directionParts.join("\n")}` : ""}`,
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
    headline: truncate(
      `${winningCreative.headline} v2`,
      CHANNEL_MAP[base.channel].headlineMax
    ),
    copy: `Top UA variant. ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
