"use client";

import { platform } from "@/lib/platform";

interface HowItWorksProps {
  onOpenIntegrations: () => void;
  onGoToDemo?: () => void;
  integrationsConfigured: number;
}

const FLOW = [
  {
    id: "listen",
    icon: "👂",
    title: "Monitor conversations",
    subtitle: "Social listening",
    body: "Ingest community threads, search spikes, weather alerts, and travel disruptions across selected markets — live or simulated sources.",
    outputs: ["Signal feed", "Source verification", "Sentiment hints"],
    color: "blue",
  },
  {
    id: "analyze",
    icon: "🧠",
    title: "Analyze & detect",
    subtitle: "Brand intelligence",
    body: "AI evaluates engagement, velocity, severity, and trend spikes. Trigger rules fire when a moment is worth acting on.",
    outputs: ["Sentiment scoring", "Trend detection", "Trigger fired"],
    color: "violet",
  },
  {
    id: "insights",
    icon: "💡",
    title: "Surface insights",
    subtitle: "Actionable intelligence",
    body: "Turn raw signals into structured insights — market, vertical, persona, and recommended angle — before any creative is built.",
    outputs: ["Ideation angles", "Persona match", "Segment filters"],
    color: "indigo",
  },
  {
    id: "jit",
    icon: "✨",
    title: "JIT activation",
    subtitle: "Just-in-time creatives",
    body: "Generate channel-ready ads on the spot — Meta, Google Search, Display, Smartly — sized to platform specs with compliance checks.",
    outputs: ["Multi-channel variants", "RSA / Meta templates", "Review queue"],
    color: "amber",
  },
  {
    id: "push",
    icon: "🚀",
    title: "Push to channels",
    subtitle: "Optional ad routing",
    body: "Approve and route payloads to Meta, Google Ads, Smartly, or DV360 — simulated by default, live-ready with credentials.",
    outputs: ["API payloads", "Campaign routed", "Performance loop"],
    color: "green",
  },
];

const USE_CASES = [
  {
    icon: "📈",
    title: "Growth & UA teams",
    summary: "From social buzz to live campaigns in minutes.",
    points: [
      "Signal → insight → JIT creative in one flow",
      "Cross-channel activation from one intelligence moment",
      "City and channel segmentation built in",
    ],
  },
  {
    icon: "⚙️",
    title: "Ad ops & partnerships",
    summary: "Inspect payloads before anything hits an ad account.",
    points: [
      "Platform-specific API preview per channel",
      "Human approval gate on every activation",
      "Optional live credentials for major ad APIs",
    ],
  },
  {
    icon: "🎯",
    title: "Audience segmentation",
    summary: "Right message for the right market and moment.",
    points: [
      "Filter signals and outputs by city",
      "Channel filter — Meta, Search, Display, Smartly",
      "Vertical routing from intelligence signals",
    ],
  },
  {
    icon: "👤",
    title: "Persona & brand intelligence",
    summary: "Understand who is talking and what they need.",
    points: [
      "Commuter, foodie, traveler personas from context",
      "LLM ideation on top of listening signals",
      "Sentiment-aware creative angles",
    ],
  },
];

const SIGNALS = [
  { icon: "💬", label: "Conversations", example: "Community threads → sentiment + promo angle" },
  { icon: "📈", label: "Trends", example: "Search spikes → emerging demand signals" },
  { icon: "⛈️", label: "Context", example: "Weather & events → moment-based messaging" },
  { icon: "✈️", label: "Mobility", example: "Travel delays → localized activation" },
];

const COLOR: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  blue: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-900", dot: "bg-blue-500" },
  violet: { bg: "bg-violet-50", border: "border-violet-200", text: "text-violet-900", dot: "bg-violet-500" },
  indigo: { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-900", dot: "bg-indigo-500" },
  amber: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-900", dot: "bg-amber-500" },
  green: { bg: "bg-green-50", border: "border-green-200", text: "text-green-900", dot: "bg-green-600" },
};

