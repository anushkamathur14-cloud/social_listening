"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChannelSelector } from "@/components/ChannelSelector";
import { CreativeCustomizer } from "@/components/CreativeCustomizer";
import { CreativeCard } from "@/components/CreativeCard";
import { DemoScenarios, type DemoScenario } from "@/components/DemoScenarios";
import { HowItWorks } from "@/components/HowItWorks";
import { IntegrationsCallout } from "@/components/IntegrationsCallout";
import { IntegrationsPanel } from "@/components/IntegrationsPanel";
import { MetricsPanel } from "@/components/MetricsPanel";
import { PipelineStepper } from "@/components/PipelineStepper";
import { SignalFeed } from "@/components/SignalFeed";
import { SignalIdeator } from "@/components/SignalIdeator";
import { StatsBar } from "@/components/StatsBar";
import { ChannelFilterBanner } from "@/components/ChannelFilterBanner";
import { countPendingForChannels } from "@/lib/channel-filter";
import { DEFAULT_CHANNELS } from "@/lib/channels";
import {
  creativesToEvents,
  mergeEventHistory,
  signalsToEvents,
} from "@/lib/events/hydrate";
import {
  isLlmConfigured,
  isProviderConfigured,
  loadIntegrations,
  type IntegrationConfig,
  type IntegrationProvider,
} from "@/lib/integrations";
import { MARKETS } from "@/lib/markets";
import { platform } from "@/lib/platform";
import type { AppEvent, Channel, Market, SignalType } from "@/lib/types";

const INJECTABLE_MARKETS = MARKETS.filter((m) => m.id !== "US");

const SIGNAL_TYPES: { id: SignalType; label: string; icon: string }[] = [
  { id: "traffic", label: "Traffic", icon: "✈️" },
  { id: "weather", label: "Weather", icon: "⛈️" },
  { id: "trends", label: "Trends", icon: "📈" },
  { id: "reddit", label: "Community", icon: "💬" },
];

type Tab = "how-it-works" | "overview" | "creatives" | "performance";

