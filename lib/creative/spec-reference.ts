import { CHANNEL_MAP, type Channel } from "../channels";

export const PRODUCTION_CHECKLIST = [
  "Brand guidelines followed",
  "Mobile-first design",
  "Strong hook in first 3 seconds (video)",
  "Clear CTA",
  "Readable typography",
  "Safe margins for Stories/Reels",
  "Multiple headline variants",
  "Multiple image variants",
  "Platform-specific aspect ratios exported",
  "Landing page matches messaging",
  "QA completed (links, spelling, tracking)",
] as const;

export const BRIEF_SECTIONS = [
  "Campaign",
  "Objective",
  "Audience",
  "Insight",
  "Key Message",
  "Value Proposition",
  "Offer",
  "CTA",
  "Landing Page",
  "Required Assets",
  "Dimensions",
  "Variations",
  "UTM Naming",
  "Approval Status",
] as const;

export function platformSpecRows(channel: Channel): Array<{ asset: string; spec: string; note: string }> {
  const s = CHANNEL_MAP[channel];
  switch (channel) {
    case "meta":
    case "smartly":
      return [
        { asset: "Primary Text", spec: `${s.copyTarget}–${s.copyMax} chars`, note: "Hook in first 125 characters" },
        { asset: "Headline", spec: `≤${s.headlineMax} chars`, note: "Benefit-led" },
        { asset: "Description", spec: `≤${s.descriptionMax} chars`, note: "Optional" },
        { asset: "CTA", spec: "Platform CTA", note: "Match landing page" },
        ...(s.imageAssets ?? []).map((img) => ({
          asset: img.label,
          spec: `${img.width} × ${img.height} (${img.aspectRatio})`,
          note: img.notes ?? "",
        })),
      ];
    case "display":
      return [
        { asset: "Short Headline", spec: `≤${s.headlineMax} chars`, note: "Up to 5 variants" },
        { asset: "Long Headline", spec: `≤${s.longHeadlineMax} chars`, note: "Up to 5 variants" },
        { asset: "Description", spec: `≤${s.descriptionMax} chars`, note: "Up to 5 variants" },
        { asset: "Business Name", spec: `≤${s.businessNameMax} chars`, note: "" },
        ...(s.imageAssets ?? []).map((img) => ({
          asset: img.label,
          spec: `${img.width} × ${img.height}`,
          note: img.notes ?? img.aspectRatio,
        })),
      ];
    case "google_search":
      return [
        { asset: "Headlines", spec: `Up to ${s.headlineCount} · ≤${s.headlineMax} chars`, note: "Keyword, brand, offer, CTA, trust" },
        { asset: "Descriptions", spec: `Up to ${s.descriptionCount} · ≤${s.descriptionMax} chars`, note: "Benefit + keyword + CTA" },
        { asset: "Path 1 / Path 2", spec: `≤${s.pathMax} chars each`, note: "Display URL paths" },
        { asset: "Display URL", spec: "www.brand.com", note: "Final URL + paths" },
      ];
    default:
      return [];
  }
}
