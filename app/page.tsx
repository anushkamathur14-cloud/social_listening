"use client";

import { useCallback, useEffect, useState } from "react";
import { CreativeCard } from "@/components/CreativeCard";
import { MetricsPanel } from "@/components/MetricsPanel";
import { PipelineStepper } from "@/components/PipelineStepper";
import { SignalFeed } from "@/components/SignalFeed";
import { MARKETS } from "@/lib/markets";
import type { AppEvent, Market, SignalType } from "@/lib/types";

const INJECTABLE_MARKETS = MARKETS.filter((m) => m.id !== "US");
const SIGNAL_TYPES: SignalType[] = [
  "weather",
  "traffic",
  "trends",
  "reddit",
];

export default function Dashboard() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [injectMarket, setInjectMarket] = useState<Market>("NYC");
  const [signalType, setSignalType] = useState<SignalType>("reddit");
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([
    "NYC",
    "SEA",
    "LAX",
    "ORD",
    "SFO",
    "MIA",
  ]);
  const [paused, setPaused] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.activeMarkets)) {
          setActiveMarkets(data.activeMarkets);
        }
        if (typeof data.pipelinePaused === "boolean") {
          setPaused(data.pipelinePaused);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/events/stream");

    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);

    source.onmessage = (msg) => {
      try {
        const event = JSON.parse(msg.data) as AppEvent;
        if (event.type) {
          setEvents((prev) => [...prev.slice(-199), event]);
        }
      } catch {
        // heartbeat or non-json
      }
    };

    return () => source.close();
  }, []);

  const toggleCity = useCallback(
    async (city: Market) => {
      const next = activeMarkets.includes(city)
        ? activeMarkets.filter((m) => m !== city)
        : [...activeMarkets, city];
      if (next.length === 0) return;
      setActiveMarkets(next);
      await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeMarkets: next }),
      });
    },
    [activeMarkets]
  );

  const injectSignal = useCallback(async () => {
    setInjecting(true);
    try {
      await fetch("/api/signals/inject", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: signalType, market: injectMarket }),
      });
    } finally {
      setInjecting(false);
    }
  }, [signalType, injectMarket]);

  const togglePause = useCallback(async () => {
    const res = await fetch("/api/runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paused: !paused }),
    });
    const data = await res.json();
    setPaused(data.pipelinePaused);
  }, [paused]);

  const approveCampaign = useCallback(async (campaignId: string) => {
    await fetch(`/api/campaigns/${campaignId}/approve`, { method: "POST" });
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Signal-Led Creative Response
            </h1>
            <p className="text-xs text-zinc-500">
              Event-driven · Product-linked · Trust-but-verify
            </p>
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 text-xs ${connected ? "text-green-400" : "text-red-400"}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-red-400"}`}
              />
              {connected ? "Live" : "Disconnected"}
            </span>

            <div className="relative">
              <button
                onClick={() => setShowCityPicker((s) => !s)}
                className="rounded-md bg-zinc-800 border border-zinc-700 text-xs px-2 py-1.5"
              >
                Cities ({activeMarkets.length})
              </button>
              {showCityPicker && (
                <div className="absolute right-0 top-full mt-1 z-20 w-56 rounded-lg border border-zinc-700 bg-zinc-900 shadow-xl p-2 max-h-64 overflow-y-auto">
                  {INJECTABLE_MARKETS.map((m) => (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={activeMarkets.includes(m.id)}
                        onChange={() => toggleCity(m.id)}
                        className="rounded"
                      />
                      <span>{m.label}</span>
                      <span className="ml-auto text-zinc-600">{m.id}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <select
              value={injectMarket}
              onChange={(e) => setInjectMarket(e.target.value as Market)}
              className="rounded-md bg-zinc-800 border border-zinc-700 text-xs px-2 py-1.5"
            >
              {INJECTABLE_MARKETS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={signalType}
              onChange={(e) => setSignalType(e.target.value as SignalType)}
              className="rounded-md bg-zinc-800 border border-zinc-700 text-xs px-2 py-1.5"
            >
              {SIGNAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              onClick={injectSignal}
              disabled={injecting}
              className="rounded-md bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs px-3 py-1.5 font-medium transition-colors"
            >
              {injecting ? "Injecting..." : "Inject Signal"}
            </button>

            <button
              onClick={togglePause}
              className={`rounded-md text-xs px-3 py-1.5 font-medium transition-colors ${
                paused
                  ? "bg-green-600 hover:bg-green-500 text-white"
                  : "bg-zinc-700 hover:bg-zinc-600 text-zinc-200"
              }`}
            >
              {paused ? "Resume" : "Pause Pipeline"}
            </button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-2 flex flex-wrap gap-1.5">
          {activeMarkets.map((id) => {
            const label = MARKETS.find((m) => m.id === id)?.label ?? id;
            return (
              <span
                key={id}
                className="rounded-full bg-zinc-800 border border-zinc-700 text-[10px] px-2 py-0.5 text-zinc-400"
              >
                {label}
              </span>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Live Signal Feed
          </h2>
          <SignalFeed events={events} filterMarkets={activeMarkets} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            Pipeline Tracker
          </h2>
          <PipelineStepper events={events} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            Creative Preview
          </h2>
          <CreativeCard events={events} onApprove={approveCampaign} />
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 lg:col-span-2">
          <h2 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400" />
            Performance & Optimizer
          </h2>
          <MetricsPanel events={events} />
        </section>
      </main>

      <footer className="border-t border-zinc-800 py-3 text-center text-xs text-zinc-600">
        Built by{" "}
        <a
          href="https://anushkainnovation.com/projects"
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-500 hover:text-cyan-400"
        >
          anushkainnovation.com/projects
        </a>
      </footer>
    </div>
  );
}
