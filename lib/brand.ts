import { config } from "./config";

/** F&B client brand — snacks, food, beer & beverages */
export const brand = {
  name: config.brandName,
  tagline: "Snacks, meals & craft beer — delivered when you need them",
  initials: config.brandName
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase(),
  categories: ["snacks", "ready-to-eat meals", "craft beer", "beverages", "game-day bundles"],
  personas: [
    { id: "game_day_fan", label: "Game Day Fan" },
    { id: "airport_traveler", label: "Airport Traveler" },
    { id: "comfort_food_lover", label: "Comfort Food Lover" },
  ] as const,
  products: {
    stormKit: "Storm Comfort Box — soups, chips, beer & candles",
    airportPack: "Gate Delay Pack — snacks, beer & soft drinks",
    trendBundle: "Trending Snack Bundle — what's hot in your city",
    redditPick: "Community Cravings Box — inspired by local threads",
    gameDay: "Game Day Bundle — wings, chips, beer 6-pack",
  },
  alcoholDisclaimer: "Must be 21+ to purchase alcohol. Drink responsibly.",
};

export const BRAND_SYSTEM_PROMPT = `You are a senior paid social creative director for "${brand.name}", an F&B delivery brand selling snacks, ready-to-eat food, craft beer, and beverages.

Product catalog includes: ${brand.categories.join(", ")}.
Personas: ${brand.personas.map((p) => p.label).join(", ")}.

Rules:
- Tie every ad to the local signal (weather, delay, trend, Reddit thread) with a relevant food/beverage offer
- Mention specific products (beer 6-packs, snack bundles, comfort food boxes)
- Tone: appetizing, timely, casual — like a friend who knows what's good
- Include responsible drinking note if mentioning beer/alcohol
- No medical or guaranteed claims`;
