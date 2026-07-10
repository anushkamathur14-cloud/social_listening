import OpenAI from "openai";
import { nanoid } from "nanoid";
import { config } from "../config";
import { getMarketLabel } from "../markets";
import type { CreativeVariant, Market, Signal } from "../types";
import { stampAttribution } from "./attribution";

const PERSONAS = ["commuter", "traveler", "local_shopper"] as const;

interface GeneratedCreative {
  persona: string;
  headline: string;
  copy: string;
  cta: string;
  imagePrompt: string;
}

function buildCreativeBase(
  signal: Signal,
  triggerId: string,
  template: GeneratedCreative
): CreativeVariant {
  const summary = signal.payload.summary as string;
  return stampAttribution({
    id: nanoid(),
    triggerId,
    signalId: signal.id,
    persona: template.persona,
    market: signal.market,
    headline: template.headline,
    copy: template.copy,
    cta: template.cta,
    imagePrompt: template.imagePrompt,
    signalContext: summary,
    signalSummary: summary,
    sourceUrl: signal.payload.sourceUrl as string | undefined,
    sourceLabel: signal.payload.sourceLabel as string | undefined,
    complianceStatus: "pending",
    createdAt: new Date().toISOString(),
  });
}

function redditCopy(signal: Signal): string {
  const topic = (signal.payload.topic as string) ?? "Local conversation trending";
  const snippet = (signal.payload.snippet as string) ?? signal.payload.summary;
  const city = (signal.payload.city as string) ?? getMarketLabel(signal.market);
  return `${city} residents are discussing: "${topic}". ${snippet} We built a response tailored to this moment.`;
}

function mockCreatives(signal: Signal, triggerId: string): CreativeVariant[] {
  const summary = signal.payload.summary as string;
  const marketLabel = getMarketLabel(signal.market);

  const templates: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "commuter",
        headline: "Weather got you stuck?",
        copy: `${marketLabel}: ${summary.split(":").slice(1).join(":").trim() || summary}. Grab essentials delivered in 30 min.`,
        cta: "Shop Now",
        imagePrompt: "Person with umbrella in city rain, warm tones, product placement",
      },
      {
        persona: "local_shopper",
        headline: "Storm prep made easy",
        copy: `${marketLabel} alert — ${summary}. Stock up before shelves empty.`,
        cta: "Get Prepared",
        imagePrompt: "Household essentials on doorstep, stormy sky background",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: "Stuck at the airport?",
        copy: `${summary}. Pass the time with travel essentials — 2-hour terminal delivery in ${marketLabel}.`,
        cta: "Order to Gate",
        imagePrompt: "Airport lounge, traveler with headphones and snacks",
      },
      {
        persona: "commuter",
        headline: "Delays happen. We don't.",
        copy: `While others wait at ${marketLabel} airports: ${summary}. Get essentials delivered now.`,
        cta: "Skip the Wait",
        imagePrompt: "Busy airport departure board, calm shopper on phone",
      },
    ],
    trends: [
      {
        persona: "local_shopper",
        headline: "Trending near you",
        copy: `${marketLabel} is searching: ${summary}. We've got it in stock — act before demand spikes.`,
        cta: "Shop Trending",
        imagePrompt: "Trending product flat lay, social media aesthetic",
      },
      {
        persona: "commuter",
        headline: "What your city wants",
        copy: `Search data shows rising demand in ${marketLabel}. ${summary}. Be first to respond.`,
        cta: "View Trend",
        imagePrompt: "Search trends graph overlay on city map",
      },
    ],
    reddit: [
      {
        persona: "traveler",
        headline: "Reddit thread → ad response",
        copy: redditCopy(signal),
        cta: "See Solutions",
        imagePrompt: "Reddit thread screenshot morphing into product ad card",
      },
      {
        persona: "local_shopper",
        headline: "Your city is talking",
        copy: redditCopy(signal),
        cta: "Shop the Moment",
        imagePrompt: "Social conversation bubbles over city skyline with product",
      },
    ],
    social: [
      {
        persona: "local_shopper",
        headline: "Your city is buzzing",
        copy: `${marketLabel}: ${summary}. Tap into the moment with a locally relevant offer.`,
        cta: "Explore",
        imagePrompt: "City skyline with social notification bubbles",
      },
    ],
  };

  const typeTemplates = templates[signal.type] ?? templates.trends;
  return typeTemplates.map((t) => buildCreativeBase(signal, triggerId, t));
}

export async function generateCreatives(
  signal: Signal,
  triggerId: string
): Promise<CreativeVariant[]> {
  if (!config.openaiApiKey) {
    return mockCreatives(signal, triggerId);
  }

  try {
    const openai = new OpenAI({ apiKey: config.openaiApiKey });
    const summary = signal.payload.summary as string;
    const sourceLabel = signal.payload.sourceLabel ?? "unknown source";

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a paid social creative director. Generate ad variants for Meta/Instagram.
Rules:
- Tone: helpful, urgent but not alarmist
- Headline max 40 chars, primary text max 125 chars
- Reference the specific signal context and city
- No guaranteed claims, no medical claims
- Return JSON: { "variants": [{ "persona", "headline", "copy", "cta", "imagePrompt" }] }
- Generate 3 variants for personas: ${PERSONAS.join(", ")}`,
        },
        {
          role: "user",
          content: `Signal type: ${signal.type}
Market: ${getMarketLabel(signal.market)}
Source: ${sourceLabel}
Context: ${summary}
Topic: ${signal.payload.topic ?? "n/a"}
Snippet: ${signal.payload.snippet ?? "n/a"}
Generate 3 creative variants.`,
        },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return mockCreatives(signal, triggerId);

    const parsed = JSON.parse(content) as { variants: GeneratedCreative[] };

    return parsed.variants.slice(0, 6).map((v) =>
      stampAttribution({
        id: nanoid(),
        triggerId,
        signalId: signal.id,
        persona: v.persona,
        market: signal.market as Market,
        headline: v.headline.slice(0, 40),
        copy: v.copy.slice(0, 200),
        cta: v.cta,
        imagePrompt: v.imagePrompt,
        signalContext: summary,
        signalSummary: summary,
        sourceUrl: signal.payload.sourceUrl as string | undefined,
        sourceLabel: signal.payload.sourceLabel as string | undefined,
        complianceStatus: "pending",
        createdAt: new Date().toISOString(),
      })
    );
  } catch {
    return mockCreatives(signal, triggerId);
  }
}

export async function generateIncrementalVariant(
  winningCreative: CreativeVariant,
  signal: Signal
): Promise<CreativeVariant> {
  const variants = await generateCreatives(signal, winningCreative.triggerId);
  const base = variants[0] ?? mockCreatives(signal, winningCreative.triggerId)[0];

  return stampAttribution({
    ...base,
    id: nanoid(),
    headline: `${winningCreative.headline}`.slice(0, 36) + " v2",
    copy: `Top performer variant: ${winningCreative.copy.slice(0, 80)}... ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
