import { nanoid } from "nanoid";
import type { Market, Signal } from "../types";

const MOCK_DELAYS: Array<{ market: Market; airport: string; delayMinutes: number }> = [
  { market: "ORD", airport: "O'Hare International", delayMinutes: 67 },
  { market: "LAX", airport: "LAX International", delayMinutes: 52 },
  { market: "NYC", airport: "JFK International", delayMinutes: 48 },
];

export async function fetchTrafficSignals(): Promise<Signal[]> {
  const apiKey = process.env.AVIATION_API_KEY;
  if (!apiKey) {
    return mockTrafficSignals();
  }

  const airports: Record<Market, string> = {
    ORD: "ORD",
    LAX: "LAX",
    NYC: "JFK",
    US: "ORD",
  };

  const signals: Signal[] = [];

  for (const [market, iata] of Object.entries(airports) as [Market, string][]) {
    if (market === "US") continue;
    try {
      const url = `http://api.aviationstack.com/v1/flights?access_key=${apiKey}&dep_iata=${iata}&limit=10`;
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
            summary: `${iata} airport avg delay ${Math.round(avgDelay)} min`,
            airport: iata,
            avgDelayMinutes: Math.round(avgDelay),
            flightCount: flights.length,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    } catch {
      // continue
    }
  }

  return signals.length > 0 ? signals : mockTrafficSignals();
}

function mockTrafficSignals(): Signal[] {
  const pick = MOCK_DELAYS[Math.floor(Math.random() * MOCK_DELAYS.length)];
  return [
    {
      id: nanoid(),
      type: "traffic",
      market: pick.market,
      severity: pick.delayMinutes > 60 ? "high" : "medium",
      payload: {
        summary: `${pick.airport} — avg delay ${pick.delayMinutes} minutes`,
        airport: pick.airport,
        avgDelayMinutes: pick.delayMinutes,
        source: "mock",
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createTrafficSignal(market: Market): Signal {
  const mock = MOCK_DELAYS.find((m) => m.market === market) ?? MOCK_DELAYS[0];
  return {
    id: nanoid(),
    type: "traffic",
    market,
    severity: mock.delayMinutes > 60 ? "high" : "medium",
    payload: {
      summary: `${mock.airport} — avg delay ${mock.delayMinutes} minutes`,
      airport: mock.airport,
      avgDelayMinutes: mock.delayMinutes,
      source: "injected",
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getAvgDelayMinutes(signal: Signal): number {
  return (signal.payload.avgDelayMinutes as number) ?? 0;
}
