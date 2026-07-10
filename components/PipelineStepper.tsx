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

interface PipelineStepperProps {
  events: AppEvent[];
}

export function PipelineStepper({ events }: PipelineStepperProps) {
  const stageEvents = events
    .filter((e) => e.type === "pipeline_stage")
    .slice(-20);

  const latest = stageEvents[stageEvents.length - 1];
  const currentStage = (latest?.data.stage as PipelineStage) ?? "detect";
  const currentStatus = (latest?.data.status as string) ?? "idle";
  const timings = (latest?.data.timings as Record<string, number>) ?? {};

  const currentIndex = STAGES.indexOf(currentStage);

  return (
    <div className="space-y-4">
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
                className={`text-xs mt-1 ${isActive ? "text-cyan-300" : isDone ? "text-green-400" : "text-zinc-500"}`}
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
