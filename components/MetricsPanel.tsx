"use client";

import type { AppEvent } from "@/lib/types";

interface MetricsPanelProps {
  events: AppEvent[];
}

export function MetricsPanel({ events }: MetricsPanelProps) {
  const perfEvents = events
    .filter(
      (e) => e.type === "performance_update" || e.type === "optimizer_action"
    )
    .slice(-15)
    .reverse();

  const latestPerf = events
    .filter((e) => e.type === "performance_update")
    .slice(-5)
    .reverse();

  return (
    <div className="space-y-3">
      {latestPerf.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {latestPerf.map((event) => {
            const snap = event.data.snapshot as {
              impressions: number;
              ctr: number;
              cpa: number;
              spend: number;
            };
            return (
              <div
                key={event.id}
                className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-center"
              >
                <div className="text-lg font-bold text-white">
                  {snap.ctr}%
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">
                  CTR
                </div>
                <div className="text-xs text-zinc-400 mt-1">
                  {snap.impressions.toLocaleString()} imp
                </div>
                <div className="text-xs text-zinc-500">
                  ${snap.spend} · CPA ${snap.cpa}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 max-h-48 overflow-y-auto space-y-1">
        {perfEvents.length === 0 && (
          <p className="text-sm text-zinc-500 italic">
            Optimizer idle — launch campaigns to see metrics.
          </p>
        )}
        {perfEvents.map((event) => {
          if (event.type === "optimizer_action") {
            return (
              <div
                key={event.id}
                className="text-xs flex gap-2 py-1 border-b border-zinc-800/50 last:border-0"
              >
                <span className="text-zinc-600">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span
                  className={
                    event.data.action === "scaled"
                      ? "text-green-400 font-medium"
                      : "text-red-400"
                  }
                >
                  {event.data.action === "scaled" ? "▲ Scaled" : "▼ Paused"}
                </span>
                <span className="text-zinc-400 truncate">
                  {event.data.reason as string} · CTR {event.data.ctr as number}%
                </span>
              </div>
            );
          }

          const snap = event.data.snapshot as { ctr: number; impressions: number };
          return (
            <div
              key={event.id}
              className="text-xs flex gap-2 py-1 border-b border-zinc-800/50 last:border-0"
            >
              <span className="text-zinc-600">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-cyan-400">Metrics</span>
              <span className="text-zinc-400">
                CTR {snap.ctr}% · {snap.impressions.toLocaleString()} impressions
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
