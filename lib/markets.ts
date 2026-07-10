import type { Market } from "./types";

export interface MarketConfig {
  id: Market;
  label: string;
  region: string;
  lat: number;
  lon: number;
  airport?: string;
  airportName?: string;
  redditSubs: string[];
  trendsGeo: string;
}

export const MARKETS: MarketConfig[] = [
  {
    id: "NYC",
    label: "New York City",
    region: "US-NY",
    lat: 40.7128,
    lon: -74.006,
    airport: "JFK",
    airportName: "JFK International",
    redditSubs: ["nyc", "travel"],
    trendsGeo: "US-NY",
  },
  {
    id: "LAX",
    label: "Los Angeles",
    region: "US-CA",
    lat: 34.0522,
    lon: -118.2437,
    airport: "LAX",
    airportName: "LAX International",
    redditSubs: ["LosAngeles", "travel"],
    trendsGeo: "US-CA",
  },
  {
    id: "ORD",
    label: "Chicago",
    region: "US-IL",
    lat: 41.8781,
    lon: -87.6298,
    airport: "ORD",
    airportName: "O'Hare International",
    redditSubs: ["chicago", "travel"],
    trendsGeo: "US-IL",
  },
  {
    id: "SEA",
    label: "Seattle",
    region: "US-WA",
    lat: 47.6062,
    lon: -122.3321,
    airport: "SEA",
    airportName: "Seattle-Tacoma International",
    redditSubs: ["Seattle", "travel"],
    trendsGeo: "US-WA",
  },
  {
    id: "SFO",
    label: "San Francisco",
    region: "US-CA",
    lat: 37.7749,
    lon: -122.4194,
    airport: "SFO",
    airportName: "San Francisco International",
    redditSubs: ["sanfrancisco", "bayarea"],
    trendsGeo: "US-CA",
  },
  {
    id: "MIA",
    label: "Miami",
    region: "US-FL",
    lat: 25.7617,
    lon: -80.1918,
    airport: "MIA",
    airportName: "Miami International",
    redditSubs: ["Miami", "travel"],
    trendsGeo: "US-FL",
  },
  {
    id: "BOS",
    label: "Boston",
    region: "US-MA",
    lat: 42.3601,
    lon: -71.0589,
    airport: "BOS",
    airportName: "Boston Logan International",
    redditSubs: ["boston", "travel"],
    trendsGeo: "US-MA",
  },
  {
    id: "AUS",
    label: "Austin",
    region: "US-TX",
    lat: 30.2672,
    lon: -97.7431,
    airport: "AUS",
    airportName: "Austin-Bergstrom International",
    redditSubs: ["Austin", "travel"],
    trendsGeo: "US-TX",
  },
  {
    id: "ATL",
    label: "Atlanta",
    region: "US-GA",
    lat: 33.749,
    lon: -84.388,
    airport: "ATL",
    airportName: "Hartsfield-Jackson Atlanta",
    redditSubs: ["Atlanta", "travel"],
    trendsGeo: "US-GA",
  },
  {
    id: "DFW",
    label: "Dallas",
    region: "US-TX",
    lat: 32.7767,
    lon: -96.797,
    airport: "DFW",
    airportName: "Dallas/Fort Worth International",
    redditSubs: ["Dallas", "travel"],
    trendsGeo: "US-TX",
  },
  {
    id: "US",
    label: "United States (national)",
    region: "US",
    lat: 39.8283,
    lon: -98.5795,
    redditSubs: ["travel", "weather"],
    trendsGeo: "US",
  },
];

export const MARKET_MAP = Object.fromEntries(
  MARKETS.map((m) => [m.id, m])
) as Record<Market, MarketConfig>;

export function getMarketLabel(id: Market): string {
  return MARKET_MAP[id]?.label ?? id;
}

export const DEFAULT_ACTIVE_MARKETS: Market[] = [
  "NYC",
  "SEA",
  "LAX",
  "ORD",
  "SFO",
  "MIA",
];
