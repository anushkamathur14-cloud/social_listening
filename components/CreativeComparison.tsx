"use client";

import { useEffect, useMemo, useRef } from "react";
import { AdPreview, type AdCreative } from "@/components/AdPreview";
import { routeStatusLabel } from "@/components/IntegrationsCallout";
import { SearchVariantsTable } from "@/components/SearchVariantsTable";
import { ChannelCreativeFields } from "@/components/ChannelCreativeFields";
import { PayloadPreview } from "@/components/PayloadPreview";
import { CHANNEL_MAP } from "@/lib/channels";
import { channelSet } from "@/lib/channel-filter";
import {
  hasLiveCredentials,
  type IntegrationConfig,
} from "@/lib/integrations";
import type { AppEvent, Channel, ChannelPayload } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-green-50 text-green-700 border-green-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
  passed: "bg-green-50 text-green-700 border-green-200",
};

const CHANNEL_ORDER: Channel[] = [
  "meta",
  "display",
  "google_search",
  "smartly",
];

interface CreativeGroup {
  triggerId: string;
  signalId?: string;
  market: string;
  signalSummary: string;
  sourceUrl?: string;
  sourceLabel?: string;
  creatives: (AdCreative & {
    status: string;
    specLabel?: string;
    channelPayload?: ChannelPayload;
    publishPayload?: unknown;
    publishAdapter?: string;
    platformId?: string;
    publishMessage?: string;
    simulated?: boolean;
  })[];
}

interface CreativeComparisonProps {
  events: AppEvent[];
  onPublish?: (creativeId: string) => void;
  integrations: IntegrationConfig;
  mobilePreview?: boolean;
  selectedChannels: Channel[];
  highlightSignalId?: string | null;
  publishingCreativeId?: string | null;
}

