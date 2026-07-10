import { CHANNEL_MAP, type Channel } from "@/lib/channels";
import { toMetaPayload } from "@/lib/deploy/adapters/meta";
import { toSmartlyPayload } from "@/lib/deploy/adapters/smartly";
import type { CreativeVariant } from "@/lib/types";

/** Build the API payload that would be sent on publish (preview). */
export function buildPublishPayloadPreview(
  creative: CreativeVariant,
  budget = 75
): unknown {
  const spec = CHANNEL_MAP[creative.channel as Channel];
  const payload = creative.channelPayload;

  switch (spec.publishAdapter) {
    case "smartly":
      return toSmartlyPayload(creative, budget);
    case "meta":
      return toMetaPayload(creative, budget);
    case "google_ads":
      if (payload?.kind === "search") {
        const normalized = {
          headlines: payload.headlines.map((h) =>
            typeof h === "string" ? h : h.text
          ),
          descriptions: payload.descriptions.map((d) =>
            typeof d === "string" ? d : d.text
          ),
        };
        return {
          adGroup: `signal-${creative.market}`,
          responsiveSearchAd: {
            headlines: normalized.headlines,
            descriptions: normalized.descriptions,
            path1: payload.path1,
            path2: payload.path2,
            finalUrl: creative.attribution,
            displayUrl: payload.displayUrl,
          },
        };
      }
      return {
        adGroup: `signal-${creative.market}`,
        headlines: [creative.headline],
        descriptions: [creative.description ?? creative.copy],
        finalUrl: creative.attribution,
      };
    case "dv360":
      if (payload?.kind === "display") {
        return {
          responsiveDisplayAd: {
            businessName: payload.businessName,
            shortHeadlines: payload.shortHeadlines,
            longHeadlines: payload.longHeadlines,
            descriptions: payload.descriptions,
            marketingImages: [
              {
                url: creative.imageUrl,
                dimensions: `${spec.imageWidth}x${spec.imageHeight}`,
              },
            ],
            clickThroughUrl: creative.attribution,
          },
        };
      }
      return {
        displayName: creative.headline,
        imageUrl: creative.imageUrl,
        clickThroughUrl: creative.attribution,
        dimensions: `${spec.imageWidth}x${spec.imageHeight}`,
      };
    default:
      return { channel: creative.channel, headline: creative.headline };
  }
}
