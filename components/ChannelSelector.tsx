"use client";

import { CHANNELS, channelImageLabel, type Channel } from "@/lib/channels";

const CHANNEL_ICONS: Record<Channel, string> = {
  meta: "◉",
  display: "▭",
  google_search: "T",
  smartly: "⚡",
};

interface ChannelSelectorProps {
  selected: Channel[];
  onChange: (channels: Channel[]) => void;
}

export function ChannelSelector({ selected, onChange }: ChannelSelectorProps) {
  const toggle = (channel: Channel) => {
    const next = selected.includes(channel)
      ? selected.filter((c) => c !== channel)
      : [...selected, channel];
    if (next.length === 0) return;
    onChange(next);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {CHANNELS.map((ch) => {
        const active = selected.includes(ch.id);
        return (
          <button
            key={ch.id}
            type="button"
            onClick={() => toggle(ch.id)}
            title={`${ch.format === "image" ? "Image" : "Text"} · ${ch.publishLabel}`}
            className={`rounded-lg border text-[10px] px-2.5 py-1.5 transition-all ${
              active
                ? "bg-black border-black text-white shadow-sm"
                : "bg-white border-[var(--border)] text-[var(--muted)] hover:bg-zinc-50"
            }`}
          >
            <span className="mr-1 opacity-70">{CHANNEL_ICONS[ch.id]}</span>
            {ch.label.split("(")[0].trim()}
            <span className="ml-1.5 opacity-50 text-[9px]">
              {ch.format === "image" ? channelImageLabel(ch) : "text"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
