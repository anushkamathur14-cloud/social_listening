"use client";

import Image from "next/image";
import { CHANNEL_MAP } from "@/lib/channels";
import type { AppEvent, Channel } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  passed: "bg-green-500/20 text-green-400 border-green-500/30",
  fixed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  blocked: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
  pending_review: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  approved: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  published: "bg-green-500/20 text-green-400 border-green-500/30",
};

interface CreativeCardProps {
  events: AppEvent[];
  onPublish?: (creativeId: string) => void;
}

export function CreativeCard({ events, onPublish }: CreativeCardProps) {
  const creatives = events
    .filter((e) => e.type === "creative_generated")
    .slice(-12)
    .reverse();

  const publishedIds = new Set<string>();
  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const c = e.data.creative as { id: string };
    if (c?.id) publishedIds.add(c.id);
  }

  const publishInfo = new Map<
    string,
    { adapter: string; platformId: string; message: string }
  >();
  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const creative = e.data.creative as { id: string };
    const campaign = e.data.campaign as { platformId: string };
    publishInfo.set(creative.id, {
      adapter: e.data.publishAdapter as string,
      platformId: campaign.platformId,
      message: e.data.message as string,
    });
  }

  const complianceMap = new Map<
    string,
    { status: string; violations: string[]; autoFixes?: string[] }
  >();
  for (const e of events.filter((ev) => ev.type === "compliance_result")) {
    complianceMap.set(e.data.creativeId as string, {
      status: e.data.status as string,
      violations: (e.data.violations as string[]) ?? [],
      autoFixes: (e.data.autoFixes as string[]) ?? [],
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[620px] pr-1">
      {creatives.length === 0 && (
        <p className="text-sm text-zinc-500 italic col-span-full">
          Select channels, inject a signal — creatives will appear here for your review before publishing.
        </p>
      )}
      {creatives.map((event) => {
        const creative = event.data.creative as {
          id: string;
          channel: Channel;
          persona: string;
          market: string;
          headline: string;
          copy: string;
          description?: string;
          cta: string;
          attribution: string;
          complianceStatus: string;
          signalContext?: string;
          signalSummary?: string;
          sourceUrl?: string;
          sourceLabel?: string;
          imageUrl?: string;
          productOffer?: string;
          specLabel?: string;
        };

        const compliance = complianceMap.get(creative.id);
        const isPublished = publishedIds.has(creative.id);
        const status = isPublished
          ? "published"
          : (compliance?.status ?? creative.complianceStatus ?? "pending_review");
        const channelSpec = CHANNEL_MAP[creative.channel];
        const pub = publishInfo.get(creative.id);
        const isTextAd = channelSpec?.format === "text";

        return (
          <div key={`${event.id}-${creative.id}`} className="flex flex-col gap-2">
            <div className="rounded-xl border border-zinc-700 bg-white text-zinc-900 overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 bg-zinc-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">SignalAds</p>
                  <p className="text-[10px] text-zinc-500">
                    {channelSpec?.label} · {creative.market}
                  </p>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase">
                  {creative.channel}
                </span>
              </div>

              {!isTextAd && creative.imageUrl && (
                <div className="relative aspect-[1.91/1] bg-zinc-100">
                  <Image
                    src={creative.imageUrl}
                    alt={creative.headline}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}

              {isTextAd && (
                <div className="px-3 py-2 bg-blue-50 border-b border-blue-100 text-[10px] text-blue-700">
                  Google Search text ad · no image
                </div>
              )}

              <div className="px-3 py-3 space-y-1">
                <p className="text-[10px] text-green-700 font-medium">
                  Ad · {creative.attribution.replace(/^https?:\/\//, "")}
                </p>
                <h3 className="font-bold text-sm text-blue-800 leading-tight">
                  {creative.headline}
                </h3>
                <p className="text-xs text-zinc-700 leading-relaxed">
                  {creative.copy}
                </p>
                {creative.description && isTextAd && (
                  <p className="text-xs text-zinc-500">{creative.description}</p>
                )}
                {creative.productOffer && (
                  <p className="text-[11px] font-medium text-indigo-600">
                    {creative.productOffer}
                  </p>
                )}
                <button className="w-full mt-1 rounded-md bg-indigo-600 text-white text-xs py-2 font-semibold">
                  {creative.cta}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 space-y-2 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-2 py-0.5">
                  {creative.persona}
                </span>
                <span
                  className={`rounded px-2 py-0.5 border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending_review}`}
                >
                  {status.replace("_", " ")}
                </span>
                {creative.specLabel && (
                  <span className="text-zinc-600 text-[10px]">{creative.specLabel}</span>
                )}
              </div>

              <details className="group">
                <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Signal source
                </summary>
                <div className="mt-2 pl-3 border-l border-zinc-700 space-y-1 text-zinc-500">
                  <p>{creative.signalSummary ?? creative.signalContext}</p>
                  {creative.sourceUrl && (
                    <a
                      href={creative.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 block"
                    >
                      ↗ {creative.sourceLabel ?? "Verify source"}
                    </a>
                  )}
                </div>
              </details>

              {status === "pending_review" && onPublish && (
                <button
                  onClick={() => onPublish(creative.id)}
                  className="w-full rounded-md bg-green-600 hover:bg-green-500 text-white py-2 font-medium"
                >
                  Approve & Publish → {channelSpec?.publishLabel}
                </button>
              )}

              {pub && (
                <div className="pt-2 border-t border-zinc-800 text-zinc-400 space-y-1">
                  <p>
                    <span className="text-amber-400/90">Simulated publish</span> via{" "}
                    {pub.adapter}
                  </p>
                  <code className="text-[10px] text-zinc-600 block">{pub.platformId}</code>
                  <p className="text-[10px] text-zinc-600">{pub.message}</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
