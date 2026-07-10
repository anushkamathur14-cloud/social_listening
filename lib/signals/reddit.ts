import { nanoid } from "nanoid";
import { config } from "../config";
import { MARKET_MAP, MARKETS } from "../markets";
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

const MOCK_THREADS: Array<{
  subreddit: string;
  title: string;
  snippet: string;
  score: number;
  comments: number;
  market: Market;
}> = [
  {
    subreddit: "travel",
    title: "Best app for getting to ORD when flights are delayed?",
    snippet:
      "3-hour delay at O'Hare. Is Uber Reserve worth it for getting back to the terminal later? First time in Chicago.",
    score: 847,
    comments: 234,
    market: "ORD",
  },
  {
    subreddit: "Seattle",
    title: "Uber Eats vs cooking during this storm — what's the move?",
    snippet:
      "Not leaving the house tonight. Best Uber Eats spots in Capitol Hill for delivery when it's pouring?",
    score: 956,
    comments: 312,
    market: "SEA",
  },
  {
    subreddit: "nyc",
    title: "Subway flooded — how are you getting around?",
    snippet:
      "Lines suspended. Switched to Uber Pool for commute. Any new rider promos worth using?",
    score: 1203,
    comments: 456,
    market: "NYC",
  },
  {
    subreddit: "LosAngeles",
    title: "Heat wave — Uber Eats or drive to pick up food?",
    snippet:
      "108°F and don't want to get in the car. What's the best Uber Eats deal for new users in LA right now?",
    score: 623,
    comments: 189,
    market: "LAX",
  },
  {
    subreddit: "Miami",
    title: "Airport pickup MIA — Uber or taxi?",
    snippet:
      "Flying in tomorrow. Heard Uber has airport pickup deals for new users. Anyone used it recently?",
    score: 734,
    comments: 201,
    market: "MIA",
  },
];

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

function marketForSubreddit(subreddit: string): Market {
  const match = MARKETS.find((m) =>
    m.redditSubs.some((s) => s.toLowerCase() === subreddit.toLowerCase())
  );
  return match?.id ?? "US";
}

export async function fetchRedditSignals(
  activeMarkets?: Market[]
): Promise<Signal[]> {
  const signals: Signal[] = [];
  const subs = new Set<string>(config.redditSubreddits);

  if (activeMarkets) {
    for (const market of activeMarkets) {
      const cfg = MARKET_MAP[market];
      cfg?.redditSubs.forEach((s) => subs.add(s));
    }
  }

  try {
    for (const sub of subs) {
      const posts = await fetchSubredditRising(sub.trim());
      for (const post of posts) {
        const text = `${post.title} ${post.selftext}`.toLowerCase();
        const keywordMatch = config.redditKeywords.some((kw) =>
          text.includes(kw.toLowerCase())
        );
        const engagementScore = post.score + post.num_comments * 2;
        const velocity = Math.min(5, engagementScore / 200);
        const market = marketForSubreddit(post.subreddit);

        if (activeMarkets && !activeMarkets.includes(market) && market !== "US") {
          continue;
        }

        if (keywordMatch || engagementScore > 500) {
          const url = `https://reddit.com${post.permalink}`;
          const social = normalizeSocialSignal({
            platform: "reddit",
            topic: post.title,
            snippet: post.selftext || post.title,
            engagementScore,
            velocity,
            url,
            market,
          });

          signals.push({
            id: nanoid(),
            type: "reddit",
            market,
            severity: engagementScore > 800 ? "high" : "medium",
            payload: {
              summary: socialToSignalContext(social),
              sourceUrl: url,
              sourceLabel: `Reddit · r/${post.subreddit}`,
              sourceType: "reddit",
              topic: post.title,
              snippet: social.snippet,
              platform: "reddit",
              engagementScore,
              velocity,
              subreddit: post.subreddit,
              score: post.score,
              comments: post.num_comments,
              city: MARKET_MAP[market]?.label ?? market,
            },
            detectedAt: new Date().toISOString(),
          });
        }
      }
    }
  } catch {
    return mockRedditSignals(activeMarkets);
  }

  return signals.length > 0 ? signals.slice(0, 5) : mockRedditSignals(activeMarkets);
}

function mockRedditSignals(activeMarkets?: Market[]): Signal[] {
  const pool = activeMarkets
    ? MOCK_THREADS.filter((t) => activeMarkets.includes(t.market))
    : MOCK_THREADS;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_THREADS[0];
  const engagementScore = pick.score + pick.comments * 2;
  const velocity = Math.min(5, engagementScore / 200);
  const url = `https://reddit.com/r/${pick.subreddit}`;

  const social = normalizeSocialSignal({
    platform: "reddit",
    topic: pick.title,
    snippet: pick.snippet,
    engagementScore,
    velocity,
    url,
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
        sourceUrl: url,
        sourceLabel: `Reddit (mock) · r/${pick.subreddit}`,
        sourceType: "mock",
        topic: pick.title,
        snippet: pick.snippet,
        platform: "reddit",
        engagementScore,
        velocity,
        subreddit: pick.subreddit,
        score: pick.score,
        comments: pick.comments,
        city: MARKET_MAP[pick.market]?.label ?? pick.market,
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
  const url = `https://reddit.com/r/${pick.subreddit}`;

  const social = normalizeSocialSignal({
    platform: "reddit",
    topic: pick.title,
    snippet: pick.snippet,
    engagementScore,
    velocity,
    url,
    market: pick.market,
  });

  return {
    id: nanoid(),
    type: "reddit",
    market: pick.market,
    severity: "high",
    payload: {
      summary: socialToSignalContext(social),
      sourceUrl: url,
      sourceLabel: `Injected Reddit · r/${pick.subreddit}`,
      sourceType: "injected",
      topic: pick.title,
      snippet: pick.snippet,
      platform: "reddit",
      engagementScore,
      velocity,
      subreddit: pick.subreddit,
      score: pick.score,
      comments: pick.comments,
      city: MARKET_MAP[pick.market]?.label ?? pick.market,
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
