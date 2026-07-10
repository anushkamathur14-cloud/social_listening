"use client";

import {
  countCreativesForChannels,
  countPendingForChannels,
  countRoutedForChannels,
} from "@/lib/channel-filter";
import type { AppEvent, Channel } from "@/lib/types";

interface StatsBarProps {
  events: AppEvent[];
  activeMarkets: string[];
  selectedChannels: Channel[];
}

export function StatsBar({ events, activeMarkets, selectedChannels }: StatsBarProps) {
  const signals = events.filter((e) => e.type === "signal_detected").length;
  const creatives = countCreativesForChannels(events, selectedChannels);
  const pending = countPendingForChannels(events, selectedChannels);
  const routed = countRoutedForChannels(events, selectedChannels);

  const stats = [
    { label: "Signals", value: signals, color: "text-blue-600" },
    { label: "Creatives", value: creatives, color: "text-indigo-600" },
    { label: "Awaiting approval", value: pending, color: "text-amber-600" },
    { label: "Routed (simulated)", value: routed, color: "text-green-700" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-lg border border-[var(--border)] bg-white px-3 py-1.5 flex items-baseline gap-2"
          >
            <span className={`text-lg font-bold tabular-nums ${s.color}`}>
              {s.value}
            </span>
            <span className="text-[10px] text-[var(--muted)] uppercase tracking-wide">
              {s.label}
            </span>
          </div>
        ))}
      </div>
      <div className="ml-auto flex flex-wrap gap-1.5 text-[10px] text-[var(--muted)]">
        <span>{activeMarkets.length} cities</span>
        <span>·</span>
        <span>{selectedChannels.length} channels</span>
      </div>
    </div>
  );
}
