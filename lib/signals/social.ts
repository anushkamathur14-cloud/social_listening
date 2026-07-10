import type { Market, SocialSignal } from "../types";

export function normalizeSocialSignal(raw: {
  platform: string;
  topic: string;
  snippet: string;
  engagementScore: number;
  velocity: number;
  url: string;
  market: Market;
  sentiment?: "positive" | "neutral" | "negative";
}): SocialSignal {
  return {
    platform: raw.platform,
    topic: raw.topic,
    snippet: raw.snippet.slice(0, 280),
    engagementScore: raw.engagementScore,
    velocity: raw.velocity,
    url: raw.url,
    market: raw.market,
    sentiment: raw.sentiment ?? inferSentiment(raw.snippet),
  };
}

function inferSentiment(text: string): "positive" | "neutral" | "negative" {
  const lower = text.toLowerCase();
  const negative = ["terrible", "awful", "worst", "delay", "storm", "shortage", "stuck"];
  const positive = ["great", "love", "best", "recommend", "helpful"];
  if (negative.some((w) => lower.includes(w))) return "negative";
  if (positive.some((w) => lower.includes(w))) return "positive";
  return "neutral";
}

export function socialToSignalContext(social: SocialSignal): string {
  return `[${social.platform}] ${social.topic}: "${social.snippet}" (${social.engagementScore} engagement, ${social.velocity}x velocity)`;
}
