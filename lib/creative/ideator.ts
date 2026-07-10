import OpenAI from "openai";
import { BRAND_SYSTEM_PROMPT } from "../brand";
import { CHANNEL_MAP, type Channel } from "../channels";
import { getMarketLabel } from "../markets";
import type { Signal } from "../types";
import { resolveLlm, type LlmRunOptions } from "./llm-config";

export interface CreativeAngle {
  id: string;
  title: string;
  hook: string;
  vertical: "Rides" | "Eats" | "Travel";
  channels: Channel[];
  rationale: string;
}

function mockAngles(signal: Signal, channels: Channel[]): CreativeAngle[] {
  const summary = signal.payload.summary as string;
  const vertical =
    signal.type === "traffic"
      ? "Travel"
      : signal.type === "trends"
        ? "Eats"
        : signal.type === "weather"
          ? "Rides"
          : "Rides";

  const base: CreativeAngle[] = [
    {
      id: "a1",
      title: "Urgency + local relevance",
      hook: `When ${getMarketLabel(signal.market)} shifts, meet riders where they are.`,
      vertical,
      channels: channels.slice(0, 2),
      rationale: `Ground the ad in the live signal: ${summary.slice(0, 120)}…`,
    },
    {
      id: "a2",
      title: "New-user promo angle",
      hook: "First ride or delivery offer tied to the moment — not a generic discount.",
      vertical,
      channels: channels,
      rationale: "Signal-led UA works best when the CTA matches why demand spiked right now.",
    },
    {
      id: "a3",
      title: "Cross-vertical upsell",
      hook:
        vertical === "Eats"
          ? "Storm outside? Eats in. Pair delivery with a return-trip ride CTA."
          : "Ride there, eat there — bundle mobility + Eats in one campaign set.",
      vertical: vertical === "Eats" ? "Eats" : "Rides",
      channels: channels.filter((c) => c === "meta" || c === "smartly"),
      rationale: "Use the signal to pick the primary vertical, then test a secondary hook on social.",
    },
  ];

  return base;
}

export async function suggestCreativeAngles(
  signal: Signal,
  channels: Channel[],
  llmOptions?: LlmRunOptions
): Promise<{ angles: CreativeAngle[]; source: "openai" | "mock" | "user" }> {
  const llm = resolveLlm(llmOptions);
  if (!llm.apiKey) {
    return { angles: mockAngles(signal, channels), source: "mock" };
  }

  try {
    const openai = new OpenAI({ apiKey: llm.apiKey });
    const channelSpecs = channels
      .map((c) => `${c} (${CHANNEL_MAP[c].label})`)
      .join(", ");

    const response = await openai.chat.completions.create({
      model: llm.model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${BRAND_SYSTEM_PROMPT}
Return JSON: { "angles": [{ "id", "title", "hook", "vertical", "channels", "rationale" }] }
vertical must be Rides, Eats, or Travel. channels must be from the allowed list.`,
        },
        {
          role: "user",
          content: `Signal type: ${signal.type}
Market: ${getMarketLabel(signal.market)}
Summary: ${signal.payload.summary}
Allowed channels: ${channelSpecs}
${llm.brandVoice ? `Brand voice: ${llm.brandVoice}\n` : ""}${llm.customBrief ? `Focus: ${llm.customBrief}\n` : ""}Suggest 3 distinct UA creative angles before drafting copy.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return { angles: mockAngles(signal, channels), source: "mock" };
    }

    const parsed = JSON.parse(content) as { angles: CreativeAngle[] };
    const angles = (parsed.angles ?? []).map((a, i) => ({
      ...a,
      id: a.id ?? `llm-${i}`,
      channels: a.channels.filter((c) => channels.includes(c)),
    }));

    if (angles.length === 0) {
      return { angles: mockAngles(signal, channels), source: "mock" };
    }

    return { angles, source: llm.source === "user" ? "user" : "openai" };
  } catch {
    return { angles: mockAngles(signal, channels), source: "mock" };
  }
}
