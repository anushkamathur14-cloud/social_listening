import { parseChannelPayload } from "../creative/channel-payload";
import type { Channel } from "../channels";
import type { AppEvent, Market, SignalType } from "../types";

interface DbCreativeRow {
  id: string;
  triggerId: string;
  persona: string;
  market: string;
  headline: string;
  copy: string;
  cta: string;
  imagePrompt: string;
  signalContext: string;
  attribution: string;
  complianceStatus: string;
  createdAt: string;
  channel: string | null;
  imageUrl: string | null;
  description: string | null;
  channelPayload?: string | null;
}

export function creativesToEvents(rows: DbCreativeRow[]): AppEvent[] {
  return rows.map((row) => ({
    id: `hydrate-${row.id}`,
    type: "creative_generated" as const,
    timestamp: row.createdAt,
    data: {
      creative: {
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
        signalSummary: row.signalContext,
        attribution: row.attribution,
        complianceStatus: row.complianceStatus,
        createdAt: row.createdAt,
        channelPayload: parseChannelPayload(row.channelPayload),
      },
    },
  }));
}

export function mergeEventHistory(
  existing: AppEvent[],
  incoming: AppEvent[]
): AppEvent[] {
  const seen = new Set(existing.map((e) => eventKey(e)));
  const merged = [...existing];
  for (const event of incoming) {
    const key = eventKey(event);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(event);
    }
  }
  return merged.sort(
    (a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
}

function eventKey(event: AppEvent): string {
  if (event.type === "creative_generated") {
    const c = event.data.creative as { id: string };
    return `creative:${c.id}`;
  }
  return `${event.type}:${event.id}`;
}

export function signalsToEvents(
  rows: Array<{
    id: string;
    type: string;
    market: string;
    severity: string;
    payload: string;
    detectedAt: string;
  }>
): AppEvent[] {
  return rows.map((row) => ({
    id: `hydrate-signal-${row.id}`,
    type: "signal_detected" as const,
    timestamp: row.detectedAt,
    data: {
      signal: {
        id: row.id,
        type: row.type as SignalType,
        market: row.market as Market,
        severity: row.severity,
        payload: JSON.parse(row.payload),
        detectedAt: row.detectedAt,
      },
    },
  }));
}
