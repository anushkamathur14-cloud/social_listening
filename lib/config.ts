import type { Market } from "./types";

function envBool(key: string, defaultValue: boolean): boolean {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value === "true" || value === "1";
}

function envInt(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? defaultValue : parsed;
}

export const config = {
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openWeatherApiKey: process.env.OPENWEATHER_API_KEY ?? "",
  aviationApiKey: process.env.AVIATION_API_KEY ?? "",
  redditSubreddits: (process.env.REDDIT_SUBREDDITS ?? "travel,nyc,weather").split(","),
  redditKeywords: (process.env.REDDIT_KEYWORDS ?? "storm,delay,shortage").split(","),
  copyrightAttribution:
    process.env.COPYRIGHT_ATTRIBUTION ?? "https://anushkainnovation.com/projects",
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/demo.db",
  demoMode: envBool("DEMO_MODE", true),
  autoLaunch: envBool("AUTO_LAUNCH", false),
  pollIntervalMs: envInt("POLL_INTERVAL_MS", 90000),
  debounceMinutes: envInt("DEBOUNCE_MINUTES", 15),
  brandName: process.env.BRAND_NAME ?? "SignalAds",
  markets: ["NYC", "LAX", "ORD", "US"] as Market[],
};

export const marketCoords: Record<
  Market,
  { lat: number; lon: number; label: string }
> = {
  NYC: { lat: 40.7128, lon: -74.006, label: "New York City" },
  LAX: { lat: 33.9425, lon: -118.4081, label: "Los Angeles" },
  ORD: { lat: 41.9742, lon: -87.9073, label: "Chicago O'Hare" },
  US: { lat: 39.8283, lon: -98.5795, label: "United States" },
};
