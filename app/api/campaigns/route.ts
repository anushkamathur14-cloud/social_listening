import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { ensureInitialized } from "@/lib/pipeline/orchestrator";
import { db } from "@/lib/db/client";
import { creatives, pipelineRuns, triggers } from "@/lib/db/schema";
import { getCampaignDashboard } from "@/lib/performance/dashboard";
import { getLatestPerformance } from "@/lib/optimize/simulator";
import { getRecentSignals } from "@/lib/triggers/engine";

export async function GET() {
  await ensureInitialized();

  const [dashboard, creativeRows, runRows, triggerRows, perfRows, signalRows] =
    await Promise.all([
      getCampaignDashboard(),
      db.select().from(creatives).orderBy(desc(creatives.createdAt)).limit(20),
      db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(10),
      db.select().from(triggers).orderBy(desc(triggers.firedAt)).limit(10),
      getLatestPerformance(20),
      getRecentSignals(20),
    ]);

  return NextResponse.json({
    campaigns: dashboard,
    creatives: creativeRows,
    signals: signalRows,
    runs: runRows,
    triggers: triggerRows,
    performance: perfRows,
  });
}
