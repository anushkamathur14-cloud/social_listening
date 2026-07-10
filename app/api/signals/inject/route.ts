import { NextRequest, NextResponse } from "next/server";
import { ensureInitialized, injectSignal } from "@/lib/pipeline/orchestrator";
import type { Market, SignalType } from "@/lib/types";

export async function POST(req: NextRequest) {
  await ensureInitialized();

  const body = await req.json();
  const type = (body.type ?? "weather") as SignalType;
  const market = (body.market ?? "NYC") as Market;

  const trigger = await injectSignal(type, market);

  return NextResponse.json({
    ok: true,
    triggered: !!trigger,
    trigger,
  });
}
