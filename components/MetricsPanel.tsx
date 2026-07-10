"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CHANNEL_MAP } from "@/lib/channels";
import { channelSet } from "@/lib/channel-filter";
import type { AppEvent, CampaignStatus, Channel, PerformanceSnapshot } from "@/lib/types";

interface CampaignRow {
  campaignId: string;
  creativeId: string;
  headline: string;
  copy: string;
  market: string;
  persona: string;
  channel: Channel;
  channelLabel: string;
  publishAdapter: string;
  platformId: string;
  status: CampaignStatus;
  budget: number;
  routedAt: string;
  simulated: boolean;
  performance: PerformanceSnapshot | null;
  optimizerNote?: string;
}

interface MetricsPanelProps {
  events: AppEvent[];
  selectedChannels: Channel[];
}

const CHANNEL_COLORS: Record<Channel, string> = {
  meta: "bg-blue-100 text-blue-800 border-blue-200",
  display: "bg-purple-100 text-purple-800 border-purple-200",
  google_search: "bg-amber-100 text-amber-900 border-amber-200",
  smartly: "bg-indigo-100 text-indigo-800 border-indigo-200",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  scaled: "bg-emerald-100 text-emerald-800",
  paused: "bg-gray-100 text-gray-600",
};

function formatWhen(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
  };
}

function buildFromEvents(events: AppEvent[]): Map<string, CampaignRow> {
  const rows = new Map<string, CampaignRow>();

  for (const e of events.filter((ev) => ev.type === "campaign_published")) {
    const campaign = e.data.campaign as {
      id: string;
      creativeId: string;
      channel: Channel;
      platformId: string;
      status: CampaignStatus;
      budget: number;
      market: string;
      launchedAt?: string;
      publishAdapter?: string;
    };
    const creative = e.data.creative as {
      id: string;
      headline: string;
      copy: string;
      persona: string;
      market: string;
    };
    const channel = campaign.channel ?? "meta";
    const spec = CHANNEL_MAP[channel];

    rows.set(campaign.id, {
      campaignId: campaign.id,
      creativeId: creative.id,
      headline: creative.headline,
      copy: creative.copy,
      market: campaign.market ?? creative.market,
      persona: creative.persona,
      channel,
      channelLabel: spec?.label.split("(")[0].trim() ?? channel,
      publishAdapter:
        (e.data.publishAdapter as string) ?? spec?.publishLabel ?? channel,
      platformId: campaign.platformId,
      status: campaign.status ?? "active",
      budget: campaign.budget ?? 75,
      routedAt: campaign.launchedAt ?? e.timestamp,
      simulated: e.data.simulated !== false,
      performance: null,
    });
  }

  for (const e of events.filter((ev) => ev.type === "performance_update")) {
    const campaignId = e.data.campaignId as string;
    const snap = e.data.snapshot as PerformanceSnapshot;
    const row = rows.get(campaignId);
    if (row) {
      row.performance = snap;
    }
  }

  for (const e of events.filter((ev) => ev.type === "optimizer_action")) {
    const campaignId = e.data.campaignId as string;
    const row = rows.get(campaignId);
    if (row) {
      const action = e.data.action as string;
      row.status = action === "scaled" ? "scaled" : "paused";
      row.optimizerNote = `${action === "scaled" ? "Scaled" : "Paused"} — ${e.data.reason as string} (CTR ${e.data.ctr as number}%)`;
    }
  }

  return rows;
}

