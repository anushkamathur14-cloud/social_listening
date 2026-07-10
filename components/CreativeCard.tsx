"use client";

import { useMemo, useState } from "react";
import { AdPreview, type AdCreative } from "@/components/AdPreview";
import { CreativeComparison } from "@/components/CreativeComparison";
import { routeStatusLabel } from "@/components/IntegrationsCallout";
import { ChannelCreativeFields } from "@/components/ChannelCreativeFields";
import { PayloadPreview } from "@/components/PayloadPreview";
import { CHANNEL_MAP } from "@/lib/channels";
import {
  hasLiveCredentials,
  type IntegrationConfig,
} from "@/lib/integrations";
import { VERTICAL_META, verticalFromPersona } from "@/lib/verticals";
import type { AppEvent, Channel, ChannelPayload } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  pending_review: "bg-amber-50 text-amber-700 border-amber-200",
  published: "bg-green-50 text-green-700 border-green-200",
  blocked: "bg-red-50 text-red-700 border-red-200",
};

interface CreativeCardProps {
  events: AppEvent[];
  onPublish?: (creativeId: string) => void;
  integrations: IntegrationConfig;
  selectedChannels: Channel[];
  highlightSignalId?: string | null;
  publishingCreativeId?: string | null;
}

type ViewMode = "compare" | "grid";

export function CreativeCard({
  events,
  onPublish,
  integrations,
  selectedChannels,
  highlightSignalId,
  publishingCreativeId,
}: CreativeCardProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("compare");
  const [mobilePreview, setMobilePreview] = useState(true);

  const gridItems = useMemo(
    () => buildGridItems(events, selectedChannels),
    [events, selectedChannels]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-[var(--border)] overflow-hidden text-xs">
          <button
            type="button"
            onClick={() => setViewMode("compare")}
            className={`px-3 py-1.5 font-medium transition-colors ${
              viewMode === "compare"
                ? "bg-black text-white"
                : "bg-white text-[var(--muted)] hover:bg-zinc-50"
            }`}
          >
            Compare channels
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`px-3 py-1.5 font-medium transition-colors border-l border-[var(--border)] ${
              viewMode === "grid"
                ? "bg-black text-white"
                : "bg-white text-[var(--muted)] hover:bg-zinc-50"
            }`}
          >
            Grid view
          </button>
        </div>

        <label className="flex items-center gap-2 text-xs text-[var(--muted)] cursor-pointer ml-auto">
          <input
            type="checkbox"
            checked={mobilePreview}
            onChange={(e) => setMobilePreview(e.target.checked)}
            className="rounded accent-black"
          />
          Mobile preview (Meta / Smartly)
        </label>
      </div>

      {viewMode === "compare" ? (
        <CreativeComparison
          events={events}
          onPublish={onPublish}
          integrations={integrations}
          mobilePreview={mobilePreview}
          selectedChannels={selectedChannels}
          highlightSignalId={highlightSignalId}
          publishingCreativeId={publishingCreativeId}
        />
      ) : (
        <CreativeGrid
          items={gridItems}
          onPublish={onPublish}
          integrations={integrations}
          mobilePreview={mobilePreview}
          publishingCreativeId={publishingCreativeId}
        />
      )}
    </div>
  );
}

interface GridItem extends AdCreative {
  status: string;
  specLabel?: string;
  channelPayload?: ChannelPayload;
  signalSummary?: string;
  signalContext?: string;
  sourceUrl?: string;
  sourceLabel?: string;
  visualTreatment?: string;
  publishPayload?: unknown;
  publishAdapter?: string;
  platformId?: string;
  simulated?: boolean;
}

