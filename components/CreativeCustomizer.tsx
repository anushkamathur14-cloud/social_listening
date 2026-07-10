"use client";

import { useCallback, useEffect, useState } from "react";
import {
  isLlmConfigured,
  loadIntegrations,
  type IntegrationConfig,
} from "@/lib/integrations";
import { filterSignalEvents, type SignalFeedFilters } from "@/lib/signal-filter";
import type { AppEvent, Channel } from "@/lib/types";

interface CreativeCustomizerProps {
  events: AppEvent[];
  signalFilters: SignalFeedFilters;
  selectedChannels: Channel[];
  integrations: IntegrationConfig;
  onOpenIntegrations: () => void;
}

export function CreativeCustomizer({
  events,
  signalFilters,
  selectedChannels,
  integrations,
  onOpenIntegrations,
}: CreativeCustomizerProps) {
  const latestSignal = [...filterSignalEvents(events, signalFilters)]
    .reverse()[0];

  const signal = latestSignal?.data.signal as
    | {
        id: string;
        type: string;
        market: string;
        payload: { summary: string };
      }
    | undefined;

  const [brief, setBrief] = useState(integrations.llm?.brandVoice ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const llmReady = isLlmConfigured(integrations);

  useEffect(() => {
    if (integrations.llm?.brandVoice && !brief) {
      setBrief(integrations.llm.brandVoice);
    }
  }, [integrations.llm?.brandVoice, brief]);

  const generate = useCallback(async () => {
    if (!signal?.id || !brief.trim()) return;
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/creatives/customize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          channels: selectedChannels,
          customBrief: brief.trim(),
          llm: integrations.llm,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Generation failed");
        return;
      }
      setSuccess(
        `${data.count} customized creative${data.count !== 1 ? "s" : ""} generated — check below`
      );
    } catch {
      setError("Could not reach generation service");
    } finally {
      setLoading(false);
    }
  }, [signal?.id, brief, selectedChannels, integrations.llm]);

  if (!signal) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/30 p-5 text-center">
        <p className="text-sm text-gray-600">
          No signals match your current filters — adjust city or signal type above,
          or inject a signal first.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-white p-5 space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <span aria-hidden>✨</span>
            Customize creatives with AI
          </h3>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">
            {signal.type.toUpperCase()} · {signal.market} — {signal.payload.summary}
          </p>
        </div>
        {!llmReady && (
          <button
            type="button"
            onClick={onOpenIntegrations}
            className="shrink-0 rounded-lg border border-indigo-300 bg-white text-indigo-800 text-xs px-3 py-1.5 font-medium hover:bg-indigo-50"
          >
            Add OpenAI key
          </button>
        )}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-gray-700">
          Your creative direction
        </span>
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          placeholder="e.g. Gen Z tone, emphasize $0 delivery, mention storm safety, test urgency vs comfort angles…"
          rows={3}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y"
        />
        <p className="text-[11px] text-gray-500">
          Applied on top of the signal context for all selected channels. Default
          brand voice from Integrations pre-fills here.
        </p>
      </label>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}
      {success && (
        <p className="text-xs text-green-800 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {success}
        </p>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={loading || !llmReady || !brief.trim() || selectedChannels.length === 0}
        className="w-full rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-sm font-semibold py-2.5 transition-colors"
      >
        {loading
          ? "Generating customized creatives…"
          : llmReady
            ? "Generate customized creatives"
            : "Add OpenAI key to generate"}
      </button>
    </div>
  );
}
