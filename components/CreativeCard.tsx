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
  const creativeEvents = events
    .filter(
      (e) =>
        e.type === "creative_generated" ||
        e.type === "campaign_launched" ||
        e.type === "compliance_result"
    )
    .slice(-30);

  const creatives = creativeEvents
    .filter((e) => e.type === "creative_generated")
    .slice(-6)
    .reverse();

  const campaigns = events
    .filter((e) => e.type === "campaign_launched")
    .slice(-6)
    .reverse();

  const complianceMap = new Map<string, { status: string; violations: string[] }>();
  for (const e of events.filter((ev) => ev.type === "compliance_result")) {
    complianceMap.set(e.data.creativeId as string, {
      status: e.data.status as string,
      violations: (e.data.violations as string[]) ?? [],
    });
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 overflow-y-auto max-h-[420px] pr-1">
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
        };
        const compliance = complianceMap.get(creative.id);
        const status = compliance?.status ?? creative.complianceStatus ?? "pending";
        const campaign = campaigns.find(
          (c) => (c.data.creative as { id: string })?.id === creative.id
        );
        const campaignData = campaign?.data.campaign as {
          id: string;
          status: string;
          platform: string;
          platformId: string;
          budget: number;
        } | undefined;

        return (
          <div
            key={event.id}
            className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4 flex flex-col gap-2"
          >
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-2 py-0.5 text-xs font-medium">
                {creative.persona}
              </span>
              <span className="text-xs text-zinc-500">{creative.market}</span>
              <span
                className={`ml-auto rounded px-2 py-0.5 text-xs border ${STATUS_STYLES[status] ?? STATUS_STYLES.pending}`}
              >
                {status}
              </span>
            </div>

            <h3 className="font-semibold text-white text-sm leading-tight">
              {creative.headline}
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed line-clamp-4">
              {creative.copy}
            </p>

            <button className="self-start rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1 font-medium transition-colors">
              {creative.cta}
            </button>

            <a
              href={creative.attribution}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-zinc-600 hover:text-cyan-400 transition-colors truncate"
            >
              {creative.attribution}
            </a>

            {campaignData && (
              <div className="mt-1 pt-2 border-t border-zinc-800 text-xs text-zinc-500">
                <span className="text-zinc-400">
                  {campaignData.platform.toUpperCase()}
                </span>{" "}
                · ${campaignData.budget}/day ·{" "}
                <span
                  className={
                    campaignData.status === "pending_approval"
                      ? "text-yellow-400"
                      : "text-green-400"
                  }
                >
                  {campaignData.status}
                </span>
                {campaignData.status === "pending_approval" && onApprove && (
                  <button
                    onClick={() => onApprove(campaignData.id)}
                    className="ml-2 rounded bg-green-600 hover:bg-green-500 text-white px-2 py-0.5 text-xs"
                  >
                    Approve
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
