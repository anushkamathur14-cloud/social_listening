import { nanoid } from "nanoid";
import { MARKET_MAP, MARKETS } from "../markets";
import type { Market, Signal } from "../types";

const MOCK_DELAYS: Array<{
  market: Market;
  delayMinutes: number;
}> = [
  { market: "ORD", delayMinutes: 67 },
  { market: "LAX", delayMinutes: 52 },
  { market: "NYC", delayMinutes: 48 },
  { market: "SEA", delayMinutes: 55 },
  { market: "SFO", delayMinutes: 41 },
  { market: "ATL", delayMinutes: 63 },
  { market: "MIA", delayMinutes: 38 },
];

export async function fetchTrafficSignals(
  activeMarkets?: Market[]
): Promise<Signal[]> {
  const apiKey = process.env.AVIATION_API_KEY;
  if (!apiKey) {
    return mockTrafficSignals(activeMarkets);
  }

  const marketList = activeMarkets ?? MARKETS.map((m) => m.id);
  const signals: Signal[] = [];

  for (const market of marketList) {
    if (market === "US") continue;
    const cfg = MARKET_MAP[market];
    if (!cfg?.airport) continue;

    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${cfg.airport}&limit=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      const flights = data.data ?? [];
      const delays = flights
        .map((f: { departure?: { delay?: number } }) => f.departure?.delay ?? 0)
        .filter((d: number) => d > 0);
      const avgDelay =
        delays.length > 0
          ? delays.reduce((a: number, b: number) => a + b, 0) / delays.length
          : 0;

      if (avgDelay > 30) {
        signals.push({
          id: nanoid(),
          type: "traffic",
          market,
          severity: avgDelay > 60 ? "high" : "medium",
          payload: {
            summary: `${cfg.label} (${cfg.airport}): avg delay ${Math.round(avgDelay)} min across ${flights.length} flights`,
            sourceUrl: `https://www.flightaware.com/live/airport/${cfg.airport}`,
            sourceLabel: `FlightAware · ${cfg.airportName}`,
            sourceType: "api",
            airport: cfg.airport,
            airportName: cfg.airportName,
            avgDelayMinutes: Math.round(avgDelay),
            flightCount: flights.length,
            city: cfg.label,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    } catch {
      // continue
    }
  }

  return signals.length > 0 ? signals : mockTrafficSignals(activeMarkets);
}

function mockTrafficSignals(activeMarkets?: Market[]): Signal[] {
  const pool = activeMarkets
    ? MOCK_DELAYS.filter((m) => activeMarkets.includes(m.market))
    : MOCK_DELAYS;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_DELAYS[0];
  const cfg = MARKET_MAP[pick.market];

  return [
    {
      id: nanoid(),
      type: "traffic",
      market: pick.market,
      severity: pick.delayMinutes > 60 ? "high" : "medium",
      payload: {
        summary: `${cfg.label} (${cfg.airport}): avg delay ${pick.delayMinutes} minutes`,
        sourceUrl: `https://www.flightaware.com/live/airport/${cfg.airport}`,
        sourceLabel: `FlightAware (mock) · ${cfg.airportName}`,
        sourceType: "mock",
        airport: cfg.airport,
        airportName: cfg.airportName,
        avgDelayMinutes: pick.delayMinutes,
        city: cfg.label,
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createTrafficSignal(market: Market): Signal {
  const mock = MOCK_DELAYS.find((m) => m.market === market) ?? MOCK_DELAYS[0];
  const cfg = MARKET_MAP[market] ?? MARKET_MAP[mock.market];

  return {
    id: nanoid(),
    type: "traffic",
    market,
    severity: mock.delayMinutes > 60 ? "high" : "medium",
    payload: {
      summary: `${cfg.label} (${cfg.airport}): avg delay ${mock.delayMinutes} minutes`,
      sourceUrl: `https://www.flightaware.com/live/airport/${cfg.airport}`,
      sourceLabel: `Injected traffic signal · ${cfg.airportName}`,
      sourceType: "injected",
      airport: cfg.airport,
      airportName: cfg.airportName,
      avgDelayMinutes: mock.delayMinutes,
      city: cfg.label,
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getAvgDelayMinutes(signal: Signal): number {
  return (signal.payload.avgDelayMinutes as number) ?? 0;
}
