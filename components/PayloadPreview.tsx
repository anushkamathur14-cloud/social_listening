"use client";

import { useState } from "react";

interface PayloadPreviewProps {
  creativeId: string;
  cached?: unknown;
  liveReady?: boolean;
}

export function PayloadPreview({
  creativeId,
  cached,
  liveReady,
}: PayloadPreviewProps) {
  const [payload, setPayload] = useState<unknown>(cached);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (payload !== undefined) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/creatives/${creativeId}/payload`);
      const data = await res.json();
      setPayload(data.payload);
    } catch {
      setPayload({ error: "Failed to load preview" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <details
      className="group"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) void load();
      }}
    >
      <summary className="cursor-pointer text-[var(--muted)] hover:text-[var(--foreground)] list-none text-[10px] font-medium">
        <span className="group-open:rotate-90 inline-block transition-transform mr-1">
          ▶
        </span>
        API payload preview
        {liveReady && (
          <span className="ml-1 text-[var(--uber-green-dark)]">· credentials set</span>
        )}
      </summary>
      <pre className="mt-2 p-2 rounded-lg bg-zinc-900 text-green-400 text-[9px] overflow-x-auto max-h-32 leading-relaxed">
        {loading
          ? "Loading…"
          : JSON.stringify(payload ?? { note: "Expand to load" }, null, 2)}
      </pre>
    </details>
  );
}
