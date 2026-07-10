"use client";

import { SearchVariantsTable } from "@/components/SearchVariantsTable";
import { CHANNEL_MAP } from "@/lib/channels";
import type { ChannelPayload } from "@/lib/creative/channel-payload";
import { platformSpecRows, PRODUCTION_CHECKLIST } from "@/lib/creative/spec-reference";
import type { Channel } from "@/lib/types";

interface ChannelCreativeFieldsProps {
  channel: Channel;
  headline: string;
  copy: string;
  description?: string;
  cta: string;
  channelPayload?: ChannelPayload;
  compact?: boolean;
}

export function ChannelCreativeFields({
  channel,
  headline,
  copy,
  description,
  cta,
  channelPayload,
  compact,
}: ChannelCreativeFieldsProps) {
  const spec = CHANNEL_MAP[channel];

  return (
    <div className={`space-y-2 ${compact ? "text-[10px]" : "text-xs"}`}>
      <details className="group rounded-lg border border-gray-100 bg-gray-50">
        <summary className="cursor-pointer px-2.5 py-2 font-medium text-gray-700 list-none flex items-center gap-1">
          <span className="group-open:rotate-90 transition-transform">▶</span>
          Platform specs · {spec.label.split("(")[0].trim()}
        </summary>
        <div className="px-2.5 pb-2 overflow-x-auto">
          <table className="w-full text-[9px]">
            <thead>
              <tr className="text-left text-gray-500">
                <th className="py-1 pr-2 font-medium">Asset</th>
                <th className="py-1 pr-2 font-medium">Spec</th>
                <th className="py-1 font-medium">Note</th>
              </tr>
            </thead>
            <tbody>
              {platformSpecRows(channel).map((row) => (
                <tr key={row.asset} className="border-t border-gray-100">
                  <td className="py-1 pr-2 text-gray-800">{row.asset}</td>
                  <td className="py-1 pr-2 text-gray-600">{row.spec}</td>
                  <td className="py-1 text-gray-500">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      {channelPayload?.kind === "meta" && (
        <div className="rounded-lg border border-gray-100 p-2.5 space-y-1.5 bg-white">
          <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
            Meta creative template
          </p>
          <Field label="Primary Text · Hook (≤125)" value={channelPayload.hookLine} highlight />
          <Field label="Problem" value={channelPayload.problemLine} />
          <Field label="Solution" value={channelPayload.solutionLine} />
          <Field label="Headline (≤40)" value={headline} />
          <Field label="Description (≤30)" value={description ?? "—"} />
          <Field label="CTA" value={cta} />
        </div>
      )}

      {channelPayload?.kind === "display" && (
        <div className="rounded-lg border border-gray-100 p-2.5 space-y-1.5 bg-white">
          <p className="text-[9px] uppercase tracking-wider text-gray-500 font-semibold">
            Responsive Display template
          </p>
          <Field label="Business Name" value={channelPayload.businessName} />
          <Field label="Short Headlines (5)" value={channelPayload.shortHeadlines.join(" · ")} />
          <Field label="Long Headlines (5)" value={channelPayload.longHeadlines[0]} />
          <Field label="Descriptions (5)" value={channelPayload.descriptions[0]} />
          <Field label="Images needed" value={channelPayload.imagesNeeded.join(", ")} />
          <Field label="CTA" value={cta} />
        </div>
      )}

      {channelPayload?.kind === "search" && (
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm -mx-1">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            Google Search variants
          </p>
          <p className="text-xs text-gray-500 mb-4">
            All RSA headlines and descriptions for this creative
          </p>
          <SearchVariantsTable payload={channelPayload} cta={cta} />
        </div>
      )}

      {!compact && (
        <details className="group">
          <summary className="cursor-pointer text-[10px] text-gray-500 hover:text-gray-700 list-none">
            Production checklist ({PRODUCTION_CHECKLIST.length} items)
          </summary>
          <ul className="mt-1.5 space-y-0.5 text-[10px] text-gray-600">
            {PRODUCTION_CHECKLIST.map((item) => (
              <li key={item} className="flex gap-1.5">
                <span className="text-gray-400">☐</span>
                {item}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <p className="text-[9px] text-gray-500">{label}</p>
      <p
        className={`leading-snug ${highlight ? "font-semibold text-gray-900" : "text-gray-700"}`}
      >
        {value}
      </p>
    </div>
  );
}
