import { nanoid } from "nanoid";
import type { Market, Signal } from "../types";

const MOCK_TRENDS = [
  { query: "portable charger shortage", spikeRatio: 3.2, market: "US" as Market },
  { query: "flight delay compensation", spikeRatio: 2.8, market: "US" as Market },
  { query: "NYC subway flooding", spikeRatio: 4.1, market: "NYC" as Market },
  { query: "LA heat wave essentials", spikeRatio: 2.5, market: "LAX" as Market },
  { query: "Chicago winter gear", spikeRatio: 2.1, market: "ORD" as Market },
];

export async function fetchTrendSignals(): Promise<Signal[]> {
  if (process.env.DEMO_MODE === "false" && !process.env.OPENAI_API_KEY) {
    try {
      // google-trends-api is CommonJS; dynamic import with fallback
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
            summary: `Trending: ${story.title}`,
            query: story.title,
            spikeRatio: 2.5,
            traffic: story.traffic ?? "unknown",
            entities: story.entityNames ?? [],
          },
          detectedAt: new Date().toISOString(),
        })
      );
    } catch {
      return mockTrendSignals();
    }
  }

  return mockTrendSignals();
}

function mockTrendSignals(): Signal[] {
  const pick = MOCK_TRENDS[Math.floor(Math.random() * MOCK_TRENDS.length)];
  return [
    {
      id: nanoid(),
      type: "trends",
      market: pick.market,
      severity: pick.spikeRatio > 3 ? "high" : "medium",
      payload: {
        summary: `Search spike: "${pick.query}" (${pick.spikeRatio}x baseline)`,
        query: pick.query,
        spikeRatio: pick.spikeRatio,
        source: "mock",
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createTrendSignal(market: Market): Signal {
  const pick = MOCK_TRENDS.find((t) => t.market === market) ?? MOCK_TRENDS[0];
  return {
    id: nanoid(),
    type: "trends",
    market,
    severity: pick.spikeRatio > 3 ? "high" : "medium",
    payload: {
      summary: `Search spike: "${pick.query}" (${pick.spikeRatio}x baseline)`,
      query: pick.query,
      spikeRatio: pick.spikeRatio,
      source: "injected",
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getSpikeRatio(signal: Signal): number {
  return (signal.payload.spikeRatio as number) ?? 1;
}
