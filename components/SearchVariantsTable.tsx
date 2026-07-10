"use client";

import type { SearchExtras } from "@/lib/creative/channel-payload";
import { normalizeSearchPayload } from "@/lib/creative/channel-payload";
import { CHANNEL_MAP } from "@/lib/channels";

interface SearchVariantsTableProps {
  payload: SearchExtras;
  cta?: string;
  compact?: boolean;
}

const ROLE_COLORS: Record<string, string> = {
  "Primary keyword": "bg-blue-100 text-blue-800 border-blue-200",
  "Brand + geo": "bg-violet-100 text-violet-800 border-violet-200",
  Brand: "bg-violet-100 text-violet-800 border-violet-200",
  Offer: "bg-amber-100 text-amber-900 border-amber-200",
  CTA: "bg-green-100 text-green-800 border-green-200",
  Keyword: "bg-blue-100 text-blue-800 border-blue-200",
  "Trust signal": "bg-teal-100 text-teal-800 border-teal-200",
  Product: "bg-indigo-100 text-indigo-800 border-indigo-200",
  "Cross-sell": "bg-pink-100 text-pink-800 border-pink-200",
  "Benefit + keyword + CTA": "bg-blue-100 text-blue-800 border-blue-200",
  "Offer + terms": "bg-amber-100 text-amber-900 border-amber-200",
  "Value prop + sign-up": "bg-violet-100 text-violet-800 border-violet-200",
  "Trust + download": "bg-teal-100 text-teal-800 border-teal-200",
};

function roleBadgeClass(role: string): string {
  return ROLE_COLORS[role] ?? "bg-gray-100 text-gray-700 border-gray-200";
}

export function SearchVariantsTable({
  payload,
  cta,
  compact,
}: SearchVariantsTableProps) {
  const normalized = normalizeSearchPayload(payload);
  const headlineMax = CHANNEL_MAP.google_search.headlineMax;
  const descriptionMax = CHANNEL_MAP.google_search.descriptionMax ?? 90;

  return (
    <div className={`space-y-6 ${compact ? "text-sm" : "text-sm"}`}>
      <UrlBar
        displayUrl={normalized.displayUrl}
        path1={normalized.path1}
        path2={normalized.path2}
        cta={cta}
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <VariantSection
          title="Headlines"
          subtitle={`${normalized.headlines.length} of ${CHANNEL_MAP.google_search.headlineCount} · max ${headlineMax} characters each`}
          max={headlineMax}
          variants={normalized.headlines}
          textLabel="Headline"
        />

        <VariantSection
          title="Descriptions"
          subtitle={`${normalized.descriptions.length} of ${CHANNEL_MAP.google_search.descriptionCount} · max ${descriptionMax} characters each`}
          max={descriptionMax}
          variants={normalized.descriptions}
          textLabel="Description"
          multiline
        />
      </div>
    </div>
  );
}

function UrlBar({
  displayUrl,
  path1,
  path2,
  cta,
}: {
  displayUrl: string;
  path1: string;
  path2: string;
  cta?: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        How it appears in search
      </p>
      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-1">
        <p className="text-xs text-green-700 font-medium">Sponsored</p>
        <p className="text-sm text-green-800">
          {displayUrl} › {path1} › {path2}
        </p>
        <p className="text-base font-medium text-blue-700 leading-snug pt-1">
          Headlines and descriptions combine dynamically in the ad
        </p>
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <MetaItem label="Display URL" value={displayUrl} />
        <MetaItem label="Path 1" value={path1} />
        <MetaItem label="Path 2" value={path2} />
        {cta && <MetaItem label="CTA" value={cta} />}
      </div>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] text-gray-500 mb-0.5">{label}</p>
      <p className="text-sm font-medium text-gray-900">{value}</p>
    </div>
  );
}

function VariantSection({
  title,
  subtitle,
  max,
  variants,
  textLabel,
  multiline,
}: {
  title: string;
  subtitle: string;
  max: number;
  variants: { text: string; role: string }[];
  textLabel: string;
  multiline?: boolean;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden shadow-sm">
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900">{title}</h4>
        <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
      </div>

      <div className="divide-y divide-gray-100 max-h-[520px] overflow-y-auto">
        {variants.map((variant, i) => (
          <VariantCard
            key={`${title}-${i}`}
            index={i + 1}
            role={variant.role}
            text={variant.text}
            max={max}
            textLabel={textLabel}
            multiline={multiline}
          />
        ))}
      </div>
    </div>
  );
}

function VariantCard({
  index,
  role,
  text,
  max,
  textLabel,
  multiline,
}: {
  index: number;
  role: string;
  text: string;
  max: number;
  textLabel: string;
  multiline?: boolean;
}) {
  const len = text.length;
  const pct = Math.min(100, (len / max) * 100);
  const over = len > max;
  const near = !over && len > max * 0.85;

  return (
    <article
      className={`px-4 py-3.5 hover:bg-gray-50/80 transition-colors ${
        index % 2 === 0 ? "bg-white" : "bg-gray-50/40"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-900 text-white text-xs font-semibold tabular-nums">
          {index}
        </span>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${roleBadgeClass(role)}`}
            >
              {role}
            </span>
            <span
              className={`text-xs tabular-nums ${
                over
                  ? "text-red-600 font-semibold"
                  : near
                    ? "text-amber-600"
                    : "text-gray-400"
              }`}
            >
              {len}/{max} chars
            </span>
          </div>

          <p
            className={`text-gray-900 leading-relaxed ${
              multiline ? "text-sm" : "text-base font-medium"
            }`}
          >
            {text}
          </p>

          <div className="h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                over ? "bg-red-500" : near ? "bg-amber-400" : "bg-green-500"
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>

          <p className="text-[11px] text-gray-400 sr-only">
            {textLabel} variant {index}
          </p>
        </div>
      </div>
    </article>
  );
}
