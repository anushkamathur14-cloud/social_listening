"use client";

import type { Market, SignalType } from "@/lib/types";

export interface DemoScenario {
  id: string;
  label: string;
  description: string;
  signalType: SignalType;
  market: Market;
  emoji: string;
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "ord-delay",
    label: "Airport delay",
    description: "ORD · 52 min delay → Travel UA",
    signalType: "traffic",
    market: "ORD",
    emoji: "✈️",
  },
  {
    id: "nyc-storm",
    label: "Storm alert",
    description: "NYC · severe weather → Rides + Eats",
    signalType: "weather",
    market: "NYC",
    emoji: "⛈️",
  },
  {
    id: "lax-food",
    label: "Food trend spike",
    description: "LAX · delivery searches → Eats UA",
    signalType: "trends",
    market: "LAX",
    emoji: "🍔",
  },
  {
    id: "mia-community",
    label: "Community buzz",
    description: "MIA · locals asking about rides → UA promo",
    signalType: "reddit",
    market: "MIA",
    emoji: "💬",
  },
];

interface DemoScenariosProps {
  onRun: (scenario: DemoScenario) => void;
  running: boolean;
  disabled?: boolean;
}

export function DemoScenarios({ onRun, running, disabled }: DemoScenariosProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {DEMO_SCENARIOS.map((s) => (
        <button
          key={s.id}
          type="button"
          disabled={running || disabled}
          onClick={() => onRun(s)}
          title={s.description}
          className="group flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-40 px-3 py-2 text-left transition-colors"
        >
          <span className="text-base">{s.emoji}</span>
          <div>
            <p className="text-xs font-medium group-hover:text-black">
              {running ? "Running…" : s.label}
            </p>
            <p className="text-[10px] text-[var(--muted)]">{s.description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
