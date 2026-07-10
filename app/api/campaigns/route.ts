import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { ensureInitialized } from "@/lib/pipeline/orchestrator";
import { db } from "@/lib/db/client";
import { creatives, pipelineRuns, triggers } from "@/lib/db/schema";
import { getActiveCampaigns, getLatestPerformance } from "@/lib/optimize/simulator";

export async function GET() {
  await ensureInitialized();

  const [campaignRows, creativeRows, runRows, triggerRows, perfRows] =
    await Promise.all([
      getActiveCampaigns(),
      db.select().from(creatives).orderBy(desc(creatives.createdAt)).limit(20),
      db.select().from(pipelineRuns).orderBy(desc(pipelineRuns.startedAt)).limit(10),
      db.select().from(triggers).orderBy(desc(triggers.firedAt)).limit(10),
      getLatestPerformance(20),
    ]);

  return NextResponse.json({
    campaigns: campaignRows,
    creatives: creativeRows,
    runs: runRows,
    triggers: triggerRows,
    performance: perfRows,
  });
}
