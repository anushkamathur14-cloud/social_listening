import { DEFAULT_CHANNELS, parseChannels } from "./channels";
import { DEFAULT_ACTIVE_MARKETS, MARKETS } from "./markets";
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
  redditSubreddits: (process.env.REDDIT_SUBREDDITS ?? "travel,nyc,LosAngeles,ubereats").split(","),
  redditKeywords: (process.env.REDDIT_KEYWORDS ?? "uber,rides,delivery,airport,delay,storm").split(","),
  copyrightAttribution:
    process.env.COPYRIGHT_ATTRIBUTION ?? "https://anushkainnovation.com/projects",
  databaseUrl: process.env.DATABASE_URL ?? "file:./data/demo.db",
  demoMode: envBool("DEMO_MODE", true),
  autoLaunch: envBool("AUTO_LAUNCH", false),
  pollIntervalMs: envInt("POLL_INTERVAL_MS", 90000),
  debounceMinutes: envInt("DEBOUNCE_MINUTES", 15),
  brandName: process.env.BRAND_NAME ?? "Uber",
  markets: MARKETS.map((m) => m.id),
  defaultActiveMarkets: DEFAULT_ACTIVE_MARKETS,
  defaultChannels: DEFAULT_CHANNELS,
};

export function parseActiveMarkets(raw?: string): Market[] {
  if (!raw) return DEFAULT_ACTIVE_MARKETS;
  try {
    const parsed = JSON.parse(raw) as Market[];
    return parsed.filter((m) => config.markets.includes(m));
  } catch {
    return DEFAULT_ACTIVE_MARKETS;
  }
}

export { parseChannels };
