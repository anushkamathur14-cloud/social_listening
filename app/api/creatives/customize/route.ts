import { NextRequest, NextResponse } from "next/server";
import { llmFromCredentials, hasLlmKey } from "@/lib/creative/llm-config";
import type { LlmCredentials } from "@/lib/integrations";
import {
  customizeCreatives,
  ensureInitialized,
  getSelectedChannels,
} from "@/lib/pipeline/orchestrator";
import type { Channel } from "@/lib/types";

export async function POST(req: NextRequest) {
  await ensureInitialized();

  const body = await req.json();
  const signalId = body.signalId as string | undefined;
  const customBrief = (body.customBrief as string | undefined)?.trim();
  const channels =
    (body.channels as Channel[] | undefined) ?? getSelectedChannels();
  const llmCreds = body.llm as LlmCredentials | undefined;
  const triggerId = body.triggerId as string | undefined;

  if (!signalId) {
    return NextResponse.json(
      { ok: false, error: "signalId is required" },
      { status: 400 }
    );
  }

  if (!customBrief) {
    return NextResponse.json(
      { ok: false, error: "Describe how you want the creatives customized" },
      { status: 400 }
    );
  }

  const llm = llmFromCredentials(llmCreds);
  if (!hasLlmKey(llm)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Add your OpenAI API key under Integrations → AI creative generation",
      },
      { status: 400 }
    );
  }

  const result = await customizeCreatives({
    signalId,
    channels,
    customBrief,
    llm: { ...llm, customBrief },
    triggerId,
  });

  if (!result) {
    return NextResponse.json(
      { ok: false, error: "Signal not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    triggerId: result.triggerId,
    count: result.creatives.length,
    creatives: result.creatives,
  });
}
