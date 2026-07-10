import { desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { config } from "../config";
import { db } from "../db/client";
import { signals, triggers } from "../db/schema";
import { broadcaster } from "../events/broadcaster";
import type { Signal, Trigger } from "../types";
import { triggerRules } from "./rules";

const lastFired = new Map<string, number>();

function debounceKey(type: string, market: string): string {
  return `${type}:${market}`;
}

function isDebounced(type: string, market: string): boolean {
  const key = debounceKey(type, market);
  const last = lastFired.get(key);
  if (!last) return false;
  const elapsed = Date.now() - last;
  return elapsed < config.debounceMinutes * 60 * 1000;
}

function markFired(type: string, market: string): void {
  lastFired.set(debounceKey(type, market), Date.now());
}

export async function persistSignal(signal: Signal): Promise<void> {
  await db.insert(signals).values({
    id: signal.id,
    type: signal.type,
    market: signal.market,
    severity: signal.severity,
    payload: JSON.stringify(signal.payload),
    detectedAt: signal.detectedAt,
  });

  broadcaster.emitEvent("signal_detected", {
    signal,
  });
}

export function evaluateSignal(
  signal: Signal,
  options?: { skipDebounce?: boolean }
): Trigger | null {
  if (!options?.skipDebounce && isDebounced(signal.type, signal.market)) {
    return null;
  }

  const matchingRule = triggerRules.find((rule) => {
    if (rule.type !== signal.type) return false;
    if (rule.market && rule.market !== signal.market) return false;
    return rule.evaluate({
      type: signal.type,
      market: signal.market,
      severity: signal.severity,
      payload: signal.payload,
    });
  });

  if (!matchingRule) return null;

  markFired(signal.type, signal.market);

  return {
    id: nanoid(),
    signalId: signal.id,
    type: signal.type,
    market: signal.market,
    rule: matchingRule.description,
    firedAt: new Date().toISOString(),
  };
}

export async function persistTrigger(trigger: Trigger): Promise<void> {
  await db.insert(triggers).values({
    id: trigger.id,
    signalId: trigger.signalId,
    type: trigger.type,
    market: trigger.market,
    rule: trigger.rule,
    firedAt: trigger.firedAt,
  });

  broadcaster.emitEvent("trigger_fired", { trigger });
}

export async function getRecentSignals(limit = 20) {
  return db
    .select()
    .from(signals)
    .orderBy(desc(signals.detectedAt))
    .limit(limit);
}

export async function getRecentTriggers(limit = 20) {
  return db
    .select()
    .from(triggers)
    .orderBy(desc(triggers.firedAt))
    .limit(limit);
}

export async function getSignalById(id: string) {
  const rows = await db.select().from(signals).where(eq(signals.id, id)).limit(1);
  return rows[0] ?? null;
}
