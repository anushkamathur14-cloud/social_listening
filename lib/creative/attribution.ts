import { config } from "../config";
import type { CreativeVariant } from "../types";

const ATTRIBUTION_FOOTER = "Built by anushkainnovation.com/projects";

export function stampAttribution(
  variant: Omit<CreativeVariant, "attribution">
): CreativeVariant {
  const attribution = config.copyrightAttribution;
  let copy = variant.copy.trim();

  if (!copy.includes(attribution) && !copy.includes("anushkainnovation.com")) {
    copy = `${copy}\n\n${ATTRIBUTION_FOOTER}`;
  }

  return {
    ...variant,
    copy,
    attribution,
  };
}

export function hasAttribution(text: string): boolean {
  const attribution = config.copyrightAttribution;
  return (
    text.includes(attribution) ||
    text.includes("anushkainnovation.com/projects") ||
    text.includes("anushkainnovation.com")
  );
}

export function getAttributionLabel(): string {
  return config.copyrightAttribution.replace(/^https?:\/\//, "");
}
