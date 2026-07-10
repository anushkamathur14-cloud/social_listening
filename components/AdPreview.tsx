"use client";

import { useState } from "react";
import { brand } from "@/lib/brand";
import { CHANNEL_MAP } from "@/lib/channels";
import type { ChannelPayload } from "@/lib/creative/channel-payload";
import { normalizeSearchPayload } from "@/lib/creative/channel-payload";
import { getFallbackImageUrl } from "@/lib/creative/stock-images";
import { VERTICAL_META, verticalFromPersona } from "@/lib/verticals";
import type { Channel } from "@/lib/types";
import { PhoneFrame } from "./PhoneFrame";

export interface AdCreative {
  id: string;
  channel: Channel;
  persona: string;
  market: string;
  headline: string;
  copy: string;
  description?: string;
  cta: string;
  attribution: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCredit?: string;
  imageCreditUrl?: string;
  productOffer?: string;
  channelPayload?: ChannelPayload;
}

const CHANNEL_FRAME: Record<Channel, { label: string; aspect: string; portrait?: string }> = {
  meta: { label: "Instagram Feed", aspect: "aspect-square", portrait: "aspect-[4/5]" },
  smartly: { label: "Smartly Template", aspect: "aspect-square", portrait: "aspect-[4/5]" },
  display: { label: "Display Banner", aspect: "aspect-[6/5]" },
  google_search: { label: "Google Search", aspect: "" },
};

function AdImage({
  src,
  alt,
  channel,
  credit,
}: {
  src: string;
  alt: string;
  channel: Channel;
  credit?: string;
}) {
  const fallback = getFallbackImageUrl(channel) ?? src;
  const [imgSrc, setImgSrc] = useState(src);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        loading="lazy"
        onError={() => setImgSrc(fallback)}
      />
      {credit && (
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1 z-[1]">
          <p className="text-[8px] text-white truncate">{credit} / Unsplash</p>
        </div>
      )}
    </>
  );
}

interface AdPreviewProps {
  creative: AdCreative;
  compact?: boolean;
  mobileFrame?: boolean;
}

export function AdPreview({ creative, compact, mobileFrame }: AdPreviewProps) {
  const channelSpec = CHANNEL_MAP[creative.channel];
  const isTextAd = channelSpec?.format === "text";
  const frame = CHANNEL_FRAME[creative.channel];
  const vertical = verticalFromPersona(creative.persona, creative.productOffer);
  const vMeta = VERTICAL_META[vertical];
  const usePhone =
    mobileFrame && (creative.channel === "meta" || creative.channel === "smartly");

  const adBody = (
    <div
      className={`rounded-xl border border-gray-200 bg-white text-gray-900 overflow-hidden shadow-md ${
        compact ? "text-[11px]" : ""
      } ${usePhone ? "rounded-none border-0 shadow-none" : ""}`}
    >
      <div
        className={`flex items-center gap-2 px-3 py-2 border-b border-gray-100 bg-gray-50 ${
          compact ? "py-1.5" : ""
        }`}
      >
        <div className="w-7 h-7 rounded-full bg-black flex items-center justify-center text-white text-xs font-bold shrink-0">
          {brand.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-900 truncate">{brand.name}</p>
          {!compact && (
            <p className="text-[10px] text-gray-500">
              {frame.label} · {creative.market}
            </p>
          )}
        </div>
        <span
          className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ${vMeta.bg} ${vMeta.color}`}
        >
          {vMeta.label.split(" ").pop()}
        </span>
      </div>

      {!isTextAd && creative.imageUrl && (
        <div className={`relative ${frame.aspect} bg-gray-100 min-h-[120px]`}>
          <AdImage
            src={creative.imageUrl}
            alt={creative.imageAlt ?? creative.headline}
            channel={creative.channel}
            credit={compact ? undefined : creative.imageCredit}
          />
        </div>
      )}

      {isTextAd && (
        <div className={`px-3 py-2 ${compact ? "py-1.5" : "py-3"}`}>
          <div className="rounded border border-gray-200 p-2 bg-gray-50 space-y-1">
            <p className="text-[9px] text-gray-500">Sponsored</p>
            <p className="text-[10px] text-green-800 font-medium truncate">
              {creative.channelPayload?.kind === "search"
                ? `${creative.channelPayload.displayUrl} › ${creative.channelPayload.path1} › ${creative.channelPayload.path2}`
                : `uber.com › ${creative.market.toLowerCase()}`}
            </p>
            {creative.channelPayload?.kind === "search" ? (
              <>
                <h3 className="text-xs font-medium text-blue-700 leading-snug mt-0.5 line-clamp-2">
                  {normalizeSearchPayload(creative.channelPayload)
                    .headlines.slice(0, 3)
                    .map((h) => h.text)
                    .join(" · ")}
                </h3>
                <p className="text-[10px] text-gray-700 mt-0.5 line-clamp-2">
                  {normalizeSearchPayload(creative.channelPayload).descriptions[0]
                    ?.text ?? creative.copy}
                </p>
              </>
            ) : (
              <>
                <h3 className="text-xs font-medium text-blue-700 leading-snug mt-0.5 line-clamp-2">
                  {creative.headline}
                </h3>
                <p className="text-[10px] text-gray-700 mt-0.5 line-clamp-2">
                  {creative.copy}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {!isTextAd && (
        <div className={`px-3 space-y-1 ${compact ? "py-2" : "py-3"}`}>
          {!compact && (
            <p className="text-[9px] text-green-700 font-medium">
              Ad · {creative.attribution.replace(/^https?:\/\//, "")}
            </p>
          )}
          {creative.channelPayload?.kind === "meta" && !compact && (
            <p className="text-[10px] text-gray-700 leading-relaxed line-clamp-4">
              <span className="font-semibold text-gray-900">
                {creative.channelPayload.hookLine}{" "}
              </span>
              {creative.copy.slice(creative.channelPayload.hookLine.length).trim()}
            </p>
          )}
          <h3
            className={`font-bold text-gray-900 leading-tight ${
              compact ? "text-[11px] line-clamp-2" : "text-sm"
            }`}
          >
            {creative.headline}
          </h3>
          {(creative.channelPayload?.kind !== "meta" || compact) && (
            <p
              className={`text-gray-700 leading-relaxed ${
                compact ? "text-[10px] line-clamp-2" : "text-xs line-clamp-3"
              }`}
            >
              {creative.copy}
            </p>
          )}
          {creative.description && !compact && (
            <p className="text-[10px] text-gray-500">{creative.description}</p>
          )}
          <button
            type="button"
            className={`w-full rounded-md bg-black hover:bg-gray-800 text-white font-semibold transition-colors ${
              compact ? "text-[10px] py-1.5 mt-0.5" : "text-xs py-2 mt-1"
            }`}
          >
            {creative.cta}
          </button>
        </div>
      )}
    </div>
  );

  if (usePhone) {
    return <PhoneFrame label={frame.label}>{adBody}</PhoneFrame>;
  }

  return adBody;
}
