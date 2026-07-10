"use client";

import { matchesSignalFilters, type SignalFeedFilters } from "@/lib/signal-filter";
import { signalVerticalHint } from "@/lib/verticals";
import type { AppEvent } from "@/lib/types";

const TYPE_META: Record<
  string,
  { color: string; icon: string; label: string }
> = {
  weather: {
    color: "bg-blue-50 text-blue-800 border-blue-200",
    icon: "⛈️",
    label: "Weather",
  },
  traffic: {
    color: "bg-orange-50 text-orange-800 border-orange-200",
    icon: "✈️",
    label: "Traffic",
  },
  trends: {
    color: "bg-purple-50 text-purple-800 border-purple-200",
    icon: "📈",
    label: "Trends",
  },
  reddit: {
    color: "bg-red-50 text-red-800 border-red-200",
    icon: "💬",
    label: "Community",
  },
  social: {
    color: "bg-pink-50 text-pink-800 border-pink-200",
    icon: "📱",
    label: "Social",
  },
};

const SEVERITY_COLORS: Record<string, string> = {
  high: "text-red-700 bg-red-50",
  medium: "text-amber-700 bg-amber-50",
  low: "text-green-700 bg-green-50",
};

interface SignalFeedProps {
  events: AppEvent[];
  filters: SignalFeedFilters;
  onSignalClick?: (signalId: string) => void;
  highlightSignalId?: string | null;
}

export function SignalFeed({
  events,
  filters,
  onSignalClick,
  highlightSignalId,
}: SignalFeedProps) {
  const signalEvents = events
    .filter((e) => e.type === "signal_detected")
    .filter((e) => {
      const signal = e.data.signal as { market: string; type: string };
      return matchesSignalFilters(signal, filters);
    })
    .slice(-12)
    .reverse();

  return (
    <div className="flex flex-col gap-2.5 overflow-y-auto max-h-[420px] pr-1">
      {signalEvents.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
          <p className="text-sm text-gray-600">Waiting for signals…</p>
          <p className="text-xs text-gray-500 mt-1">
            Adjust cities, city dropdown, or signal type above to filter what appears
            here.
          </p>
        </div>
      )}
      {signalEvents.map((event) => {
        const signal = event.data.signal as {
          type: string;
          market: string;
          severity: string;
          payload: {
            summary: string;
            sourceUrl?: string;
            sourceLabel?: string;
            sourceType?: string;
            topic?: string;
            snippet?: string;
            subreddit?: string;
          };
        };

        const meta = TYPE_META[signal.type] ?? TYPE_META.trends;
        const uaHint = signalVerticalHint(signal.type);
        const signalId = (event.data.signal as { id?: string }).id;
        const isHighlighted = highlightSignalId === signalId;
        const clickable = Boolean(onSignalClick && signalId);

        return (
          <div
            key={event.id}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={
              clickable
                ? () => onSignalClick?.(signalId!)
                : undefined
            }
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSignalClick?.(signalId!);
                    }
                  }
                : undefined
            }
            className={`rounded-lg border bg-gray-50 p-3 text-sm transition-colors ${
              isHighlighted
                ? "border-black ring-2 ring-black/10"
                : "border-gray-200 hover:border-gray-300"
            } ${clickable ? "cursor-pointer hover:bg-white" : ""}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`rounded-md px-2 py-1 text-xs font-semibold border flex items-center gap-1 ${meta.color}`}
              >
                <span>{meta.icon}</span>
                {meta.label}
              </span>
              <span className="text-gray-900 font-semibold">{signal.market}</span>
              <span
                className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${SEVERITY_COLORS[signal.severity] ?? "text-gray-600 bg-gray-100"}`}
              >
                {signal.severity}
              </span>
              <span className="ml-auto text-[10px] text-gray-500 tabular-nums">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <p className="text-gray-900 leading-snug">{signal.payload.summary}</p>

            <p className="text-[10px] text-gray-600 mt-2 flex items-center gap-1">
              <span className="text-green-700 font-medium">→</span>
              {uaHint.hint}
            </p>

            {signal.payload.topic && (
              <p className="text-xs text-gray-600 mt-1.5">
                Thread: {signal.payload.topic}
              </p>
            )}

            {signal.payload.snippet && (signal.type === "reddit" || signal.type === "social") && (
              <p className="text-xs text-gray-600 mt-1 italic line-clamp-2 border-l-2 border-gray-300 pl-2">
                Someone asked: &ldquo;{signal.payload.snippet}&rdquo;
              </p>
            )}

            {signal.payload.sourceUrl && (
              <a
                href={signal.payload.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 mt-2 text-xs text-green-700 font-medium hover:underline"
              >
                ↗ {signal.payload.sourceLabel ?? "Verify source"}
              </a>
            )}

            {clickable && (
              <p className="text-[10px] text-gray-500 mt-2 font-medium">
                Click to view creatives →
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
