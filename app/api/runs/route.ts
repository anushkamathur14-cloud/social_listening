import { NextRequest, NextResponse } from "next/server";
import {
  ensureInitialized,
  getActiveMarkets,
  getDemoSettings,
  isPipelinePaused,
  setActiveMarkets,
  setPipelinePaused,
} from "@/lib/pipeline/orchestrator";
import { getRecentSignals } from "@/lib/triggers/engine";
import type { Market } from "@/lib/types";

export async function GET() {
  await ensureInitialized();
  const signals = await getRecentSignals(30);
  return NextResponse.json({
    signals,
    pipelinePaused: isPipelinePaused(),
    activeMarkets: getActiveMarkets(),
    settings: getDemoSettings(),
  });
}

export async function POST(req: NextRequest) {
  await ensureInitialized();
  const body = await req.json();

  if (typeof body.paused === "boolean") {
    await setPipelinePaused(body.paused);
  }

  if (Array.isArray(body.activeMarkets)) {
    await setActiveMarkets(body.activeMarkets as Market[]);
  }

  return NextResponse.json({
    pipelinePaused: isPipelinePaused(),
    activeMarkets: getActiveMarkets(),
    settings: getDemoSettings(),
  });
}