export function MetricsPanel({ events, selectedChannels }: MetricsPanelProps) {
  const allowed = useMemo(() => channelSet(selectedChannels), [selectedChannels]);
  const [apiRows, setApiRows] = useState<CampaignRow[]>([]);
  const [loading, setLoading] = useState(true);

  const routedCount = events.filter((e) => e.type === "campaign_published").length;
  const perfEventCount = events.filter((e) => e.type === "performance_update").length;

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/campaigns");
      const data = await res.json();
      if (Array.isArray(data.campaigns)) {
        setApiRows(
          data.campaigns.map(
            (c: {
              campaignId: string;
              creativeId: string;
              headline: string;
              copy: string;
              market: string;
              persona: string;
              channel: Channel;
              channelLabel: string;
              publishAdapter: string;
              platformId: string;
              status: CampaignStatus;
              budget: number;
              routedAt: string;
              simulated: boolean;
              performance: PerformanceSnapshot | null;
            }) => ({
              ...c,
              optimizerNote: undefined,
            })
          )
        );
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard, routedCount, perfEventCount]);

  const rows = useMemo(() => {
    const fromEvents = buildFromEvents(events);
    const merged = new Map<string, CampaignRow>();

    for (const row of apiRows) {
      merged.set(row.campaignId, { ...row });
    }
    for (const [id, row] of fromEvents) {
      const existing = merged.get(id);
      merged.set(id, {
        ...(existing ?? row),
        ...row,
        performance: row.performance ?? existing?.performance ?? null,
        optimizerNote: row.optimizerNote ?? existing?.optimizerNote,
        simulated: row.simulated,
      });
    }

    return Array.from(merged.values())
      .filter((row) => allowed.has(row.channel))
      .sort(
        (a, b) => new Date(b.routedAt).getTime() - new Date(a.routedAt).getTime()
      );
  }, [apiRows, events, allowed]);

  const totals = useMemo(() => {
    const withPerf = rows.filter((r) => r.performance);
    if (withPerf.length === 0) {
      return { spend: 0, impressions: 0, avgCtr: 0, clicks: 0 };
    }
    const spend = withPerf.reduce((s, r) => s + (r.performance?.spend ?? 0), 0);
    const impressions = withPerf.reduce(
      (s, r) => s + (r.performance?.impressions ?? 0),
      0
    );
    const clicks = withPerf.reduce((s, r) => s + (r.performance?.clicks ?? 0), 0);
    const avgCtr =
      withPerf.reduce((s, r) => s + (r.performance?.ctr ?? 0), 0) / withPerf.length;
    return { spend, impressions, avgCtr, clicks };
  }, [rows]);

  if (loading && rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-8 text-center">Loading routed campaigns…</p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
        <p className="text-sm font-medium text-gray-900 mb-1">No routed campaigns yet</p>
        <p className="text-xs text-gray-600 max-w-md mx-auto">
          Approve a creative on the <strong>Creatives</strong> tab for your selected
          channels — only those routes appear here with simulated performance.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Routed ads" value={String(rows.length)} />
        <SummaryCard
          label="Total impressions"
          value={totals.impressions.toLocaleString()}
          sub={totals.impressions ? undefined : "Awaiting optimizer"}
        />
        <SummaryCard
          label="Avg CTR"
          value={totals.impressions ? `${totals.avgCtr.toFixed(2)}%` : "—"}
        />
        <SummaryCard
          label="Total spend (sim)"
          value={totals.spend ? `$${totals.spend.toFixed(0)}` : "—"}
        />
      </div>

      <p className="text-[10px] text-gray-500">
        Simulated metrics — optimizer runs every 30s on active campaigns, or ~2s after you
        approve a creative.
      </p>

      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[720px]">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-[10px] uppercase tracking-wide text-gray-500">
                <th className="px-4 py-3 font-semibold">Routed</th>
                <th className="px-4 py-3 font-semibold">Creative</th>
                <th className="px-4 py-3 font-semibold">Channel</th>
                <th className="px-4 py-3 font-semibold">Market</th>
                <th className="px-4 py-3 font-semibold text-right">CTR</th>
                <th className="px-4 py-3 font-semibold text-right">Impressions</th>
                <th className="px-4 py-3 font-semibold text-right">Clicks</th>
                <th className="px-4 py-3 font-semibold text-right">CPA</th>
                <th className="px-4 py-3 font-semibold text-right">Spend</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => {
                const when = formatWhen(row.routedAt);
                const perf = row.performance;
                return (
                  <tr key={row.campaignId} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-medium text-gray-900">{when.date}</p>
                      <p className="text-gray-500">{when.time}</p>
                      {row.simulated && (
                        <span className="text-[9px] text-amber-700">simulated route</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="font-semibold text-gray-900 line-clamp-2">
                        {row.headline}
                      </p>
                      <p className="text-gray-500 capitalize mt-0.5">
                        {row.persona.replace("_", " ")}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-semibold ${CHANNEL_COLORS[row.channel]}`}
                      >
                        {row.channelLabel}
                      </span>
                      <p className="text-[9px] text-gray-400 mt-1 truncate max-w-[120px]">
                        {row.platformId}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.market}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                      {perf ? `${perf.ctr}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {perf ? perf.impressions.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {perf ? perf.clicks.toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {perf ? `$${perf.cpa}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-700">
                      {perf ? `$${perf.spend}` : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_COLORS[row.status] ?? STATUS_COLORS.active}`}
                      >
                        {row.status}
                      </span>
                      {row.optimizerNote && (
                        <p className="text-[9px] text-gray-500 mt-1 max-w-[140px] leading-snug">
                          {row.optimizerNote}
                        </p>
                      )}
                      {!perf && row.status === "active" && (
                        <p className="text-[9px] text-gray-400 mt-1">Metrics pending…</p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-500 font-medium">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 mt-0.5 tabular-nums">{value}</p>
      {sub && <p className="text-[9px] text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}
