import { NextRequest, NextResponse } from "next/server";
import { llmFromCredentials } from "@/lib/creative/llm-config";
import type { LlmCredentials } from "@/lib/integrations";
import { ensureInitialized, injectSignal } from "@/lib/pipeline/orchestrator";
import type { Channel, Market, SignalType } from "@/lib/types";

export async function POST(req: NextRequest) {
  await ensureInitialized();

  const body = await req.json();
  const type = (body.type ?? "weather") as SignalType;
  const market = (body.market ?? "NYC") as Market;
  const channels = body.channels as Channel[] | undefined;
  const llm = llmFromCredentials(body.llm as LlmCredentials | undefined);

  const result = await injectSignal(type, market, channels, llm);

  let signal = null;
  if (result?.signalId) {
    const { getSignalById } = await import("@/lib/triggers/engine");
    const row = await getSignalById(result.signalId);
    if (row) {
      signal = {
        id: row.id,
        type: row.type,
        market: row.market,
        severity: row.severity,
        payload: JSON.parse(row.payload),
        detectedAt: row.detectedAt,
      };
    }
  }

  return NextResponse.json({
    ok: true,
    triggered: !!result?.trigger,
    trigger: result?.trigger ?? null,
    signalId: result?.signalId ?? null,
    triggerId: result?.trigger?.id ?? null,
    signal,
    pipelineStarted: result?.pipelineStarted ?? false,
  });
}
