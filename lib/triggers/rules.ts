import type { SignalType } from "../types";

export interface TriggerRule {
  type: SignalType;
  market?: string;
  description: string;
  evaluate: (signal: {
    type: SignalType;
    market: string;
    severity: string;
    payload: Record<string, unknown>;
  }) => boolean;
}

export const triggerRules: TriggerRule[] = [
  {
    type: "weather",
    description: "alert_severity >= high",
    evaluate: (s) => s.type === "weather" && s.severity === "high",
  },
  {
    type: "weather",
    description: "alert_severity >= medium in target market",
    evaluate: (s) =>
      s.type === "weather" &&
      (s.severity === "high" || s.severity === "medium"),
  },
  {
    type: "traffic",
    description: "avg_delay_minutes > 45",
    evaluate: (s) =>
      s.type === "traffic" &&
      ((s.payload.avgDelayMinutes as number) ?? 0) > 45,
  },
  {
    type: "trends",
    description: "spike_ratio > 2.0 in any market",
    evaluate: (s) =>
      s.type === "trends" && ((s.payload.spikeRatio as number) ?? 0) > 2.0,
  },
  {
    type: "reddit",
    description: "engagement_score > 500 && velocity > 2.0",
    evaluate: (s) =>
      s.type === "reddit" &&
      ((s.payload.engagementScore as number) ?? 0) > 500 &&
      ((s.payload.velocity as number) ?? 0) > 2.0,
  },
  {
    type: "social",
    description: "keyword_match && sentiment != negative",
    evaluate: (s) =>
      (s.type === "reddit" || s.type === "social") &&
      (s.payload.sentiment as string) !== "negative" &&
      ((s.payload.engagementScore as number) ?? 0) > 300,
  },
];