function CreativeGrid({
  items,
  onPublish,
  integrations,
  mobilePreview,
  publishingCreativeId,
}: {
  items: GridItem[];
  onPublish?: (id: string) => void;
  integrations: IntegrationConfig;
  mobilePreview: boolean;
  publishingCreativeId?: string | null;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--border)] p-10 text-center">
        <p className="text-sm text-[var(--muted)]">No creatives yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 overflow-y-auto max-h-[720px] pr-1">
      {items.map((creative) => {
        const spec = CHANNEL_MAP[creative.channel];
        const vertical = verticalFromPersona(
          creative.persona,
          creative.productOffer
        );
        const vMeta = VERTICAL_META[vertical];
        const liveReady = hasLiveCredentials(integrations, creative.channel);

        const isSearch = creative.channel === "google_search";

        return (
          <div
            key={creative.id}
            className={`flex flex-col gap-2 ${isSearch ? "md:col-span-2 xl:col-span-3" : ""}`}
          >
            <AdPreview
              creative={creative}
              mobileFrame={
                mobilePreview &&
                (creative.channel === "meta" || creative.channel === "smartly")
              }
            />

            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full ${vMeta.bg} ${vMeta.color}`}
                >
                  {vMeta.label}
                </span>
                <span className="rounded-full bg-zinc-100 text-zinc-600 px-2 py-0.5 capitalize">
                  {creative.persona.replace("_", " ")}
                </span>
                <span
                  className={`rounded px-2 py-0.5 border capitalize ${STATUS_STYLES[creative.status] ?? STATUS_STYLES.pending_review}`}
                >
                  {routeStatusLabel(creative.status, creative.simulated)}
                </span>
              </div>

              {creative.specLabel && (
                <p className="text-[10px] text-[var(--muted)]">{creative.specLabel}</p>
              )}

              <ChannelCreativeFields
                channel={creative.channel}
                headline={creative.headline}
                copy={creative.copy}
                description={creative.description}
                cta={creative.cta}
                channelPayload={creative.channelPayload}
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
                  className="w-full rounded-lg bg-[var(--uber-green)] hover:bg-[var(--uber-green-dark)] disabled:opacity-60 disabled:cursor-wait text-white py-2 font-semibold"
                >
                  {publishingCreativeId === creative.id
                    ? "Routing…"
                    : `Approve & Route → ${spec.publishLabel}`}
                </button>
              )}

              {creative.status === "published" && (
                <p className="text-[10px] text-green-700 font-medium">
                  {creative.simulated === false
                    ? "Approved & live now"
                    : "Approved & live (simulated)"}{" "}
                  via {creative.publishAdapter}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function buildGridItems(events: AppEvent[], selectedChannels: Channel[]): GridItem[] {
  const allowed = new Set(selectedChannels);
  const creativeEvents = events
    .filter((e) => e.type === "creative_generated")
    .filter((e) =>
      allowed.has((e.data.creative as { channel: Channel }).channel)
    )
    .slice(-12)
    .reverse();

  const publishedIds = new Set<string>();
  const publishMeta = new Map<
    string,
    { adapter: string; platformId: string; payload?: unknown; simulated?: boolean }
  >();
  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const c = e.data.creative as { id: string };
    const campaign = e.data.campaign as { platformId: string };
    if (c?.id) {
      publishedIds.add(c.id);
      publishMeta.set(c.id, {
        adapter: e.data.publishAdapter as string,
        platformId: campaign.platformId,
        payload: e.data.publishPayload,
        simulated: e.data.simulated as boolean | undefined,
      });
    }
  }

  const complianceMap = new Map<string, string>();
  for (const e of events.filter((ev) => ev.type === "compliance_result")) {
    complianceMap.set(e.data.creativeId as string, e.data.status as string);
  }

  return creativeEvents.map((event) => {
    const c = event.data.creative as GridItem & { complianceStatus: string };
    const pub = publishMeta.get(c.id);
    const isPublished =
      publishedIds.has(c.id) || c.complianceStatus === "published";
    return {
      ...c,
      status: isPublished
        ? "published"
        : (complianceMap.get(c.id) ?? c.complianceStatus ?? "pending_review"),
      publishPayload: pub?.payload,
      publishAdapter: pub?.adapter,
      platformId: pub?.platformId,
      simulated: pub?.simulated,
    };
  });
}