export function CreativeComparison({
  events,
  onPublish,
  integrations,
  mobilePreview = true,
  selectedChannels,
  highlightSignalId,
  publishingCreativeId,
}: CreativeComparisonProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const channelOrder = CHANNEL_ORDER.filter((ch) => selectedChannels.includes(ch));
  const groups = useMemo(
    () => buildGroups(events, selectedChannels, highlightSignalId),
    [events, selectedChannels, highlightSignalId]
  );

  useEffect(() => {
    if (highlightSignalId && highlightRef.current) {
      highlightRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [highlightSignalId, groups.length]);

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <p className="text-sm text-gray-600 mb-1">No creatives yet</p>
        <p className="text-xs text-gray-500">
          Run a demo scenario with your selected channels — only those variants appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 overflow-y-auto max-h-[780px] pr-1">
      {groups.map((group) => {
        const isHighlighted = highlightSignalId === group.signalId;
        return (
        <div
          key={group.triggerId}
          ref={isHighlighted ? highlightRef : undefined}
          className={`rounded-xl border overflow-hidden transition-shadow ${
            isHighlighted
              ? "border-black ring-2 ring-black/10 bg-white shadow-md"
              : "border-gray-200 bg-white"
          }`}
        >
          <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">
                Signal → {group.market} · cross-channel comparison
              </p>
              <p className="text-sm text-gray-900 mt-0.5 leading-snug">
                {group.signalSummary}
              </p>
              {group.sourceUrl && (
                <a
                  href={group.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-700 hover:underline mt-1 inline-block"
                >
                  ↗ {group.sourceLabel ?? "Verify source"}
                </a>
              )}
            </div>
            <span className="text-[10px] text-gray-500 bg-white border border-gray-200 rounded-full px-2 py-0.5">
              {group.creatives.length} channel
              {group.creatives.length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4 min-w-min items-start">
              {channelOrder
                .filter((ch) => group.creatives.some((c) => c.channel === ch))
                .map((channel) => {
                const creative = group.creatives.find((c) => c.channel === channel)!;
                const spec = CHANNEL_MAP[channel];
                const liveReady = hasLiveCredentials(integrations, channel);

                return (
                  <div
                    key={creative.id}
                    className="flex flex-col gap-2 w-[240px] shrink-0"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                        {spec.label.split("(")[0].trim()}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded border capitalize ${STATUS_STYLES[creative.status] ?? STATUS_STYLES.pending_review}`}
                      >
                        {routeStatusLabel(creative.status, creative.simulated)}
                      </span>
                    </div>

                    <AdPreview
                      creative={creative}
                      compact
                      mobileFrame={
                        mobilePreview &&
                        (channel === "meta" || channel === "smartly")
                      }
                    />

                    <div className="space-y-2 text-xs">
                      {creative.specLabel && (
                        <p className="text-[10px] text-gray-500">
                          {creative.specLabel}
                        </p>
                      )}

                      <ChannelCreativeFields
                        channel={channel}
                        headline={creative.headline}
                        copy={creative.copy}
                        description={creative.description}
                        cta={creative.cta}
                        channelPayload={
                          channel === "google_search"
                            ? undefined
                            : creative.channelPayload
                        }
                        compact
                      />

                      <PayloadPreview
                        creativeId={creative.id}
                        cached={creative.publishPayload}
                        liveReady={liveReady}
                      />

                      {creative.status === "pending_review" && onPublish && (
                        <button
                          type="button"
                          onClick={() => onPublish(creative.id)}
                          disabled={publishingCreativeId === creative.id}
                          className="w-full rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 disabled:cursor-wait text-white py-2 font-semibold text-[11px] transition-colors"
                        >
                          {publishingCreativeId === creative.id
                            ? "Routing…"
                            : `Approve & Route → ${spec.publishLabel}${liveReady ? " · live-ready" : " · simulated"}`}
                        </button>
                      )}

                      {creative.status === "published" && (
                        <div className="text-[10px] text-gray-600 pt-1 border-t border-gray-200">
                          <p>
                            <span className="text-green-700 font-medium">
                              {creative.simulated === false
                                ? "Approved & live now"
                                : "Approved & live (simulated)"}
                            </span>{" "}
                            via {creative.publishAdapter}
                          </p>
                          {creative.platformId && (
                            <code className="text-zinc-400 block mt-0.5">
                              {creative.platformId}
                            </code>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {group.creatives
            .filter((c) => c.channel === "google_search" && c.channelPayload?.kind === "search")
            .map((creative) => (
              <div
                key={`rsa-${creative.id}`}
                className="px-5 py-6 border-t-2 border-gray-200 bg-gradient-to-b from-blue-50/40 to-white"
              >
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-gray-900">
                    Google Search · Responsive Search Ad
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {group.market} — every headline and description variant generated for this signal
                  </p>
                </div>
                <SearchVariantsTable
                  payload={creative.channelPayload as import("@/lib/creative/channel-payload").SearchExtras}
                  cta={creative.cta}
                />
              </div>
            ))}
        </div>
        );
      })}
    </div>
  );
}

function buildGroups(
  events: AppEvent[],
  selectedChannels: Channel[],
  highlightSignalId?: string | null
): CreativeGroup[] {
  const allowed = channelSet(selectedChannels);
  const creativeEvents = events
    .filter((e) => e.type === "creative_generated")
    .filter((e) =>
      allowed.has((e.data.creative as { channel: Channel }).channel)
    );

  const publishedIds = new Set<string>();
  const publishMeta = new Map<
    string,
    {
      adapter: string;
      platformId: string;
      message: string;
      payload?: unknown;
      simulated?: boolean;
    }
  >();
  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const c = e.data.creative as { id: string };
    const campaign = e.data.campaign as { platformId: string };
    if (c?.id) {
      publishedIds.add(c.id);
      publishMeta.set(c.id, {
        adapter: e.data.publishAdapter as string,
        platformId: campaign.platformId,
        message: e.data.message as string,
        payload: e.data.publishPayload,
        simulated: e.data.simulated as boolean | undefined,
      });
    }
  }

  const complianceMap = new Map<string, string>();
  for (const e of events.filter((ev) => ev.type === "compliance_result")) {
    complianceMap.set(e.data.creativeId as string, e.data.status as string);
  }

  const byTrigger = new Map<string, CreativeGroup>();

  for (const event of creativeEvents) {
    const c = event.data.creative as AdCreative & {
      triggerId: string;
      signalId?: string;
      complianceStatus: string;
      specLabel?: string;
      channelPayload?: ChannelPayload;
      signalContext?: string;
      signalSummary?: string;
      sourceUrl?: string;
      sourceLabel?: string;
    };

    const triggerId = c.triggerId ?? event.id;
    if (!byTrigger.has(triggerId)) {
      byTrigger.set(triggerId, {
        triggerId,
        signalId: c.signalId,
        market: c.market,
        signalSummary: c.signalSummary ?? c.signalContext ?? "Signal detected",
        sourceUrl: c.sourceUrl,
        sourceLabel: c.sourceLabel,
        creatives: [],
      });
    }

    const pub = publishMeta.get(c.id);
    const isPublished =
      publishedIds.has(c.id) || c.complianceStatus === "published";

    byTrigger.get(triggerId)!.creatives.push({
      ...c,
      status: isPublished
        ? "published"
        : (complianceMap.get(c.id) ?? c.complianceStatus ?? "pending_review"),
      publishPayload: pub?.payload,
      publishAdapter: pub?.adapter,
      platformId: pub?.platformId,
      publishMessage: pub?.message,
      simulated: pub?.simulated,
    });
  }

  const groups = Array.from(byTrigger.values())
    .filter((g) => g.creatives.length > 0)
    .sort((a, b) => b.creatives.length - a.creatives.length)
    .slice(-6)
    .reverse();

  if (highlightSignalId) {
    const idx = groups.findIndex((g) => g.signalId === highlightSignalId);
    if (idx > 0) {
      const [match] = groups.splice(idx, 1);
      groups.unshift(match);
    }
  }

  return groups;
}
