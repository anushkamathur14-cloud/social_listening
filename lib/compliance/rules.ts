import { config } from "../config";
import { hasAttribution } from "../creative/attribution";
import type { ComplianceResult, CreativeVariant } from "../types";

const BLOCKED_WORDS = [
  "guaranteed",
  "cure",
  "miracle",
  "100% free",
  "no risk",
  "competitor",
];

const WEATHER_DISCLAIMER =
  "Offers subject to availability. Weather conditions may affect delivery.";

export function validateCreative(
  creative: CreativeVariant
): ComplianceResult {
  const violations: string[] = [];
  const autoFixes: string[] = [];

  let copy = creative.copy;
  let headline = creative.headline;

  for (const word of BLOCKED_WORDS) {
    if (copy.toLowerCase().includes(word) || headline.toLowerCase().includes(word)) {
      violations.push(`Blocked word: "${word}"`);
    }
  }

  if (!creative.cta || creative.cta.trim().length === 0) {
    violations.push("Missing CTA");
  }

  if (!hasAttribution(copy)) {
    violations.push("Missing attribution URL");
    copy = `${copy}\n\nBuilt by anushkainnovation.com/projects`;
    autoFixes.push("Appended attribution footer");
  }

  if (headline.length > 40) {
    violations.push(`Headline exceeds 40 chars (${headline.length})`);
    headline = headline.slice(0, 40);
    autoFixes.push("Trimmed headline to 40 chars");
  }

  if (copy.length > 200) {
    violations.push(`Copy exceeds 200 chars (${copy.length})`);
    copy = copy.slice(0, 197) + "...";
    autoFixes.push("Trimmed copy length");
  }

  const isWeatherRelated =
    creative.signalContext.toLowerCase().includes("storm") ||
    creative.signalContext.toLowerCase().includes("weather") ||
    creative.signalContext.toLowerCase().includes("heat") ||
    creative.signalContext.toLowerCase().includes("snow");

  if (isWeatherRelated && !copy.includes("subject to availability")) {
    copy = `${copy} ${WEATHER_DISCLAIMER}`;
    autoFixes.push("Appended weather disclaimer");
  }

  const passed =
    violations.filter((v) => !v.startsWith("Missing attribution")).length === 0 ||
    autoFixes.length > 0;

  const stillBlocked = BLOCKED_WORDS.some(
    (w) => copy.toLowerCase().includes(w) || headline.toLowerCase().includes(w)
  );

  return {
    passed: passed && !stillBlocked,
    violations,
    autoFixes,
    fixedCopy: autoFixes.length > 0 ? copy : undefined,
    fixedHeadline: autoFixes.length > 0 ? headline : undefined,
  };
}

export function applyComplianceFixes(
  creative: CreativeVariant,
  result: ComplianceResult
): CreativeVariant {
  if (!result.passed) {
    return { ...creative, complianceStatus: "blocked" };
  }

  return {
    ...creative,
    copy: result.fixedCopy ?? creative.copy,
    headline: result.fixedHeadline ?? creative.headline,
    attribution: config.copyrightAttribution,
    complianceStatus: result.autoFixes.length > 0 ? "fixed" : "passed",
  };
}
