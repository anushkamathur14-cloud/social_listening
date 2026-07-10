import { brand } from "../brand";
import { CHANNEL_MAP, type Channel } from "../channels";
import type { Market } from "../types";

export interface MetaExtras {
  kind: "meta";
  hookLine: string;
  problemLine: string;
  solutionLine: string;
  creativeNotes: string[];
}

export interface DisplayExtras {
  kind: "display";
  businessName: string;
  shortHeadlines: string[];
  longHeadlines: string[];
  descriptions: string[];
  imagesNeeded: string[];
}

export interface RsaVariant {
  text: string;
  role: string;
}

export interface SearchExtras {
  kind: "search";
  headlines: RsaVariant[];
  descriptions: RsaVariant[];
  path1: string;
  path2: string;
  displayUrl: string;
}

export type ChannelPayload = MetaExtras | DisplayExtras | SearchExtras;

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 3) + "...";
}

export function buildMetaPrimaryText(
  hook: string,
  problem: string,
  solution: string,
  disclaimer: string
): string {
  const body = `${hook} ${problem} ${solution} ${disclaimer}`.trim();
  return truncate(body, CHANNEL_MAP.meta.copyMax);
}

export function buildMetaExtras(
  hook: string,
  problem: string,
  solution: string
): MetaExtras {
  return {
    kind: "meta",
    hookLine: truncate(hook, CHANNEL_MAP.meta.copyTarget),
    problemLine: truncate(problem, 80),
    solutionLine: truncate(solution, 80),
    creativeNotes: [
      "Brand logo in safe zone",
      "Product hero · city-specific imagery",
      "Mobile-first layout",
      "CTA button visible above fold",
    ],
  };
}

export function buildDisplayExtras(
  market: Market,
  shortHeadline: string,
  longHeadline: string,
  description: string,
  offer: string
): DisplayExtras {
  const city = market;
  return {
    kind: "display",
    businessName: truncate("Uber", CHANNEL_MAP.display.businessNameMax ?? 25),
    shortHeadlines: [
      truncate(shortHeadline, 30),
      truncate(`${city} Rides`, 30),
      truncate("New User Offer", 30),
      truncate("Book Your Ride", 30),
      truncate("Official Uber", 30),
    ],
    longHeadlines: [
      truncate(longHeadline, 90),
      truncate(`${offer} — ${city} new riders`, 90),
      truncate(`Reliable rides & delivery in ${city}`, 90),
      truncate(`${brand.name} · Rides, Eats & Travel`, 90),
      truncate(`Signal-led promo for ${city} demand`, 90),
    ],
    descriptions: [
      truncate(description, 90),
      truncate(`${offer}. Terms apply. Download the app.`, 90),
      truncate(`Get around ${city} with ${brand.name}. New user promos available.`, 90),
      truncate(`Trusted mobility in ${city}. Rides & Eats in one app.`, 90),
      truncate(`Book today. ${brand.promoDisclaimer}`, 90),
    ],
    imagesNeeded: [
      "300×250 Medium Rectangle",
      "728×90 Leaderboard",
      "300×600 Half Page",
      "320×50 Mobile Banner",
      "970×250 Billboard",
    ],
  };
}

export function buildSearchExtras(
  market: Market,
  headline: string,
  description: string,
  offer: string,
  vertical: string
): SearchExtras {
  const headlineVariants: RsaVariant[] = [
    { text: truncate(headline, 30), role: "Primary keyword" },
    { text: truncate(`${market} Uber ${vertical}`, 30), role: "Brand + geo" },
    { text: truncate("New User Offer", 30), role: "Offer" },
    { text: truncate("Book Today", 30), role: "CTA" },
    { text: truncate("Official Site", 30), role: "Brand" },
    { text: truncate(offer.slice(0, 30), 30), role: "Offer" },
    { text: truncate("Download Uber", 30), role: "CTA" },
    { text: truncate(`${vertical} in ${market}`, 30), role: "Keyword" },
    { text: truncate("Trusted by Millions", 30), role: "Trust signal" },
    { text: truncate("Get Your First Ride", 30), role: "CTA" },
    { text: truncate("Uber Eats Delivery", 30), role: "Product" },
    { text: truncate("Sign Up & Save", 30), role: "Offer" },
    { text: truncate(`${market} Airport Rides`, 30), role: "Keyword" },
    { text: truncate("Ride or Order Eats", 30), role: "Cross-sell" },
    { text: truncate("Free App Download", 30), role: "CTA" },
  ].filter((h, i, arr) => h.text && arr.findIndex((x) => x.text === h.text) === i);

  const descriptionVariants: RsaVariant[] = [
    {
      text: truncate(description, 90),
      role: "Benefit + keyword + CTA",
    },
    {
      text: truncate(`${offer} in ${market}. ${brand.promoDisclaimer}`, 90),
      role: "Offer + terms",
    },
    {
      text: truncate(
        `Discover ${brand.name} ${vertical.toLowerCase()} with easy booking. Sign up today.`,
        90
      ),
      role: "Value prop + sign-up",
    },
    {
      text: truncate(
        `Trusted rides & delivery in ${market}. Download the app and save on your first trip.`,
        90
      ),
      role: "Trust + download",
    },
  ];

  return {
    kind: "search",
    headlines: headlineVariants.slice(
      0,
      CHANNEL_MAP.google_search.headlineCount ?? 15
    ),
    descriptions: descriptionVariants.slice(
      0,
      CHANNEL_MAP.google_search.descriptionCount ?? 4
    ),
    path1: truncate(vertical.toLowerCase().replace(/\s+/g, ""), 15),
    path2: truncate("offer", 15),
    displayUrl: "www.uber.com",
  };
}

export function normalizeSearchPayload(
  payload: SearchExtras | { kind: "search"; headlines: (RsaVariant | string)[]; descriptions: (RsaVariant | string)[]; path1: string; path2: string; displayUrl: string }
): SearchExtras {
  const headlineRoles = [
    "Primary keyword",
    "Brand + geo",
    "Offer",
    "CTA",
    "Brand",
    "Offer",
    "CTA",
    "Keyword",
    "Trust signal",
    "CTA",
    "Product",
    "Offer",
    "Keyword",
    "Cross-sell",
    "CTA",
  ];
  const descriptionRoles = [
    "Benefit + keyword + CTA",
    "Offer + terms",
    "Value prop + sign-up",
    "Trust + download",
  ];

  return {
    ...payload,
    headlines: payload.headlines.map((h, i) =>
      typeof h === "string"
        ? { text: h, role: headlineRoles[i] ?? "Variant" }
        : h
    ),
    descriptions: payload.descriptions.map((d, i) =>
      typeof d === "string"
        ? { text: d, role: descriptionRoles[i] ?? "Variant" }
        : d
    ),
  };
}

export function parseChannelPayload(raw?: string | null): ChannelPayload | undefined {
  if (!raw) return undefined;
  try {
    const parsed = JSON.parse(raw) as ChannelPayload;
    if (parsed.kind === "search") {
      return normalizeSearchPayload(parsed);
    }
    return parsed;
  } catch {
    return undefined;
  }
}

export function channelPayloadForChannel(
  channel: Channel,
  payload?: ChannelPayload
): ChannelPayload | undefined {
  if (!payload || payload.kind === channel || (channel === "smartly" && payload.kind === "meta")) {
    return payload;
  }
  if (channel === "smartly" && payload.kind === "meta") return payload;
  return payload.kind === channel ? payload : undefined;
}
