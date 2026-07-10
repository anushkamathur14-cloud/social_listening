import OpenAI from "openai";
import { nanoid } from "nanoid";
import { config } from "../config";
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

function mockCreatives(signal: Signal, triggerId: string): CreativeVariant[] {
  const summary = signal.payload.summary as string;
  const market = signal.market;

  const templates: Record<string, GeneratedCreative[]> = {
    weather: [
      {
        persona: "commuter",
        headline: "Weather got you stuck?",
        copy: `Don't let ${summary.split("—")[0].trim()} ruin your day. Grab essentials delivered in 30 min.`,
        cta: "Shop Now",
        imagePrompt: "Person with umbrella in city rain, warm tones, product placement",
      },
      {
        persona: "local_shopper",
        headline: "Storm prep made easy",
        copy: `${market} alert: ${summary}. Stock up before shelves empty.`,
        cta: "Get Prepared",
        imagePrompt: "Household essentials on doorstep, stormy sky background",
      },
    ],
    traffic: [
      {
        persona: "traveler",
        headline: "Stuck at the airport?",
        copy: `${summary}. Pass the time with our travel essentials — free 2-hour delivery to terminals.`,
        cta: "Order to Gate",
        imagePrompt: "Airport lounge, traveler with headphones and snacks",
      },
      {
        persona: "commuter",
        headline: "Delays happen. We don't.",
        copy: `While others wait, get ${market} essentials delivered. ${summary}.`,
        cta: "Skip the Wait",
        imagePrompt: "Busy airport departure board, calm shopper on phone",
      },
    ],
    trends: [
      {
        persona: "local_shopper",
        headline: "Trending near you",
        copy: `Everyone's searching for this — ${summary}. We've got it in stock.`,
        cta: "Shop Trending",
        imagePrompt: "Trending product flat lay, social media aesthetic",
      },
    ],
    reddit: [
      {
        persona: "traveler",
        headline: "Reddit's talking. We're listening.",
        copy: `The conversation: ${summary.slice(0, 120)}... We've got what you need.`,
        cta: "See Solutions",
        imagePrompt: "Social feed overlay with product recommendation",
      },
    ],
    social: [
      {
        persona: "local_shopper",
        headline: "Your city is buzzing",
        copy: `${summary.slice(0, 140)}. Tap into the moment.`,
        cta: "Explore",
        imagePrompt: "City skyline with social notification bubbles",
      },
    ],
  };

  const typeTemplates = templates[signal.type] ?? templates.trends;

  return typeTemplates.map((t) =>
    stampAttribution({
      id: nanoid(),
      triggerId,
      persona: t.persona,
      market,
      headline: t.headline,
      copy: t.copy,
      cta: t.cta,
      imagePrompt: t.imagePrompt,
      signalContext: summary,
      complianceStatus: "pending",
      createdAt: new Date().toISOString(),
    })
  );
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
- Include product tie-in relevant to the signal
- No guaranteed claims, no medical claims
- Return JSON: { "variants": [{ "persona", "headline", "copy", "cta", "imagePrompt" }] }
- Generate 3 variants for personas: ${PERSONAS.join(", ")}`,
        },
        {
          role: "user",
          content: `Signal type: ${signal.type}
Market: ${signal.market}
Context: ${summary}
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
        persona: v.persona,
        market: signal.market as Market,
        headline: v.headline.slice(0, 40),
        copy: v.copy.slice(0, 200),
        cta: v.cta,
        imagePrompt: v.imagePrompt,
        signalContext: summary,
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
    copy: `Based on top performer: ${winningCreative.copy.slice(0, 80)}... ${base.copy}`,
    signalContext: `Incremental winner from ${winningCreative.id}`,
    createdAt: new Date().toISOString(),
  });
}
