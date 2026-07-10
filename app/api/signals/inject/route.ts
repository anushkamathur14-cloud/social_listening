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

  const trigger = await injectSignal(type, market, channels, llm);

  return NextResponse.json({
    ok: true,
    triggered: !!trigger?.trigger,
    trigger: trigger?.trigger ?? null,
    signalId: trigger?.signalId ?? null,
    pipelineStarted: trigger?.pipelineStarted ?? false,
  });
}
