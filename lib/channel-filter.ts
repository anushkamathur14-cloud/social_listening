import { CHANNELS, type Channel } from "./channels";
import type { AppEvent } from "./types";

export function channelSet(selected: Channel[]): Set<Channel> {
  return new Set(selected);
}

export function isSelectedChannel(
  channel: Channel | undefined,
  selected: Channel[]
): boolean {
  if (!channel || selected.length === 0) return false;
  return selected.includes(channel);
}

/** creativeId → channel from generated events */
export function buildCreativeChannelMap(
  events: AppEvent[]
): Map<string, Channel> {
  const map = new Map<string, Channel>();
  for (const e of events.filter((ev) => ev.type === "creative_generated")) {
    const c = e.data.creative as { id: string; channel: Channel };
    if (c?.id && c.channel) map.set(c.id, c.channel);
  }
  return map;
}

export function channelLabel(channel: Channel): string {
  return (
    CHANNELS.find((c) => c.id === channel)?.label.split("(")[0].trim() ?? channel
  );
}

export function selectedChannelsLabel(selected: Channel[]): string {
  return selected.map(channelLabel).join(" · ");
}

export function countCreativesForChannels(
  events: AppEvent[],
  selected: Channel[]
): number {
  const set = channelSet(selected);
  return events.filter((e) => {
    if (e.type !== "creative_generated") return false;
    return set.has((e.data.creative as { channel: Channel }).channel);
  }).length;
}

export function countPendingForChannels(
  events: AppEvent[],
  selected: Channel[]
): number {
  const set = channelSet(selected);
  const chMap = buildCreativeChannelMap(events);

  const publishedIds = new Set<string>();
  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const c = e.data.creative as { id: string };
    if (c?.id) publishedIds.add(c.id);
  }
  for (const e of events.filter((ev) => ev.type === "creative_generated")) {
    const c = e.data.creative as { id: string; complianceStatus?: string };
    if (c?.id && c.complianceStatus === "published") {
      publishedIds.add(c.id);
    }
  }

  return events.filter((e) => {
    if (e.type !== "compliance_result") return false;
    if (e.data.status !== "pending_review") return false;
    const creativeId = e.data.creativeId as string;
    if (publishedIds.has(creativeId)) return false;
    const ch = chMap.get(creativeId);
    return ch ? set.has(ch) : false;
  }).length;
}

export function countRoutedForChannels(
  events: AppEvent[],
  selected: Channel[]
): number {
  const set = channelSet(selected);
  return events.filter((e) => {
    if (e.type !== "campaign_published") return false;
    const c = e.data.creative as { channel: Channel };
    return set.has(c.channel);
  }).length;
}
