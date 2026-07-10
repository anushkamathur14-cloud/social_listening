import type { SignalType } from "../types";
import type { Channel } from "../channels";

/** F&B stock photography — snacks, beer, comfort food, game day */
const STOCK_BY_SIGNAL: Record<SignalType, string[]> = {
  weather: [
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1080&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=1080&h=1080&fit=crop",
  ],
  traffic: [
    "https://images.unsplash.com/photo-1625937286074-950ca88484dc?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1080&h=1080&fit=crop",
    "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=1080&h=1080&fit=crop",
  ],
  trends: [
    "https://images.unsplash.com/photo-1608270861620-805e9c144f74?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1613478518551-966c5f8a8a8f?w=1080&h=1080&fit=crop",
  ],
  reddit: [
    "https://images.unsplash.com/photo-1510812431407-26c2d94dde2d?w=1200&h=628&fit=crop",
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1080&h=1080&fit=crop",
  ],
  social: [
    "https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=1080&h=1080&fit=crop",
  ],
};

const STOCK_BY_CHANNEL: Record<Channel, (signalType: SignalType) => string> = {
  meta: (t) => pickStock(t, "square"),
  display: (t) => pickStock(t, "landscape"),
  smartly: (t) => pickStock(t, "square"),
  google_search: () => "",
};

function pickStock(signalType: SignalType, shape: "square" | "landscape"): string {
  const pool = STOCK_BY_SIGNAL[signalType] ?? STOCK_BY_SIGNAL.trends;
  if (shape === "landscape") {
    return pool.find((u) => u.includes("1200")) ?? pool[0];
  }
  return pool.find((u) => u.includes("1080")) ?? pool[0];
}

export function getStockImageUrl(
  signalType: SignalType,
  channel: Channel
): string | undefined {
  const url = STOCK_BY_CHANNEL[channel](signalType);
  return url || undefined;
}
