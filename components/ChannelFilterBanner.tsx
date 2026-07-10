"use client";

import { selectedChannelsLabel } from "@/lib/channel-filter";
import type { Channel } from "@/lib/types";

interface ChannelFilterBannerProps {
  selectedChannels: Channel[];
}

export function ChannelFilterBanner({ selectedChannels }: ChannelFilterBannerProps) {
  if (selectedChannels.length === 0) return null;

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-[11px] text-gray-600 mb-4 flex flex-wrap items-center gap-2">
      <span className="font-semibold text-gray-800 shrink-0">Showing selected channels only:</span>
      <span>{selectedChannelsLabel(selectedChannels)}</span>
      <span className="text-gray-400">· change selection in the header before injecting</span>
    </div>
  );
}
