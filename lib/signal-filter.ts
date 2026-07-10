import type { AppEvent, Market, SignalType } from "./types";

export type FeedCityFilter = Market | "all";
export type FeedSignalTypeFilter = SignalType | "all";

export interface SignalFeedFilters {
  activeMarkets: Market[];
  feedCity: FeedCityFilter;
  feedSignalType: FeedSignalTypeFilter;
}

export function marketsForFeed(filters: SignalFeedFilters): Market[] {
  if (filters.feedCity !== "all") {
    return filters.activeMarkets.includes(filters.feedCity)
      ? [filters.feedCity]
      : [];
  }
  return filters.activeMarkets;
}

export function matchesSignalFilters(
  signal: { market: string; type: string },
  filters: SignalFeedFilters
): boolean {
  const markets = marketsForFeed(filters);
  if (!markets.includes(signal.market as Market)) return false;
  if (
    filters.feedSignalType !== "all" &&
    signal.type !== filters.feedSignalType
  ) {
    return false;
  }
  return true;
}

export function filterSignalEvents(
  events: AppEvent[],
  filters: SignalFeedFilters
): AppEvent[] {
  return events.filter((e) => {
    if (e.type !== "signal_detected") return false;
    const signal = e.data.signal as { market: string; type: string };
    return matchesSignalFilters(signal, filters);
  });
}

/** Keep non-signal events; filter signal_detected by view filters */
export function filterEventsForView(
  events: AppEvent[],
  filters: SignalFeedFilters
): AppEvent[] {
  return events.filter((e) => {
    if (e.type !== "signal_detected") return true;
    const signal = e.data.signal as { market: string; type: string };
    return matchesSignalFilters(signal, filters);
  });
}

export function feedFilterLabel(filters: SignalFeedFilters): string {
  const parts: string[] = [];
  if (filters.feedCity !== "all") {
    parts.push(filters.feedCity);
  } else if (filters.activeMarkets.length === 1) {
    parts.push(filters.activeMarkets[0]);
  } else {
    parts.push(`${filters.activeMarkets.length} cities`);
  }

  if (filters.feedSignalType !== "all") {
    const typeLabels: Record<string, string> = {
      traffic: "Traffic",
      weather: "Weather",
      trends: "Trends",
      reddit: "Community",
    };
    parts.push(typeLabels[filters.feedSignalType] ?? filters.feedSignalType);
  } else {
    parts.push("all signal types");
  }

  return parts.join(" · ");
}
