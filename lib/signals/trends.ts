import { nanoid } from "nanoid";
import { MARKET_MAP } from "../markets";
import type { Market, Signal } from "../types";

const MOCK_TRENDS: Array<{
  query: string;
  spikeRatio: number;
  market: Market;
}> = [
  { query: "uber eats promo code", spikeRatio: 3.4, market: "US" },
  { query: "ride to airport app", spikeRatio: 2.9, market: "US" },
  { query: "food delivery NYC storm", spikeRatio: 4.2, market: "NYC" },
  { query: "uber eats seattle", spikeRatio: 3.1, market: "SEA" },
  { query: "cheap ride to LAX", spikeRatio: 2.6, market: "LAX" },
  { query: "uber chicago airport", spikeRatio: 2.3, market: "ORD" },
  { query: "miami ride share new user", spikeRatio: 3.6, market: "MIA" },
  { query: "SF fog driving tips", spikeRatio: 2.3, market: "SFO" },
];

export async function fetchTrendSignals(
  activeMarkets?: Market[]
): Promise<Signal[]> {
  if (process.env.DEMO_MODE === "false" && !process.env.OPENAI_API_KEY) {
    try {
      const googleTrends = await import("google-trends-api");
      const results = await googleTrends.default.realTimeTrends({
        geo: "US",
        category: "all",
      });
      const parsed = JSON.parse(results);
      const stories = parsed.storySummaries?.trendingStories ?? [];

      return stories.slice(0, 3).map(
        (story: { title: string; entityNames?: string[]; traffic?: string }) => ({
          id: nanoid(),
          type: "trends" as const,
          market: "US" as Market,
          severity: "medium" as const,
          payload: {
            summary: `Trending in US: "${story.title}"`,
            sourceUrl: `https://trends.google.com/trends/explore?geo=US&q=${encodeURIComponent(story.title)}`,
            sourceLabel: "Google Trends · US",
            sourceType: "trends" as const,
            query: story.title,
            spikeRatio: 2.5,
            traffic: story.traffic ?? "unknown",
            entities: story.entityNames ?? [],
          },
          detectedAt: new Date().toISOString(),
        })
      );
    } catch {
      return mockTrendSignals(activeMarkets);
    }
  }

  return mockTrendSignals(activeMarkets);
}

function mockTrendSignals(activeMarkets?: Market[]): Signal[] {
  const pool = activeMarkets
    ? MOCK_TRENDS.filter(
        (t) => activeMarkets.includes(t.market) || t.market === "US"
      )
    : MOCK_TRENDS;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_TRENDS[0];
  const cfg = MARKET_MAP[pick.market];

  return [
    {
      id: nanoid(),
      type: "trends",
      market: pick.market,
      severity: pick.spikeRatio > 3 ? "high" : "medium",
      payload: {
        summary: `${cfg.label}: search spike for "${pick.query}" (${pick.spikeRatio}x baseline)`,
        sourceUrl: `https://trends.google.com/trends/explore?geo=${cfg.trendsGeo}&q=${encodeURIComponent(pick.query)}`,
        sourceLabel: `Google Trends (mock) · ${cfg.label}`,
        sourceType: "mock",
        query: pick.query,
        spikeRatio: pick.spikeRatio,
        city: cfg.label,
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createTrendSignal(market: Market): Signal {
  const pick =
    MOCK_TRENDS.find((t) => t.market === market) ??
    MOCK_TRENDS.find((t) => t.market === "US") ??
    MOCK_TRENDS[0];
  const cfg = MARKET_MAP[market] ?? MARKET_MAP[pick.market];

  return {
    id: nanoid(),
    type: "trends",
    market,
    severity: pick.spikeRatio > 3 ? "high" : "medium",
    payload: {
      summary: `${cfg.label}: search spike for "${pick.query}" (${pick.spikeRatio}x baseline)`,
      sourceUrl: `https://trends.google.com/trends/explore?geo=${cfg.trendsGeo}&q=${encodeURIComponent(pick.query)}`,
      sourceLabel: `Injected trend signal · ${cfg.label}`,
      sourceType: "injected",
      query: pick.query,
      spikeRatio: pick.spikeRatio,
      city: cfg.label,
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getSpikeRatio(signal: Signal): number {
  return (signal.payload.spikeRatio as number) ?? 1;
}
