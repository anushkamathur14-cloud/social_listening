import { NextRequest, NextResponse } from "next/server";
import { approveCampaignById, ensureInitialized } from "@/lib/pipeline/orchestrator";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInitialized();
  const { id } = await params;
  const campaign = await approveCampaignById(id);

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, campaign });
}
