import { NextResponse } from "next/server";
import { ensureInitialized, publishCreativeById } from "@/lib/pipeline/orchestrator";
import type { IntegrationConfig } from "@/lib/integrations";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInitialized();
  const { id } = await params;

  let integrations: IntegrationConfig | undefined;
  try {
    const body = await req.json();
    integrations = body.integrations as IntegrationConfig | undefined;
  } catch {
    /* no body */
  }

  const result = await publishCreativeById(id, { integrations });

  if (!result) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    campaign: result,
    publishPayload: result.publishPayload,
    simulated: result.simulated,
    message: result.simulated
      ? `Published via ${result.publishAdapter} (simulated)`
      : `Published live via ${result.publishAdapter}`,
  });
}
