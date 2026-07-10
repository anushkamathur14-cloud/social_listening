import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { creatives } from "@/lib/db/schema";
import { buildPublishPayloadPreview } from "@/lib/payload-preview";
import { ensureInitialized } from "@/lib/pipeline/orchestrator";
import type { Channel, Market } from "@/lib/types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInitialized();
  const { id } = await params;

  const rows = await db
    .select()
    .from(creatives)
    .where(eq(creatives.id, id))
    .limit(1);
  const row = rows[0];
  if (!row) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  const creative = {
    id: row.id,
    triggerId: row.triggerId,
    channel: (row.channel ?? "meta") as Channel,
    persona: row.persona,
    market: row.market as Market,
    headline: row.headline,
    copy: row.copy,
    description: row.description ?? undefined,
    cta: row.cta,
    imagePrompt: row.imagePrompt,
    imageUrl: row.imageUrl ?? undefined,
    signalContext: row.signalContext,
    attribution: row.attribution,
    complianceStatus: row.complianceStatus as "pending_review",
    createdAt: row.createdAt,
  };

  return NextResponse.json({
    payload: buildPublishPayloadPreview(creative),
    adapter: CHANNEL_ADAPTER_LABEL(creative.channel),
  });
}

function CHANNEL_ADAPTER_LABEL(channel: Channel): string {
  const labels: Record<Channel, string> = {
    meta: "Meta Marketing API",
    smartly: "Smartly.io API",
    google_search: "Google Ads API",
    display: "DV360 / Smartly Display",
  };
  return labels[channel];
}
