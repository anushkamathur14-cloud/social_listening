"use client";

interface HowItWorksProps {
  onOpenIntegrations: () => void;
  integrationsConfigured: number;
}

const STEPS = [
  {
    n: 1,
    title: "Detect local signals",
    body: "The pipeline watches weather, airport delays, search trends, and community conversations in your selected cities — then flags moments when people are likely to need a ride or delivery.",
  },
  {
    n: 2,
    title: "Generate channel creatives",
    body: "For each signal, the system drafts user-acquisition ads tailored to Uber Rides, Eats, or Travel — sized for Meta, Display, Google Search, or Smartly, with city-specific imagery.",
  },
  {
    n: 3,
    title: "Validate compliance",
    body: "Copy is checked for length limits, blocked terms, competitor mentions, and required promo disclaimers before anything reaches review.",
  },
  {
    n: 4,
    title: "You review & approve",
    body: "Compare creatives side-by-side, inspect the API payload preview, then approve. Nothing leaves this demo automatically.",
  },
  {
    n: 5,
    title: "Route to your ad platforms (optional)",
    body: "By default, routing is simulated — no real spend. Add your Meta, Google Ads, Smartly, or DV360 credentials under Integrations to see live-ready payloads routed through the matching adapter.",
  },
];

const SIGNALS = [
  { icon: "⛈️", label: "Weather", example: "Storm in NYC → “Stay safe, skip the drive” Rides + “Stay in, order Eats” promos" },
  { icon: "✈️", label: "Traffic & travel", example: "ORD delay → airport pickup offer for new riders" },
  { icon: "📈", label: "Search trends", example: "Spike in “food delivery” searches → Uber Eats new-user offer" },
  { icon: "💬", label: "Community buzz", example: "Local threads about rides or delivery → promo matched to what people are asking for" },
];

export function HowItWorks({ onOpenIntegrations, integrationsConfigured }: HowItWorksProps) {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm">
        <p className="text-[10px] uppercase tracking-wider text-green-700 font-semibold mb-2">
          Portfolio demo · not affiliated with Uber
        </p>
        <h2 className="text-xl font-bold text-gray-900 mb-2">
          Real-time signal-led user acquisition
        </h2>
        <p className="text-sm text-gray-700 leading-relaxed max-w-3xl">
          This tool shows how a growth team could turn <strong>live local signals</strong> into{" "}
          <strong>channel-ready UA ads</strong> for Uber Rides, Eats, and travel — with human
          approval before anything is sent to ad platforms. It is built for demos and interviews,
          not production traffic.
        </p>
      </section>

      <section className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <h3 className="text-sm font-semibold text-amber-900 mb-1">
          “Published” here does not mean live ads
        </h3>
        <p className="text-xs text-amber-900/90 leading-relaxed">
          When you approve a creative, the demo <strong>simulates routing</strong> to Meta,
          Google Ads, Smartly, or DV360 — you will see the exact API payload, but{" "}
          <strong>no money is spent</strong> unless you connect real credentials. Open{" "}
          <button
            type="button"
            onClick={onOpenIntegrations}
            className="underline font-semibold hover:text-amber-950"
          >
            Integrations
          </button>{" "}
          to add your ad account API keys
          {integrationsConfigured > 0
            ? ` (${integrationsConfigured} connected — approve buttons show “live-ready”).`
            : " (optional)."}
        </p>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4">How the pipeline works</h3>
          <ol className="space-y-4">
            {STEPS.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="w-7 h-7 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {s.n}
                </span>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-gray-900">What triggers a creative?</h3>
          <ul className="space-y-3">
            {SIGNALS.map((s) => (
              <li key={s.label} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <p className="text-xs font-semibold text-gray-900">
                  {s.icon} {s.label}
                </p>
                <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">{s.example}</p>
              </li>
            ))}
          </ul>

          <div className="rounded-lg border border-gray-200 p-3 text-xs text-gray-600 leading-relaxed">
            <p className="font-medium text-gray-900 mb-1">Try it in 30 seconds</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Pick channels (Meta + Google Search is a good start)</li>
              <li>Click a quick-demo scenario in the header</li>
              <li>Open the <strong>Creatives</strong> tab to compare & approve</li>
              <li>Expand <strong>API payload preview</strong> to see what would be sent</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Who this is for</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">Growth / UA teams</p>
            <p className="text-gray-600 mt-1">
              See signal-to-creative latency and cross-channel variant generation in one flow.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">Ad ops & partnerships</p>
            <p className="text-gray-600 mt-1">
              Inspect Meta / Smartly / Google payloads before wiring live credentials.
            </p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="font-medium text-gray-900">Interview & portfolio</p>
            <p className="text-gray-600 mt-1">
              End-to-end story: detect → generate → validate → human gate → optional publish.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
