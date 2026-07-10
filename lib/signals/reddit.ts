import { nanoid } from "nanoid";
import { config } from "../config";
import type { Market, Signal } from "../types";
import { normalizeSocialSignal, socialToSignalContext } from "./social";

interface RedditPost {
  title: string;
  selftext: string;
  score: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
}

const MOCK_THREADS = [
  {
    subreddit: "travel",
    title: "ORD delays are insane today — 3 hour wait",
    snippet: "Anyone else stuck at O'Hare? Flights backed up due to weather.",
    score: 847,
    comments: 234,
    market: "ORD" as Market,
  },
  {
    subreddit: "nyc",
    title: "Subway flooding again — what's the backup plan?",
    snippet: "Lines 4/5 suspended. Need alternatives for commute tomorrow.",
    score: 1203,
    comments: 456,
    market: "NYC" as Market,
  },
  {
    subreddit: "weather",
    title: "LA heat wave — power outages starting in valley",
    snippet: "108°F and rolling blackouts. Stock up on water and batteries.",
    score: 623,
    comments: 189,
    market: "LAX" as Market,
  },
];

const SUB_MARKET_MAP: Record<string, Market> = {
  nyc: "NYC",
  losangeles: "LAX",
  chicago: "ORD",
  travel: "US",
  weather: "US",
};

async function fetchSubredditRising(subreddit: string): Promise<RedditPost[]> {
  const url = `https://www.reddit.com/r/${subreddit}/rising.json?limit=5`;
  const res = await fetch(url, {
    headers: { "User-Agent": "signal-ads-demo/1.0" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.data?.children ?? []).map(
    (child: { data: RedditPost }) => child.data
  );
}

export async function fetchRedditSignals(): Promise<Signal[]> {
  const signals: Signal[] = [];

  try {
    for (const sub of config.redditSubreddits) {
      const posts = await fetchSubredditRising(sub.trim());
      for (const post of posts) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        const keywordMatch = config.redditKeywords.some((kw) =>
          text.includes(kw.toLowerCase())
        );
        const engagementScore = post.score + post.num_comments * 2;
        const velocity = Math.min(5, engagementScore / 200);

        if (keywordMatch || engagementScore > 500) {
          const market = SUB_MARKET_MAP[post.subreddit.toLowerCase()] ?? "US";
          const social = normalizeSocialSignal({
            platform: "reddit",
            topic: post.title,
            snippet: post.selftext || post.title,
            engagementScore,
            velocity,
            url: `https://reddit.com${post.permalink}`,
            market,
          });

          signals.push({
            id: nanoid(),
            type: "reddit",
            market,
            severity: engagementScore > 800 ? "high" : "medium",
            payload: {
              summary: socialToSignalContext(social),
              ...social,
            },
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    return mockRedditSignals();
  }

  return signals.length > 0 ? signals.slice(0, 3) : mockRedditSignals();
}

function mockRedditSignals(): Signal[] {
  const pick = MOCK_THREADS[Math.floor(Math.random() * MOCK_THREADS.length)];
  const engagementScore = pick.score + pick.comments * 2;
  const velocity = Math.min(5, engagementScore / 200);

  const social = normalizeSocialSignal({
    platform: "reddit",
    topic: pick.title,
    snippet: pick.snippet,
    engagementScore,
    velocity,
    url: `https://reddit.com/r/${pick.subreddit}`,
    market: pick.market,
  });

  return [
    {
      id: nanoid(),
      type: "reddit",
      market: pick.market,
      severity: engagementScore > 800 ? "high" : "medium",
      payload: {
        summary: socialToSignalContext(social),
        ...social,
        source: "mock",
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createRedditSignal(market: Market): Signal {
  const pick =
    MOCK_THREADS.find((t) => t.market === market) ?? MOCK_THREADS[0];
  const engagementScore = pick.score + pick.comments * 2;
  const velocity = Math.min(5, engagementScore / 200);

  const social = normalizeSocialSignal({
    platform: "reddit",
    topic: pick.title,
    snippet: pick.snippet,
    engagementScore,
    velocity,
    url: `https://reddit.com/r/${pick.subreddit}`,
    market: pick.market,
  });

  return {
    id: nanoid(),
    type: "reddit",
    market: pick.market,
    severity: "high",
    payload: {
      summary: socialToSignalContext(social),
      ...social,
      source: "injected",
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getEngagementScore(signal: Signal): number {
  return (signal.payload.engagementScore as number) ?? 0;
}

export function getVelocity(signal: Signal): number {
  return (signal.payload.velocity as number) ?? 0;
}

export function getSentiment(signal: Signal): string {
  return (signal.payload.sentiment as string) ?? "neutral";
}
