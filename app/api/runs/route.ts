import { NextRequest, NextResponse } from "next/server";
import {
  ensureInitialized,
  getActiveMarkets,
  getDemoSettings,
  getSelectedChannels,
  isPipelinePaused,
  setActiveMarkets,
  setPipelinePaused,
  setSelectedChannels,
} from "@/lib/pipeline/orchestrator";
import { getRecentSignals } from "@/lib/triggers/engine";
import type { Channel, Market } from "@/lib/types";

export async function GET() {
  await ensureInitialized();
  const signals = await getRecentSignals(30);
  const activeMarkets = getActiveMarkets();

  return NextResponse.json({
    signals: signals.filter((s) =>
      activeMarkets.includes(s.market as Market)
    ),
    pipelinePaused: isPipelinePaused(),
    activeMarkets,
    selectedChannels: getSelectedChannels(),
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

  if (Array.isArray(body.selectedChannels)) {
    await setSelectedChannels(body.selectedChannels as Channel[]);
  }

  return NextResponse.json({
    pipelinePaused: isPipelinePaused(),
    activeMarkets: getActiveMarkets(),
    selectedChannels: getSelectedChannels(),
    settings: getDemoSettings(),
  });
}
