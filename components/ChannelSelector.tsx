"use client";

import { CHANNELS, type Channel } from "@/lib/channels";

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
            className={`rounded-md border text-[10px] px-2 py-1 transition-colors ${
              active
                ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {ch.label.split("(")[0].trim()}
            <span className="ml-1 opacity-60">
              {ch.format === "image" ? "📷" : "T"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
