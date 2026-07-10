import { EventEmitter } from "events";
import { nanoid } from "nanoid";
import type { AppEvent, EventType } from "../types";

class EventBroadcaster extends EventEmitter {
  private history: AppEvent[] = [];
  private maxHistory = 200;

  emitEvent(type: EventType, data: Record<string, unknown>): AppEvent {
    const event: AppEvent = {
      id: nanoid(),
      type,
      timestamp: new Date().toISOString(),
      data,
    };
    this.history.push(event);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    this.emit("event", event);
    return event;
  }

  getHistory(limit = 50): AppEvent[] {
    return this.history.slice(-limit);
  }
}

declare global {
  var __eventBroadcaster: EventBroadcaster | undefined;
}

export const broadcaster =
  global.__eventBroadcaster ?? (global.__eventBroadcaster = new EventBroadcaster());
