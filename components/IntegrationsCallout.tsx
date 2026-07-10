"use client";

interface IntegrationsCalloutProps {
  onOpen: () => void;
  configuredCount: number;
}

export function IntegrationsCallout({ onOpen, configuredCount }: IntegrationsCalloutProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 flex flex-wrap items-center gap-3 text-xs text-gray-700 mb-4">
      <span className="font-semibold text-gray-900 shrink-0">About routing</span>
      <p className="flex-1 min-w-[200px] leading-relaxed">
        Add an <strong>OpenAI key</strong> for live ideation and customized creatives, or
        connect ad APIs to route approved payloads live-ready. Without keys, the demo uses
        templates and simulated routing.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg bg-black hover:bg-gray-800 text-white px-3 py-1.5 font-medium"
      >
        {configuredCount > 0
          ? `Integrations (${configuredCount} set)`
          : "Open Integrations"}
      </button>
    </div>
  );
}

/** User-facing label for creative routing status */
export function routeStatusLabel(
  status: string,
  simulated?: boolean
): string {
  if (status === "published") {
    return simulated === false
      ? "Approved & live now"
      : "Approved & live (simulated)";
  }
  if (status === "pending_review") return "awaiting your approval";
  return status.replace("_", " ");
}
