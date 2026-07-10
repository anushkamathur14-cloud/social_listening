"use client";

import { feedFilterLabel, type SignalFeedFilters } from "@/lib/signal-filter";

interface SignalFilterBannerProps {
  filters: SignalFeedFilters;
  signalCount: number;
}

export function SignalFilterBanner({
  filters,
  signalCount,
}: SignalFilterBannerProps) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50/80 px-3 py-2 mb-3 flex flex-wrap items-center gap-2 text-xs text-blue-900">
      <span className="font-semibold shrink-0">Signal feed</span>
      <span className="text-blue-700">
        Showing {signalCount} · {feedFilterLabel(filters)}
      </span>
      {filters.feedCity === "all" && filters.activeMarkets.length > 1 && (
        <span className="text-blue-600/80">
          — pick a city in the dropdown to focus one market
        </span>
      )}
    </div>
  );
}
