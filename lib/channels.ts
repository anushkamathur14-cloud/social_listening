export type Channel = "meta" | "display" | "google_search" | "smartly";

export type PublishAdapter = "meta" | "smartly" | "google_ads" | "dv360";

export interface ImageAssetSpec {
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  notes?: string;
}

export interface ChannelSpec {
  id: Channel;
  label: string;
  format: "image" | "text";
  /** Primary text / body field */
  copyLabel: string;
  copyTarget: number;
  copyMax: number;
  headlineMax: number;
  longHeadlineMax?: number;
  descriptionMax?: number;
  businessNameMax?: number;
  pathMax?: number;
  headlineCount?: number;
  descriptionCount?: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  imageAssets?: ImageAssetSpec[];
  ctaOptions: string[];
  bestPractices: string[];
  publishAdapter: PublishAdapter;
  publishLabel: string;
}

export const CHANNELS: ChannelSpec[] = [
  {
    id: "meta",
    label: "Meta (Facebook & Instagram)",
    format: "image",
    copyLabel: "Primary Text",
    copyTarget: 125,
    copyMax: 250,
    headlineMax: 40,
    descriptionMax: 30,
    imageWidth: 1080,
    imageHeight: 1080,
    aspectRatio: "1:1",
    imageAssets: [
      { label: "Square", width: 1080, height: 1080, aspectRatio: "1:1", notes: "Most versatile" },
      { label: "Portrait", width: 1080, height: 1350, aspectRatio: "4:5", notes: "Highest feed coverage" },
      { label: "Story/Reels", width: 1080, height: 1920, aspectRatio: "9:16", notes: "Keep text in safe zones · ~14% padding" },
    ],
    ctaOptions: ["Learn More", "Shop Now", "Sign Up", "Book Now"],
    bestPractices: [
      "Hook in first 125 characters",
      "Benefit-led headline ≤40 chars",
      "Mobile-first · captions for video",
      "Logo safe area — avoid edges",
    ],
    publishAdapter: "meta",
    publishLabel: "Meta Marketing API",
  },
  {
    id: "display",
    label: "Google Display (GDN / DV360)",
    format: "image",
    copyLabel: "Description",
    copyTarget: 90,
    copyMax: 90,
    headlineMax: 30,
    longHeadlineMax: 90,
    descriptionMax: 90,
    businessNameMax: 25,
    imageWidth: 1200,
    imageHeight: 628,
    aspectRatio: "1.91:1",
    imageAssets: [
      { label: "Landscape", width: 1200, height: 628, aspectRatio: "1.91:1" },
      { label: "Square", width: 1200, height: 1200, aspectRatio: "1:1" },
      { label: "Logo square", width: 1200, height: 1200, aspectRatio: "1:1" },
      { label: "Logo landscape", width: 1200, height: 300, aspectRatio: "4:1" },
    ],
    headlineCount: 5,
    descriptionCount: 5,
    ctaOptions: ["Learn More"],
    bestPractices: [
      "Responsive Display Ads — up to 5 short + 5 long headlines",
      "Lifestyle + product + logo + promotional images",
      "Business name ≤25 characters",
    ],
    publishAdapter: "dv360",
    publishLabel: "DV360 / Google Display",
  },
  {
    id: "google_search",
    label: "Google Search (RSA)",
    format: "text",
    copyLabel: "Description",
    copyTarget: 90,
    copyMax: 90,
    headlineMax: 30,
    descriptionMax: 90,
    pathMax: 15,
    headlineCount: 15,
    descriptionCount: 4,
    ctaOptions: ["Learn More", "Sign Up", "Get Offer"],
    bestPractices: [
      "Up to 15 headlines · 30 chars each",
      "Up to 4 descriptions · 90 chars each",
      "Mix: keyword, brand, value prop, offer, CTA, trust",
      "Paths ≤15 chars each",
    ],
    publishAdapter: "google_ads",
    publishLabel: "Google Ads API",
  },
  {
    id: "smartly",
    label: "Smartly (Cross-channel)",
    format: "image",
    copyLabel: "Primary Text",
    copyTarget: 125,
    copyMax: 250,
    headlineMax: 40,
    descriptionMax: 30,
    imageWidth: 1080,
    imageHeight: 1080,
    aspectRatio: "1:1",
    imageAssets: [
      { label: "Square", width: 1080, height: 1080, aspectRatio: "1:1" },
      { label: "Portrait", width: 1080, height: 1350, aspectRatio: "4:5" },
    ],
    ctaOptions: ["Learn More", "Shop Now", "Sign Up"],
    bestPractices: [
      "Cross-channel template — Meta + programmatic specs",
      "Hook in first 125 characters",
      "Multiple headline + image variants for testing",
    ],
    publishAdapter: "smartly",
    publishLabel: "Smartly.io API",
  },
];

export const CHANNEL_MAP = Object.fromEntries(
  CHANNELS.map((c) => [c.id, c])
) as Record<Channel, ChannelSpec>;

export const DEFAULT_CHANNELS: Channel[] = ["meta", "google_search"];

export function parseChannels(raw?: string): Channel[] {
  if (!raw) return DEFAULT_CHANNELS;
  try {
    const parsed = JSON.parse(raw) as Channel[];
    return parsed.filter((c) => CHANNEL_MAP[c]);
  } catch {
    return DEFAULT_CHANNELS;
  }
}

export function specSummary(channel: Channel): string {
  const s = CHANNEL_MAP[channel];
  if (s.format === "text") {
    return `${s.headlineCount} headlines · ${s.descriptionCount} descriptions · ${s.headlineMax} chars/headline`;
  }
  const img = s.imageAssets?.[0];
  return img
    ? `${img.width}×${img.height} (${img.aspectRatio}) · ${s.copyLabel} ${s.copyTarget}–${s.copyMax} chars`
    : `${s.copyLabel} ${s.copyTarget}–${s.copyMax} chars`;
}
