import { NextRequest, NextResponse } from "next/server";
import { llmFromCredentials } from "@/lib/creative/llm-config";
import type { LlmCredentials } from "@/lib/integrations";
import { suggestCreativeAngles } from "@/lib/creative/ideator";
import {
  ensureInitialized,
  getSelectedChannels,
} from "@/lib/pipeline/orchestrator";
import { getSignalById } from "@/lib/triggers/engine";
import type { Channel, Market, Signal, SignalType } from "@/lib/types";

export async function POST(req: NextRequest) {
  await ensureInitialized();

  const body = await req.json();
  const signalId = body.signalId as string | undefined;
  const channels = (body.channels as Channel[] | undefined) ?? getSelectedChannels();

  let signal: Signal | null = null;

  if (signalId) {
    const row = await getSignalById(signalId);
    if (row) {
      signal = {
        id: row.id,
        type: row.type as SignalType,
        market: row.market as Market,
        severity: row.severity as Signal["severity"],
        payload: JSON.parse(row.payload),
        detectedAt: row.detectedAt,
      };
    }
  }

  if (!signal && body.type && body.market) {
    const { createWeatherSignal } = await import("@/lib/signals/weather");
    const { createTrafficSignal } = await import("@/lib/signals/traffic");
    const { createTrendSignal } = await import("@/lib/signals/trends");
    const { createRedditSignal } = await import("@/lib/signals/reddit");

    const creators: Record<SignalType, (m: Market) => Signal> = {
      weather: createWeatherSignal,
      traffic: createTrafficSignal,
      trends: createTrendSignal,
      reddit: createRedditSignal,
      social: createRedditSignal,
    };
    signal = creators[body.type as SignalType](body.market as Market);
  }

  if (!signal) {
    return NextResponse.json(
      { ok: false, error: "Signal not found" },
      { status: 404 }
    );
  }

  const llm = llmFromCredentials(body.llm as LlmCredentials | undefined);
  const result = await suggestCreativeAngles(signal, channels, llm);

  return NextResponse.json({
    ok: true,
    signalId: signal.id,
    ...result,
  });
}