export function HowItWorks({
  onOpenIntegrations,
  onGoToDemo,
  integrationsConfigured,
}: HowItWorksProps) {
  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      <header className="text-center sm:text-left">
        <p className="text-xs uppercase tracking-widest text-green-700 font-semibold mb-2">
          {platform.name}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
          Social listening → brand intelligence → activation
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
          {platform.tagline} This demo extends that pipeline with{" "}
          <strong className="text-gray-900">just-in-time creatives</strong> and{" "}
          <strong className="text-gray-900">optional ad-platform routing</strong>{" "}
          — using a sample mobility brand as the activation layer.
        </p>
      </header>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">End-to-end flow</h3>
        <p className="text-sm text-gray-500 mb-8">
          Listen → analyze → insight → activate → push
        </p>

        <div className="hidden lg:block overflow-x-auto pb-2">
          <div className="flex items-stretch min-w-[1000px] gap-0">
            {FLOW.map((step, i) => {
              const c = COLOR[step.color];
              return (
                <div key={step.id} className="flex items-stretch flex-1 min-w-0">
                  <div
                    className={`flex-1 rounded-xl border-2 ${c.border} ${c.bg} p-4 flex flex-col`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl" aria-hidden>
                        {step.icon}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${c.dot}`} />
                    </div>
                    <p className={`text-sm font-bold ${c.text}`}>{step.title}</p>
                    <p className="text-xs text-gray-500 mb-2">{step.subtitle}</p>
                    <p className="text-xs text-gray-700 leading-relaxed flex-1">
                      {step.body}
                    </p>
                    <ul className="mt-3 pt-3 border-t border-black/5 space-y-1">
                      {step.outputs.map((o) => (
                        <li key={o} className="text-[11px] text-gray-600 flex gap-1">
                          <span className="text-green-600">→</span> {o}
                        </li>
                      ))}
                    </ul>
                  </div>
                  {i < FLOW.length - 1 && (
                    <div className="flex items-center px-1 shrink-0 text-gray-300" aria-hidden>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M10 6L16 12L10 18V6Z" />
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:hidden space-y-0">
          {FLOW.map((step, i) => {
            const c = COLOR[step.color];
            return (
              <div key={step.id}>
                <div className={`rounded-xl border-2 ${c.border} ${c.bg} p-5`}>
                  <div className="flex items-start gap-3">
                    <span className="text-3xl leading-none" aria-hidden>
                      {step.icon}
                    </span>
                    <div className="flex-1">
                      <p className={`text-base font-bold ${c.text}`}>
                        {i + 1}. {step.title}
                      </p>
                      <p className="text-xs text-gray-500">{step.subtitle}</p>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">
                        {step.body}
                      </p>
                      <ul className="mt-3 flex flex-wrap gap-2">
                        {step.outputs.map((o) => (
                          <li
                            key={o}
                            className="text-xs bg-white/80 border border-black/5 rounded-full px-2.5 py-1 text-gray-700"
                          >
                            {o}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
                {i < FLOW.length - 1 && (
                  <div className="flex justify-center py-2 text-gray-300" aria-hidden>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 16L6 10H18L12 16Z" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {SIGNALS.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-center sm:text-left"
          >
            <p className="text-2xl mb-1" aria-hidden>
              {s.icon}
            </p>
            <p className="text-sm font-semibold text-gray-900">{s.label}</p>
            <p className="text-xs text-gray-600 mt-1">{s.example}</p>
          </div>
        ))}
      </section>

      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Who it&apos;s for</h3>
        <p className="text-sm text-gray-500 mb-5">
          Brand, growth, ops, and intelligence teams
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {USE_CASES.map((uc) => (
            <article
              key={uc.title}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl" aria-hidden>
                  {uc.icon}
                </span>
                <div>
                  <h4 className="text-base font-semibold text-gray-900">
                    {uc.title}
                  </h4>
                  <p className="text-sm text-gray-600">{uc.summary}</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {uc.points.map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-gray-700">
                    <span className="text-green-600 shrink-0">✓</span>
                    {p}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-950 mb-2">
            Demo mode — simulated activation
          </h3>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            Ad routing shows exact API payloads but{" "}
            <strong>spends no money</strong> until you add credentials in{" "}
            <button
              type="button"
              onClick={onOpenIntegrations}
              className="underline font-semibold"
            >
              Integrations
            </button>
            {integrationsConfigured > 0
              ? ` (${integrationsConfigured} connected).`
              : "."}
          </p>
        </aside>

        <div className="rounded-xl border-2 border-black bg-black text-white p-5 flex flex-col justify-between">
          <div>
            <p className="text-base font-semibold mb-2">Try the live demo</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              Monitor a signal, generate JIT creatives, approve, and route — under
              30 seconds.
            </p>
          </div>
          {onGoToDemo && (
            <button
              type="button"
              onClick={onGoToDemo}
              className="mt-4 w-full rounded-lg bg-white text-black text-sm font-semibold py-2.5 hover:bg-gray-100 transition-colors"
            >
              Open Live demo →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