export default function Dashboard() {
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [injectMarket, setInjectMarket] = useState<Market>("ORD");
  const [signalType, setSignalType] = useState<SignalType>("traffic");
  const [activeMarkets, setActiveMarkets] = useState<Market[]>([
    "NYC",
    "SEA",
    "LAX",
    "ORD",
  ]);
  const [selectedChannels, setSelectedChannels] =
    useState<Channel[]>(DEFAULT_CHANNELS);
  const [paused, setPaused] = useState(false);
  const [injecting, setInjecting] = useState(false);
  const [injectMessage, setInjectMessage] = useState<string | null>(null);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("how-it-works");
  const [showIntegrations, setShowIntegrations] = useState(false);
  const [integrations, setIntegrations] = useState<IntegrationConfig>({});
  const cityPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIntegrations(loadIntegrations());
  }, []);

  useEffect(() => {
    fetch("/api/runs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.activeMarkets)) setActiveMarkets(data.activeMarkets);
        if (Array.isArray(data.selectedChannels))
          setSelectedChannels(data.selectedChannels);
        if (typeof data.pipelinePaused === "boolean") setPaused(data.pipelinePaused);
      })
      .catch(() => {});

    fetch("/api/campaigns")
      .then((r) => r.json())
      .then((data) => {
        const hydrated = [
          ...creativesToEvents(data.creatives ?? []),
          ...signalsToEvents(data.signals ?? []),
        ];
        if (hydrated.length > 0) {
          setEvents((prev) => mergeEventHistory(prev, hydrated));
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
          if (event.type === "creative_generated") {
            setActiveTab("creatives");
            setInjectMessage(null);
          }
        }
      } catch {
        /* heartbeat */
      }
    };
    return () => source.close();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (
        showCityPicker &&
        cityPickerRef.current &&
        !cityPickerRef.current.contains(e.target as Node)
      ) {
        setShowCityPicker(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showCityPicker]);

  const saveSettings = useCallback(
    async (patch: {
      activeMarkets?: Market[];
      selectedChannels?: Channel[];
      paused?: boolean;
    }) => {
      await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
    },
    []
  );

  const toggleCity = useCallback(
    async (city: Market) => {
      const next = activeMarkets.includes(city)
        ? activeMarkets.filter((m) => m !== city)
        : [...activeMarkets, city];
      if (next.length === 0) return;
      setActiveMarkets(next);
      await saveSettings({ activeMarkets: next });
    },
    [activeMarkets, saveSettings]
  );

  const onChannelsChange = useCallback(
    async (channels: Channel[]) => {
      setSelectedChannels(channels);
      await saveSettings({ selectedChannels: channels });
    },
    [saveSettings]
  );

  const injectSignal = useCallback(
    async (type?: SignalType, market?: Market) => {
      setInjecting(true);
      setInjectMessage(null);
      setActiveTab("overview");
      try {
        const res = await fetch("/api/signals/inject", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: type ?? signalType,
            market: market ?? injectMarket,
            channels: selectedChannels,
            llm: integrations.llm,
          }),
        });
        const data = await res.json();
        if (data.pipelineStarted) {
          setInjectMessage("Signal injected — building channel creatives…");
        } else if (!data.triggered) {
          setInjectMessage(
            "Signal saved but pipeline did not start. Check cities/channels or resume pipeline."
          );
        }
      } catch {
        setInjectMessage("Inject failed — check the dev server is running.");
      } finally {
        setInjecting(false);
      }
    },
    [signalType, injectMarket, selectedChannels, integrations.llm]
  );

  const runScenario = useCallback(
    async (scenario: DemoScenario) => {
      setActiveTab("overview");
      setSignalType(scenario.signalType);
      setInjectMarket(scenario.market);
      if (!activeMarkets.includes(scenario.market)) {
        const next = [...activeMarkets, scenario.market];
        setActiveMarkets(next);
        await saveSettings({ activeMarkets: next });
      }
      await injectSignal(scenario.signalType, scenario.market);
    },
    [activeMarkets, injectSignal, saveSettings]
  );

  const togglePause = useCallback(async () => {
    const next = !paused;
    setPaused(next);
    await saveSettings({ paused: next });
  }, [paused, saveSettings]);

  const publishCreative = useCallback(
    async (creativeId: string) => {
      const creds = loadIntegrations();
      await fetch(`/api/creatives/${creativeId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ integrations: creds }),
      });
    },
    []
  );

  const configuredCount = (
    ["meta", "smartly", "google_ads", "dv360"] as IntegrationProvider[]
  ).filter((p) => isProviderConfigured(integrations, p)).length;

  const integrationBadgeCount =
    configuredCount + (isLlmConfigured(integrations) ? 1 : 0);

  const filteredEvents = events.filter((e) => {
    if (e.type !== "signal_detected") return true;
    const market = (e.data.signal as { market: string }).market as Market;
    return activeMarkets.includes(market);
  });

  const pendingCount = countPendingForChannels(events, selectedChannels);

  const tabs: { id: Tab; label: string; badge?: number }[] = [
    { id: "how-it-works", label: "How it works" },
    { id: "overview", label: "Live demo" },
    { id: "creatives", label: "Creatives", badge: pendingCount || undefined },
    { id: "performance", label: "Performance" },
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <IntegrationsPanel
        open={showIntegrations}
        onClose={() => setShowIntegrations(false)}
        onChange={setIntegrations}
      />

      <header className="border-b border-gray-200 bg-white/95 backdrop-blur sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-black flex items-center justify-center text-white font-bold text-xs border border-zinc-700">
                {platform.initials}
              </div>
              <div>
                <h1 className="text-base font-bold tracking-tight text-gray-900">
                  {platform.name}
                </h1>
                <p className="text-[11px] text-gray-500 hidden sm:block max-w-md leading-snug">
                  {platform.shortTagline}
                </p>
              </div>
            </div>

            <div className="ml-auto flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowIntegrations(true)}
                className="rounded-lg text-xs px-3 py-1.5 font-medium border border-gray-200 hover:bg-gray-50 transition-colors text-gray-800"
              >
                Integrations
                {integrationBadgeCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-[var(--uber-green)] text-white text-[9px] px-1.5 py-0.5">
                    {integrationBadgeCount}
                  </span>
                )}
              </button>

              {activeTab !== "how-it-works" && (
                <>
                  <span
                    className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-full border ${
                      connected
                        ? "text-[var(--uber-green-dark)] border-green-200 bg-green-50"
                        : "text-red-600 border-red-200 bg-red-50"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-[var(--uber-green)] animate-pulse" : "bg-red-500"}`}
                    />
                    {connected ? "Live" : "Offline"}
                  </span>

                  <button
                    type="button"
                    onClick={togglePause}
                    className={`rounded-lg text-xs px-3 py-1.5 font-medium transition-colors ${
                      paused
                        ? "bg-[var(--uber-green)] hover:bg-[var(--uber-green-dark)] text-white"
                        : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-[var(--border)]"
                    }`}
                  >
                    {paused ? "▶ Resume" : "⏸ Pause"}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Primary navigation — top level */}
          <nav
            className="flex gap-1 border-b border-gray-200 -mb-px pt-1"
            aria-label="Main"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 py-2.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "text-black border-b-2 border-black -mb-px bg-gray-50/80 rounded-t-lg"
                    : "text-gray-500 hover:text-black hover:bg-gray-50/50 rounded-t-lg"
                }`}
              >
                {tab.label}
                {tab.badge ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 text-amber-700 text-[10px] px-1.5 py-0.5">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </nav>

          {/* Demo controls — only on operational tabs */}
          {activeTab !== "how-it-works" && (
            <>
              <StatsBar
                events={events}
                activeMarkets={activeMarkets}
                selectedChannels={selectedChannels}
              />

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider shrink-0">
                    Quick demo
                  </span>
                  <DemoScenarios
                    onRun={runScenario}
                    running={injecting}
                    disabled={selectedChannels.length === 0}
                  />
                </div>

                {injectMessage && (
                  <p className="text-[11px] text-gray-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                    {injectMessage}
                  </p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-200">
                  <div className="relative" ref={cityPickerRef}>
                    <button
                      type="button"
                      onClick={() => setShowCityPicker((s) => !s)}
                      className="rounded-lg bg-white border border-gray-200 text-xs px-3 py-1.5 hover:bg-gray-50 text-gray-800"
                    >
                      Cities ({activeMarkets.length}) ▾
                    </button>
                    {showCityPicker && (
                      <div className="absolute left-0 top-full mt-1 z-30 w-56 rounded-lg border border-gray-200 bg-white shadow-xl p-2 max-h-64 overflow-y-auto">
                        {INJECTABLE_MARKETS.map((m) => (
                          <label
                            key={m.id}
                            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-50 cursor-pointer text-xs"
                          >
                            <input
                              type="checkbox"
                              checked={activeMarkets.includes(m.id)}
                              onChange={() => toggleCity(m.id)}
                            />
                            <span>{m.label}</span>
                            <span className="ml-auto text-zinc-400">{m.id}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  <select
                    value={injectMarket}
                    onChange={(e) => setInjectMarket(e.target.value as Market)}
                    className="rounded-lg bg-white border border-gray-200 text-xs px-3 py-1.5 text-gray-800"
                  >
                    {INJECTABLE_MARKETS.filter((m) =>
                      activeMarkets.includes(m.id)
                    ).map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.label}
                      </option>
                    ))}
                  </select>

                  <div className="flex flex-wrap gap-1">
                    {SIGNAL_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSignalType(t.id)}
                        className={`rounded-lg text-xs px-2.5 py-1.5 border transition-colors ${
                          signalType === t.id
                            ? "bg-black border-black text-white"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {t.icon} {t.label}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => injectSignal()}
                    disabled={injecting || selectedChannels.length === 0}
                    className="rounded-lg bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-xs px-4 py-1.5 font-semibold transition-colors ml-auto"
                  >
                    {injecting ? "Crawling sources…" : "Inject Signal"}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wide shrink-0">
                    Channels
                  </span>
                  <ChannelSelector
                    selected={selectedChannels}
                    onChange={onChannelsChange}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 animate-fade-in">
        {activeTab === "how-it-works" && (
          <HowItWorks
            onOpenIntegrations={() => setShowIntegrations(true)}
            onGoToDemo={() => setActiveTab("overview")}
            integrationsConfigured={configuredCount}
          />
        )}

        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-4">
              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Live Signal Feed
                </h2>
                <p className="text-[10px] text-gray-500 mb-3">
                  Filtered to selected cities · UA vertical hint per signal
                </p>
                <SignalFeed events={filteredEvents} filterMarkets={activeMarkets} />
              </div>
              <SignalIdeator
                events={events}
                selectedChannels={selectedChannels}
                integrations={integrations}
                onOpenIntegrations={() => setShowIntegrations(true)}
              />
            </section>

            <section className="rounded-xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[var(--uber-green)]" />
                Pipeline Tracker
              </h2>
              <PipelineStepper events={events} />
            </section>
          </div>
        )}

        {activeTab === "creatives" && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Creative Preview — Compare & Approve
            </h2>
            <p className="text-[10px] text-gray-500 mb-3">
              Review channel variants side-by-side · expand API payload before routing
            </p>
            <IntegrationsCallout
              onOpen={() => setShowIntegrations(true)}
              configuredCount={integrationBadgeCount}
            />
            <ChannelFilterBanner selectedChannels={selectedChannels} />
            <CreativeCustomizer
              events={events}
              selectedChannels={selectedChannels}
              integrations={integrations}
              onOpenIntegrations={() => setShowIntegrations(true)}
            />
            <CreativeCard
              events={events}
              onPublish={publishCreative}
              integrations={integrations}
              selectedChannels={selectedChannels}
            />
          </section>
        )}

        {activeTab === "performance" && (
          <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-600" />
              Routed campaigns & performance
            </h2>
            <p className="text-[10px] text-gray-500 mb-4">
              What you approved, when it routed, which channel — plus simulated CTR, spend, and optimizer status
            </p>
            <ChannelFilterBanner selectedChannels={selectedChannels} />
            <MetricsPanel events={events} selectedChannels={selectedChannels} />
          </section>
        )}
      </main>

      <footer className="border-t border-gray-200 py-4 text-center text-xs text-gray-500 bg-gray-50">
        {platform.name} · portfolio demo · Images from{" "}
        <a
          href="https://unsplash.com/?utm_source=signal_ads_demo&utm_medium=referral"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:underline"
        >
          Unsplash
        </a>
        {" · "}
        Built by{" "}
        <a
          href="https://anushkainnovation.com/projects"
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:underline"
        >
          anushkainnovation.com/projects
        </a>
      </footer>
    </div>
  );
}
