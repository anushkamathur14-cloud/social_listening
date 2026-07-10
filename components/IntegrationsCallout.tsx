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
        Approving a creative <strong>does not spend ad budget</strong> in this demo — it
        simulates sending the payload to Meta, Google Ads, Smartly, or DV360. Connect your own
        API keys to mark routes as live-ready.
      </p>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 rounded-lg bg-black hover:bg-gray-800 text-white px-3 py-1.5 font-medium"
      >
        {configuredCount > 0
          ? `Integrations (${configuredCount} set)`
          : "Add ad account APIs"}
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
    return simulated === false ? "routed · live-ready" : "routed · simulated";
  }
  if (status === "pending_review") return "awaiting your approval";
  return status.replace("_", " ");
}
