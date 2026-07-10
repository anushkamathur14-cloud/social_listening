import { NextResponse } from "next/server";
import { ensureInitialized, publishCreativeById } from "@/lib/pipeline/orchestrator";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  await ensureInitialized();
  const { id } = await params;
  const result = await publishCreativeById(id);

  if (!result) {
    return NextResponse.json({ error: "Creative not found" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    campaign: result,
    message: `Published via ${result.publishAdapter} (simulated)`,
  });
}
