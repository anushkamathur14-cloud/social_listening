import type { Channel } from "../channels";
import {
  FALLBACK_IMAGE,
  pickCityPhoto,
  unsplashImageUrl,
} from "../city-photos";
import type { Market, SignalType } from "../types";

export interface StockImage {
  url: string;
  alt: string;
  credit: string;
  creditUrl: string;
}

const CHANNEL_DIMS: Record<Channel, { w: number; h: number } | null> = {
  meta: { w: 1080, h: 1080 },
  smartly: { w: 1080, h: 1080 },
  display: { w: 300, h: 250 },
  google_search: null,
};

export function getStockImage(
  signalType: SignalType,
  channel: Channel,
  persona = "daily_commuter",
  market?: Market
): StockImage | undefined {
  const dims = CHANNEL_DIMS[channel];
  if (!dims) return undefined;

  const photo = pickCityPhoto(market, signalType, persona);
  return {
    url: unsplashImageUrl(photo, dims.w, dims.h),
    alt: photo.alt,
    credit: photo.credit,
    creditUrl:
      "https://unsplash.com/?utm_source=signal_ads_demo&utm_medium=referral",
  };
}

export function getFallbackImageUrl(channel: Channel): string | undefined {
  const dims = CHANNEL_DIMS[channel];
  if (!dims) return undefined;
  return unsplashImageUrl(FALLBACK_IMAGE, dims.w, dims.h);
}

export function getStockImageUrl(
  signalType: SignalType,
  channel: Channel,
  persona?: string,
  market?: Market
): string | undefined {
  return getStockImage(signalType, channel, persona, market)?.url;
}
