export type Channel = "meta" | "display" | "google_search" | "smartly";

export type PublishAdapter = "meta" | "smartly" | "google_ads" | "dv360";

export interface ChannelSpec {
  id: Channel;
  label: string;
  format: "image" | "text";
  headlineMax: number;
  copyMax: number;
  descriptionMax?: number;
  imageWidth?: number;
  imageHeight?: number;
  aspectRatio?: string;
  publishAdapter: PublishAdapter;
  publishLabel: string;
}

export const CHANNELS: ChannelSpec[] = [
  {
    id: "meta",
    label: "Meta (Facebook / Instagram)",
    format: "image",
    headlineMax: 40,
    copyMax: 125,
    imageWidth: 1080,
    imageHeight: 1080,
    aspectRatio: "1:1",
    publishAdapter: "meta",
    publishLabel: "Meta Marketing API",
  },
  {
    id: "display",
    label: "Display (Programmatic)",
    format: "image",
    headlineMax: 30,
    copyMax: 90,
    imageWidth: 1200,
    imageHeight: 628,
    aspectRatio: "1.91:1",
    publishAdapter: "dv360",
    publishLabel: "DV360 / Smartly Display",
  },
  {
    id: "google_search",
    label: "Google Search",
    format: "text",
    headlineMax: 30,
    copyMax: 90,
    descriptionMax: 90,
    publishAdapter: "google_ads",
    publishLabel: "Google Ads API",
  },
  {
    id: "smartly",
    label: "Smartly (Cross-channel)",
    format: "image",
    headlineMax: 40,
    copyMax: 125,
    imageWidth: 1080,
    imageHeight: 1080,
    aspectRatio: "1:1",
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
