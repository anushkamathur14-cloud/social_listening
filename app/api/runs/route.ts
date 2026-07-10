import { NextRequest, NextResponse } from "next/server";
import {
  ensureInitialized,
  isPipelinePaused,
  setPipelinePaused,
} from "@/lib/pipeline/orchestrator";
import { getRecentSignals } from "@/lib/triggers/engine";

export async function GET() {
  await ensureInitialized();
  const signals = await getRecentSignals(30);
  return NextResponse.json({ signals, pipelinePaused: isPipelinePaused() });
}

export async function POST(req: NextRequest) {
  await ensureInitialized();
  const body = await req.json();

  if (typeof body.paused === "boolean") {
    await setPipelinePaused(body.paused);
  }

  return NextResponse.json({ pipelinePaused: isPipelinePaused() });
}
