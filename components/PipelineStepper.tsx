"use client";

import type { AppEvent, PipelineStage } from "@/lib/types";

const STAGES: PipelineStage[] = [
  "detect",
  "generate",
  "validate",
  "launch",
  "optimize",
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  detect: "Detect",
  generate: "Generate",
  validate: "Validate",
  launch: "Launch",
  optimize: "Optimize",
};

const STAGE_HELP: Record<PipelineStage, string> = {
  detect: "A signal crossed a threshold (weather, traffic, trend, or Reddit thread).",
  generate: "AI writes ad variants tailored to the signal, city, and persona.",
  validate: "Rules engine checks copy length, blocked words, and attribution.",
  launch: "Simulated deploy to Meta or Smartly (awaits approval if enabled).",
  optimize: "Mock metrics rank variants — pause losers, scale winners.",
};

interface PipelineStepperProps {
  events: AppEvent[];
}

export function PipelineStepper({ events }: PipelineStepperProps) {
  const stageEvents = events
    .filter((e) => e.type === "pipeline_stage")
    .slice(-30);

  const latest = stageEvents[stageEvents.length - 1];
  const currentStage = (latest?.data.stage as PipelineStage) ?? "detect";
  const currentStatus = (latest?.data.status as string) ?? "idle";
  const timings = (latest?.data.timings as Record<string, number>) ?? {};
  const latestMessage = latest?.data.message as string | undefined;
  const latestSignal = latest?.data.signal as
    | { summary?: string; sourceLabel?: string; market?: string }
    | undefined;

  const currentIndex = STAGES.indexOf(currentStage);
  const triggerEvents = events.filter((e) => e.type === "trigger_fired").slice(-1);
  const latestTrigger = triggerEvents[0]?.data.trigger as
    | { rule?: string; market?: string; type?: string }
    | undefined;

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-cyan-900/40 bg-cyan-950/20 p-3 text-xs text-zinc-300">
        <p className="font-medium text-cyan-300 mb-1">How the pipeline works</p>
        <p className="leading-relaxed">
          1. <strong>Signal</strong> arrives from a real or mock source → 2.{" "}
          <strong>Trigger</strong> fires if rules match → 3.{" "}
          <strong>Creatives</strong> generated per persona → 4.{" "}
          <strong>Compliance</strong> validates → 5.{" "}
          <strong>Launch</strong> simulates ad deploy → 6.{" "}
          <strong>Optimizer</strong> reads performance and scales winners.
        </p>
        {latestTrigger && (
          <p className="mt-2 text-zinc-400">
            Last trigger: <span className="text-white">{latestTrigger.type}</span> in{" "}
            <span className="text-white">{latestTrigger.market}</span> — rule:{" "}
            {latestTrigger.rule}
          </p>
        )}
        {latestMessage && (
          <p className="mt-1 text-zinc-400">{latestMessage}</p>
        )}
        {latestSignal?.sourceLabel && (
          <p className="mt-1 text-zinc-500">Source: {latestSignal.sourceLabel}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        {STAGES.map((stage, i) => {
          const isActive = i === currentIndex && currentStatus === "running";
          const isDone =
            i < currentIndex ||
            (i === currentIndex && currentStatus === "completed");
          return (
            <div key={stage} className="flex flex-col items-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                  isActive
                    ? "border-cyan-400 bg-cyan-400/20 text-cyan-300 animate-pulse"
                    : isDone
                      ? "border-green-500 bg-green-500/20 text-green-400"
                      : "border-zinc-700 bg-zinc-800 text-zinc-500"
                }`}
              >
                {i + 1}
              </div>
              <span
                className={`text-xs mt-1 text-center ${isActive ? "text-cyan-300" : isDone ? "text-green-400" : "text-zinc-500"}`}
              >
                {STAGE_LABELS[stage]}
              </span>
              {timings[stage] !== undefined && (
                <span className="text-[10px] text-zinc-600">
                  {timings[stage]}ms
                </span>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[11px] text-zinc-500 text-center">
        {STAGE_HELP[currentStage]}
      </p>

      {stageEvents.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-3 max-h-32 overflow-y-auto">
          {stageEvents
            .slice(-5)
            .reverse()
            .map((e) => (
              <div
                key={e.id}
                className="text-xs text-zinc-400 flex gap-2 py-0.5"
              >
                <span className="text-zinc-600">
                  {new Date(e.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-zinc-300">
                  {STAGE_LABELS[e.data.stage as PipelineStage]}
                </span>
                <span
                  className={
                    e.data.status === "completed"
                      ? "text-green-500"
                      : "text-cyan-400"
                  }
                >
                  {e.data.status as string}
                </span>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
