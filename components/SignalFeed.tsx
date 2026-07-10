"use client";

import type { AppEvent } from "@/lib/types";

const TYPE_COLORS: Record<string, string> = {
  weather: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  traffic: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  trends: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  reddit: "bg-red-500/20 text-red-300 border-red-500/30",
  social: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "text-red-400",
  medium: "text-yellow-400",
  low: "text-green-400",
};

interface SignalFeedProps {
  events: AppEvent[];
}

export function SignalFeed({ events }: SignalFeedProps) {
  const signalEvents = events
    .filter((e) => e.type === "signal_detected")
    .slice(-12)
    .reverse();

  return (
    <div className="flex flex-col gap-2 overflow-y-auto max-h-[420px] pr-1">
      {signalEvents.length === 0 && (
        <p className="text-sm text-zinc-500 italic">Waiting for signals...</p>
      )}
      {signalEvents.map((event) => {
        const signal = event.data.signal as {
          type: string;
          market: string;
          severity: string;
          payload: { summary: string };
        };
        return (
          <div
            key={event.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-sm"
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium border ${TYPE_COLORS[signal.type] ?? "bg-zinc-700"}`}
              >
                {signal.type}
              </span>
              <span className="text-zinc-400">{signal.market}</span>
              <span className={`text-xs font-semibold ${SEVERITY_COLORS[signal.severity]}`}>
                {signal.severity}
              </span>
              <span className="ml-auto text-xs text-zinc-600">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="text-zinc-300 leading-snug">{signal.payload.summary}</p>
          </div>
        );
      })}
    </div>
  );
}
