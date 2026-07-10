import type { AppEvent } from "../types";

export function triggerIdForSignal(
  events: AppEvent[],
  signalId: string
): string | null {
  for (let i = events.length - 1; i >= 0; i--) {
    const event = events[i];
    if (event.type !== "trigger_fired") continue;
    const trigger = event.data.trigger as { id: string; signalId: string };
    if (trigger.signalId === signalId) return trigger.id;
  }
  return null;
}

export function isStreamableEvent(event: { type: string }): boolean {
  return event.type !== "connected";
}
