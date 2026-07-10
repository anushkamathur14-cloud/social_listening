import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized, injectSignal } from "@/lib/pipeline/orchestrator";
import type { Channel, Market, SignalType } from "@/lib/types";

export async function POST(req: NextRequest) {
  await ensureInitialized();

  const body = await req.json();
  const type = (body.type ?? "weather") as SignalType;
  const market = (body.market ?? "NYC") as Market;
  const channels = body.channels as Channel[] | undefined;

  const trigger = await injectSignal(type, market, channels);

  return NextResponse.json({
    ok: true,
    triggered: !!trigger?.trigger,
    trigger: trigger?.trigger ?? null,
    signalId: trigger?.signalId ?? null,
    pipelineStarted: trigger?.pipelineStarted ?? false,
  });
}
