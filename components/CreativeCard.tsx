"use client";

import type { AppEvent } from "@/lib/types";

const STATUS_STYLES: Record<string, string> = {
  passed: "bg-green-500/20 text-green-400 border-green-500/30",
  fixed: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  blocked: "bg-red-500/20 text-red-400 border-red-500/30",
  pending: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

interface CreativeCardProps {
  events: AppEvent[];
  onApprove?: (campaignId: string) => void;
}

export function CreativeCard({ events, onApprove }: CreativeCardProps) {
  const creatives = events
    .filter((e) => e.type === "creative_generated")
    .slice(-8)
    .reverse();

  const campaignByCreativeId = new Map<
    string,
    {
      id: string;
      status: string;
      platform: string;
      platformId: string;
      budget: number;
    }
  >();

  for (const e of events.filter((ev) => ev.type === "campaign_launched")) {
    const campaign = e.data.campaign as {
      id: string;
      creativeId: string;
      status: string;
      platform: string;
      platformId: string;
      budget: number;
    };
    campaignByCreativeId.set(campaign.creativeId, campaign);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 overflow-y-auto max-h-[560px] pr-1">
      {creatives.length === 0 && (
        <p className="text-sm text-zinc-500 italic col-span-2">
          No creatives yet — inject a signal to start the pipeline.
        </p>
      )}
      {creatives.map((event) => {
        const creative = event.data.creative as {
          id: string;
          persona: string;
          market: string;
          headline: string;
          copy: string;
          cta: string;
          attribution: string;
          complianceStatus: string;
          signalContext?: string;
          signalSummary?: string;
          sourceUrl?: string;
          sourceLabel?: string;
          imagePrompt?: string;
          productOffer?: string;
          visualTreatment?: string;
        };

        const compliance = complianceMap.get(creative.id);
        const status =
          compliance?.status ?? creative.complianceStatus ?? "pending";
        const campaignData = campaignByCreativeId.get(creative.id);
        const platform = campaignData?.platform ?? "meta";

        return (
          <div key={`${event.id}-${creative.id}`} className="flex flex-col gap-2">
            {/* Ad unit mockup — what would ship to Meta/Smartly */}
            <div className="rounded-xl border border-zinc-700 bg-white text-zinc-900 overflow-hidden shadow-lg">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-200 bg-zinc-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
                  SA
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate">SignalAds</p>
                  <p className="text-[10px] text-zinc-500">Sponsored · {creative.market}</p>
                </div>
                <span className="text-[10px] text-zinc-400 uppercase">{platform}</span>
              </div>

              <div className="aspect-[1.91/1] bg-gradient-to-br from-slate-200 via-slate-100 to-indigo-100 flex items-center justify-center p-4">
                <p className="text-xs text-slate-600 text-center italic leading-snug max-w-[90%]">
                  {creative.visualTreatment ?? creative.imagePrompt ?? "Product hero image"}
                </p>
              </div>

              <div className="px-3 py-3 space-y-1.5">
                <h3 className="font-bold text-sm leading-tight text-zinc-900">
                  {creative.headline}
                </h3>
                <p className="text-xs text-zinc-700 leading-relaxed line-clamp-4">
                  {creative.copy}
                </p>
                {creative.productOffer && (
                  <p className="text-[11px] font-medium text-indigo-600">
                    {creative.productOffer}
                  </p>
                )}
                <button className="w-full mt-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 font-semibold transition-colors">
                  {creative.cta}
                </button>
              </div>
            </div>

            {/* Metadata panel — pipeline context, not part of the ad */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3 space-y-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-2 py-0.5 font-medium">
                  {creative.persona}
                </span>
                <span
                  className={`rounded px-2 py-0.5 border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
                >
                  compliance: {status}
                </span>
              </div>

              <details className="group">
                <summary className="cursor-pointer text-zinc-400 hover:text-zinc-300 list-none flex items-center gap-1">
                  <span className="group-open:rotate-90 transition-transform">▶</span>
                  Signal source & pipeline context
                </summary>
                <div className="mt-2 pl-3 border-l border-zinc-700 space-y-1.5 text-zinc-500">
                  <p>
                    <span className="text-zinc-400">Triggered by:</span>{" "}
                    {creative.signalSummary ?? creative.signalContext}
                  </p>
                  {creative.sourceUrl && (
                    <a
                      href={creative.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 block"
                    >
                      ↗ {creative.sourceLabel ?? "Verify source data"}
                    </a>
                  )}
                </div>
              </details>

              {campaignData && (
                <div className="pt-2 border-t border-zinc-800 flex flex-wrap items-center gap-2">
                  <span className="text-zinc-400">
                    Deploy →{" "}
                    <span className="text-amber-400/90">simulated</span>{" "}
                    {campaignData.platform.toUpperCase()}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500">${campaignData.budget}/day</span>
                  <span className="text-zinc-600">·</span>
                  <code className="text-[10px] text-zinc-600">{campaignData.platformId}</code>
                  {campaignData.status === "pending_approval" && onApprove && (
                    <button
                      onClick={() => onApprove(campaignData.id)}
                      className="ml-auto rounded bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 text-xs"
                    >
                      Approve launch
                    </button>
                  )}
                </div>
              )}

              {!campaignData && (
                <p className="text-zinc-600 text-[10px]">
                  Launch stage pending — ad will route to Smartly or Meta adapter (simulated in demo)
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
