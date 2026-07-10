import type { SignalType } from "../types";
import type { Channel } from "../channels";

/**
 * Stock images from https://unsplash.com/
 * Served via images.unsplash.com CDN with crop params for channel specs.
 */
const UNSPLASH = {
  // Weather → rides / stay in
  rainCity: "https://images.unsplash.com/photo-1534088568595-a066ffeb3e5c?w=1200&h=628&fit=crop&q=80",
  rainCitySquare: "https://images.unsplash.com/photo-1428908728789-d2efe25dae4c?w=1080&h=1080&fit=crop&q=80",
  stormWindow: "https://images.unsplash.com/photo-1519692933481-1627890fd786?w=1080&h=1080&fit=crop&q=80",

  // Traffic / travel → airport, rides
  airportTerminal: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&h=628&fit=crop&q=80",
  cityRide: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1080&h=1080&fit=crop&q=80",
  travelerPhone: "https://images.unsplash.com/photo-1540962351504-0304e7a027b0?w=1080&h=1080&fit=crop&q=80",

  // Trends / food → Uber Eats
  foodDelivery: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=628&fit=crop&q=80",
  eatsBag: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1080&h=1080&fit=crop&q=80",
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080&h=1080&fit=crop&q=80",

  // Reddit / social → city lifestyle
  urbanNight: "https://images.unsplash.com/photo-1511919889550-3d5f4a7a2349?w=1200&h=628&fit=crop&q=80",
  cityLights: "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1080&h=1080&fit=crop&q=80",
  phoneApp: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1080&h=1080&fit=crop&q=80",
};

const STOCK_BY_SIGNAL: Record<SignalType, { landscape: string; square: string }> = {
  weather: { landscape: UNSPLASH.rainCity, square: UNSPLASH.rainCitySquare },
  traffic: { landscape: UNSPLASH.airportTerminal, square: UNSPLASH.cityRide },
  trends: { landscape: UNSPLASH.foodDelivery, square: UNSPLASH.eatsBag },
  reddit: { landscape: UNSPLASH.urbanNight, square: UNSPLASH.phoneApp },
  social: { landscape: UNSPLASH.urbanNight, square: UNSPLASH.cityLights },
};

export function getStockImageUrl(
  signalType: SignalType,
  channel: Channel
): string | undefined {
  if (channel === "google_search") return undefined;

  const pool = STOCK_BY_SIGNAL[signalType] ?? STOCK_BY_SIGNAL.trends;
  const isLandscape = channel === "display";
  return isLandscape ? pool.landscape : pool.square;
}

export function getUnsplashCredit(signalType: SignalType): string {
  return "Photo via Unsplash.com";
}
