import { nanoid } from "nanoid";
import { MARKET_MAP } from "../markets";
import type { Market, Signal } from "../types";

const MOCK_WEATHER: Array<{
  market: Market;
  summary: string;
  severity: Signal["severity"];
}> = [
  {
    market: "NYC",
    summary: "Severe thunderstorm warning — flash flooding expected",
    severity: "high",
  },
  {
    market: "SEA",
    summary: "Heavy rain advisory — urban flooding in downtown Seattle",
    severity: "high",
  },
  {
    market: "LAX",
    summary: "Extreme heat advisory — 108°F expected",
    severity: "high",
  },
  {
    market: "ORD",
    summary: "Winter storm watch — heavy snow tonight",
    severity: "medium",
  },
  {
    market: "MIA",
    summary: "Tropical storm watch — high winds and flooding risk",
    severity: "high",
  },
  {
    market: "SFO",
    summary: "Dense fog advisory — visibility below ¼ mile",
    severity: "medium",
  },
];

function weatherSourceUrl(market: Market, lat: number, lon: number): string {
  return `https://openweathermap.org/weathermap?basemap=map&cities=true&layer=temperature&lat=${lat}&lon=${lon}&zoom=10`;
}

export async function fetchWeatherSignals(
  activeMarkets?: Market[]
): Promise<Signal[]> {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  const markets = (activeMarkets ?? Object.keys(MARKET_MAP)).filter(
    (m) => m !== "US"
  ) as Market[];

  if (!apiKey) {
    return mockWeatherSignals(activeMarkets);
  }

  const signals: Signal[] = [];

  for (const market of markets) {
    const cfg = MARKET_MAP[market];
    if (!cfg) continue;

    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${cfg.lat}&lon=${cfg.lon}&appid=${apiKey}&units=imperial`;
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
            summary: `${cfg.label}: ${condition} — ${description} (${Math.round(temp)}°F)`,
            sourceUrl: weatherSourceUrl(market, cfg.lat, cfg.lon),
            sourceLabel: `OpenWeather · ${cfg.label}`,
            sourceType: "api",
            temperature: temp,
            condition,
            description,
            city: cfg.label,
          },
          detectedAt: new Date().toISOString(),
        });
      }
    } catch {
      // continue
    }
  }

  return signals.length > 0 ? signals : mockWeatherSignals(activeMarkets);
}

function mockWeatherSignals(activeMarkets?: Market[]): Signal[] {
  const pool = activeMarkets
    ? MOCK_WEATHER.filter((m) => activeMarkets.includes(m.market))
    : MOCK_WEATHER;
  const pick = pool[Math.floor(Math.random() * pool.length)] ?? MOCK_WEATHER[0];
  const cfg = MARKET_MAP[pick.market];

  return [
    {
      id: nanoid(),
      type: "weather",
      market: pick.market,
      severity: pick.severity,
      payload: {
        summary: `${cfg.label}: ${pick.summary}`,
        sourceUrl: weatherSourceUrl(pick.market, cfg.lat, cfg.lon),
        sourceLabel: `OpenWeather (mock) · ${cfg.label}`,
        sourceType: "mock",
        city: cfg.label,
      },
      detectedAt: new Date().toISOString(),
    },
  ];
}

export function createWeatherSignal(market: Market): Signal {
  const mock =
    MOCK_WEATHER.find((m) => m.market === market) ?? MOCK_WEATHER[0];
  const cfg = MARKET_MAP[market] ?? MARKET_MAP[mock.market];

  return {
    id: nanoid(),
    type: "weather",
    market,
    severity: mock.severity,
    payload: {
      summary: `${cfg.label}: ${mock.summary}`,
      sourceUrl: weatherSourceUrl(market, cfg.lat, cfg.lon),
      sourceLabel: `Injected weather signal · ${cfg.label}`,
      sourceType: "injected",
      city: cfg.label,
    },
    detectedAt: new Date().toISOString(),
  };
}

export function getWeatherAlertSeverity(signal: Signal): string {
  return signal.severity;
}
