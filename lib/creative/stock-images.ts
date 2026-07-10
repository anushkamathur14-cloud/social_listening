import type { SignalType } from "../types";
import type { Channel } from "../channels";

/** Unsplash stock images — free to use via source.unsplash.com / images.unsplash.com */
const STOCK_BY_SIGNAL: Record<SignalType, string[]> = {
  weather: [
    "https://images.unsplash.com/photo-1527482795447-68663c05ee75?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1534088568595-a066ffeb3e5c?w=1080&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1519692933481-1627890fd786?w=1080&h=1080&fit=crop",
  ],
  traffic: [
    "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1540962351504-0304e7a027b0?w=1080&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1529078155055-5d0fae9bc564?w=1080&h=1080&fit=crop",
  ],
  trends: [
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1080&h=1080&fit=crop",
  ],
  reddit: [
    "https://images.unsplash.com/photo-1611162616305-c69b3fa7fbe0?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1526621345602-895b5e3032b3?w=1080&h=1080&fit=crop",
  ],
  social: [
    "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=1080&h=1080&fit=crop",
  ],
};

const STOCK_BY_CHANNEL: Record<Channel, (signalType: SignalType) => string> = {
  meta: (t) => pickStock(t, "square"),
  display: (t) => pickStock(t, "landscape"),
  smartly: (t) => pickStock(t, "square"),
  google_search: () => "", // text-only, no image
};

function pickStock(signalType: SignalType, shape: "square" | "landscape"): string {
  const pool = STOCK_BY_SIGNAL[signalType] ?? STOCK_BY_SIGNAL.trends;
  if (shape === "landscape") {
    const landscape = pool.find((u) => u.includes("1200")) ?? pool[0];
    return landscape;
  }
  const square = pool.find((u) => u.includes("1080")) ?? pool[0];
  return square;
}

export function getStockImageUrl(
  signalType: SignalType,
  channel: Channel
): string | undefined {
  const fn = STOCK_BY_CHANNEL[channel];
  const url = fn(signalType);
  return url || undefined;
}
