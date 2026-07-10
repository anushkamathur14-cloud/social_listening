import { nanoid } from "nanoid";
import type { Market, Signal } from "../types";

const MOCK_WEATHER: Array<{ market: Market; summary: string; severity: Signal["severity"] }> = [
  { market: "NYC", summary: "Severe thunderstorm warning — flash flooding expected", severity: "high" },
  { market: "LAX", summary: "Extreme heat advisory — 108°F expected", severity: "high" },
  { market: "ORD", summary: "Winter storm watch — heavy snow tonight", severity: "medium" },
];

export async function fetchWeatherSignals(): Promise<Signal[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return mockWeatherSignals();
  }

  const markets: Market[] = ["NYC", "LAX", "ORD"];
  const coords: Record<Market, { lat: number; lon: number }> = {
    NYC: { lat: 40.7128, lon: -74.006 },
    LAX: { lat: 34.0522, lon: -118.2437 },
    ORD: { lat: 41.9742, lon: -87.9073 },
    US: { lat: 39.8283, lon: -98.5795 },
  };

  const signals: Signal[] = [];

  for (const market of markets) {
    try {
      const { lat, lon } = coords[market];
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=imperial`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;

      const data = await res.json();
      const temp = data.main?.temp ?? 70;
      const condition = data.weather?.[0]?.main ?? "Clear";
      const description = data.weather?.[0]?.description ?? "";

      let severity: Signal["severity"] = "low";
      if (temp > 100 || temp < 20 || /storm|thunder|snow|extreme/i.test(description)) {
        severity = "high";
      } else if (temp > 90 || temp < 32 || /rain|wind|fog/i.test(description)) {
        severity = "medium";
      }

      if (severity !== "low") {
        signals.push({
          id: nanoid(),
          type: "weather",
          market,
          severity,
          payload: {
            summary: `${condition}: ${description} (${Math.round(temp)}°F)`,
            temperature: temp,
            condition,
            description,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    } catch {
      // fall through to mock for this market
    }
  }

  return signals.length > 0 ? signals : mockWeatherSignals();
}

function mockWeatherSignals(): Signal[] {
  const pick = MOCK_WEATHER[Math.floor(Math.random() * MOCK_WEATHER.length)];
  return [
    {
      id: nanoid(),
      type: "weather",
      market: pick.market,
      severity: pick.severity,
      payload: { summary: pick.summary, source: "mock" },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createWeatherSignal(market: Market): Signal {
  const mock = MOCK_WEATHER.find((m) => m.market === market) ?? MOCK_WEATHER[0];
  return {
    id: nanoid(),
    type: "weather",
    market,
    severity: mock.severity,
    payload: { summary: mock.summary, source: "injected" },
    detectedAt: new Date().toISOString(),
  };
}

export function isWeatherSignal(signal: Signal): boolean {
  return signal.type === "weather";
}

export function getWeatherAlertSeverity(signal: Signal): string {
  return signal.severity;
}
