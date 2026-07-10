"use client";

import { useCallback, useEffect, useState } from "react";
import type { CreativeAngle } from "@/lib/creative/ideator";
import {
  isLlmConfigured,
  type IntegrationConfig,
} from "@/lib/integrations";
import { filterSignalEvents, type SignalFeedFilters } from "@/lib/signal-filter";
import type { AppEvent, Channel } from "@/lib/types";

interface SignalIdeatorProps {
  events: AppEvent[];
  signalFilters: SignalFeedFilters;
  selectedChannels: Channel[];
  integrations: IntegrationConfig;
  onOpenIntegrations: () => void;
}

export function SignalIdeator({
  events,
  signalFilters,
  selectedChannels,
  integrations,
  onOpenIntegrations,
}: SignalIdeatorProps) {
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

  const [angles, setAngles] = useState<CreativeAngle[]>([]);
  const [source, setSource] = useState<"openai" | "mock" | "user" | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const llmReady = isLlmConfigured(integrations);

  const ideate = useCallback(async () => {
    if (!signal?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/signals/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signalId: signal.id,
          channels: selectedChannels,
          llm: integrations.llm,
        }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error ?? "Ideation failed");
        return;
      }
      setAngles(data.angles ?? []);
      setSource(data.source ?? "mock");
    } catch {
      setError("Could not reach ideation service");
    } finally {
      setLoading(false);
    }
  }, [signal?.id, selectedChannels, integrations.llm]);

  useEffect(() => {
    setAngles([]);
    setSource(null);
    setError(null);
  }, [signal?.id]);

  if (!signal) {
    return (
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-xs text-gray-500">
          No signals match your current city and type filters — adjust filters
          above or inject a signal.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-semibold text-gray-900">
            Creative ideation
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5 line-clamp-2">
            {signal.type.toUpperCase()} · {signal.market} —{" "}
            {signal.payload.summary}
          </p>
        </div>
        <button
          type="button"
          onClick={llmReady ? ideate : onOpenIntegrations}
          disabled={loading || selectedChannels.length === 0}
          className="shrink-0 rounded-lg bg-black hover:bg-zinc-800 disabled:opacity-40 text-white text-[11px] px-3 py-1.5 font-medium"
        >
          {loading ? "Thinking…" : llmReady ? "Suggest angles" : "Add OpenAI key"}
        </button>
      </div>

      {source && (
        <p className="text-[10px] text-gray-400">
          {source === "mock"
            ? "Template suggestions — add your OpenAI key in Integrations for live LLM ideation"
            : `Live LLM suggestions · ${integrations.llm?.model ?? "gpt-4o-mini"}`}
        </p>
      )}

      {error && (
        <p className="text-[11px] text-red-600 bg-red-50 border border-red-100 rounded px-2 py-1">
          {error}
        </p>
      )}

      {angles.length > 0 && (
        <ul className="space-y-2 max-h-48 overflow-y-auto">
          {angles.map((angle) => (
            <li
              key={angle.id}
              className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 text-xs"
            >
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span className="font-semibold text-gray-900">{angle.title}</span>
                <span className="rounded-full bg-white border border-gray-200 px-1.5 py-0.5 text-[9px] text-gray-600">
                  {angle.vertical}
                </span>
              </div>
              <p className="text-gray-800 font-medium">{angle.hook}</p>
              <p className="text-[10px] text-gray-500 mt-1">{angle.rationale}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
