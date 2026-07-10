"use client";

interface HowItWorksProps {
  onOpenIntegrations: () => void;
  onGoToDemo?: () => void;
  integrationsConfigured: number;
}

const FLOW = [
  {
    id: "read",
    icon: "📡",
    title: "Read signals",
    subtitle: "Live & mock sources",
    body: "Poll weather, airport delays, Google Trends, and community threads across your selected cities.",
    outputs: ["Signal feed", "Source links", "Market + vertical hint"],
    color: "blue",
  },
  {
    id: "trigger",
    icon: "⚡",
    title: "Fire triggers",
    subtitle: "Rules engine",
    body: "When severity, delay, spike, or engagement crosses a threshold, the pipeline starts — demo injects always run.",
    outputs: ["Trigger fired event", "Pipeline run ID"],
    color: "violet",
  },
  {
    id: "jit",
    icon: "✨",
    title: "JIT creatives",
    subtitle: "Just-in-time build",
    body: "Generate channel-specific ads on the spot — Meta, Google Search RSA, Display, Smartly — with personas, city imagery, and platform specs.",
    outputs: ["Multi-channel variants", "Compliance check", "Ideation angles"],
    color: "indigo",
  },
  {
    id: "review",
    icon: "👁",
    title: "Review & approve",
    subtitle: "Human gate",
    body: "Compare variants side-by-side, inspect API payloads, and approve only what you want routed.",
    outputs: ["Compare view", "Payload preview", "Your approval"],
    color: "amber",
  },
  {
    id: "push",
    icon: "🚀",
    title: "Push to ad platforms",
    subtitle: "Simulated or live",
    body: "Route approved creatives to Meta, Google Ads, Smartly, or DV360 — simulated by default, live-ready when credentials are set.",
    outputs: ["Campaign routed", "Performance metrics", "Optimizer loop"],
    color: "green",
  },
];

const USE_CASES = [
  {
    icon: "📈",
    title: "Growth & UA teams",
    summary: "Signal → JIT creative → launch in minutes, not days.",
    points: [
      "End-to-end latency visible in the pipeline tracker",
      "Cross-channel variants from one signal",
      "City promos tied to real local moments",
    ],
  },
  {
    icon: "⚙️",
    title: "Ad ops & partnerships",
    summary: "See exact payloads before anything hits an ad account.",
    points: [
      "Platform-specific API preview per channel",
      "Simulated routing with zero spend by default",
      "Optional live credentials for Meta, Google, Smartly, DV360",
    ],
  },
  {
    icon: "🎯",
    title: "Audience segmentation",
    summary: "Right message, market, and channel — not one blast.",
    points: [
      "City filter on signals and creatives",
      "Channel filter — run Meta-only, Search-only, or full stack",
      "Vertical routing: Rides, Eats, Travel per signal",
    ],
  },
  {
    icon: "👤",
    title: "Persona building",
    summary: "Distinct user types, not generic promos.",
    points: [
      "Commuter, foodie, traveler personas per signal",
      "LLM ideation to brainstorm angles first",
      "RSA / Display variant sets for testing",
    ],
  },
];

const SIGNALS = [
  { icon: "⛈️", label: "Weather", example: "Storm → Rides safety + Eats delivery" },
  { icon: "✈️", label: "Traffic", example: "Airport delay → Travel pickup offer" },
  { icon: "📈", label: "Trends", example: "Search spike → Eats new-user promo" },
  { icon: "💬", label: "Community", example: "Local buzz → matched UA angle" },
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
      {/* Hero */}
      <header className="text-center sm:text-left">
        <p className="text-xs uppercase tracking-widest text-green-700 font-semibold mb-2">
          Portfolio demo · not affiliated with Uber
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight mb-3">
          Read signals → build JIT creatives → push to ad platforms
        </h2>
        <p className="text-base text-gray-600 leading-relaxed max-w-3xl">
          A full signal-led UA pipeline: ingest local demand signals, generate
          just-in-time ads per channel and persona, then route approved
          creatives to Meta, Google, Smartly, or DV360 — with you in the loop
          at every step.
        </p>
      </header>

      {/* Visual flow */}
      <section className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-1">End-to-end flow</h3>
        <p className="text-sm text-gray-500 mb-8">
          From signal ingestion to ad platform routing
        </p>

        {/* Desktop horizontal flow */}
        <div className="hidden lg:block overflow-x-auto pb-2">
          <div className="flex items-stretch min-w-[900px] gap-0">
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
                    <div
                      className="flex items-center px-1 shrink-0 text-gray-300"
                      aria-hidden
                    >
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

        {/* Mobile vertical flow */}
        <div className="lg:hidden space-y-0">
          {FLOW.map((step, i) => {
            const c = COLOR[step.color];
            return (
              <div key={step.id}>
                <div
                  className={`rounded-xl border-2 ${c.border} ${c.bg} p-5`}
                >
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

      {/* Signal sources */}
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

      {/* Who it's for */}
      <section>
        <h3 className="text-lg font-bold text-gray-900 mb-1">Who it&apos;s for</h3>
        <p className="text-sm text-gray-500 mb-5">
          Growth, ad ops, segmentation, and persona teams
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

      {/* Callouts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <aside className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h3 className="text-sm font-semibold text-amber-950 mb-2">
            Simulated by default
          </h3>
          <p className="text-sm text-amber-900/90 leading-relaxed">
            &ldquo;Push to ad platforms&rdquo; shows the exact API payload but{" "}
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
              Pick channels, click a scenario, watch signals → JIT creatives →
              approve → route — under 30 seconds.
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
