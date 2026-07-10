import { config } from "./config";

/** Uber — user acquisition for mobility, food & travel */
export const brand = {
  name: config.brandName,
  tagline: "Go anywhere. Get anything. Move your city.",
  initials: "U",
  verticals: ["Uber Rides", "Uber Eats", "Uber Travel", "Uber Reserve"],
  personas: [
    { id: "daily_commuter", label: "Daily Commuter" },
    { id: "foodie", label: "Foodie" },
    { id: "traveler", label: "Traveler" },
  ] as const,
  offers: {
    ridesFirstTrip: "First ride up to $5 off for new riders",
    eatsNewUser: "Uber Eats — $0 delivery fee on first 3 orders",
    airportPickup: "Airport pickup — 15% off first trip to terminal",
    stormSafety: "Storm alert — ride with Uber, skip the drive",
    trendFood: "Trending restaurants on Uber Eats — new user promo",
    redditLocal: "New users — see current promo in app. Terms apply.",
  },
  promoDisclaimer: "Promo for new users only. Terms apply. Availability varies by city.",
};

export const BRAND_SYSTEM_PROMPT = `You are a senior performance marketing creative director for Uber.

Goal: USER ACQUISITION — drive new sign-ups for the right Uber vertical based on real-time local signals.

Verticals: ${brand.verticals.join(", ")}.
Personas: ${brand.personas.map((p) => p.label).join(", ")}.

Signal → vertical mapping:
- Weather/storm → Uber Rides (safe alternative to driving) OR Uber Eats (stay in, order food)
- Airport/traffic delays → Uber Rides / Uber Reserve to airport, traveler acquisition
- Search trends → match trend to Uber Eats (food) or Uber Rides (travel/mobility)
- Reddit/social → local conversation → relevant vertical + new-user promo

Rules:
- Every ad is a user acquisition play with a clear promo (first ride, $0 delivery, etc.)
- Mention the specific vertical (Uber Eats vs Uber Rides)
- Tone: confident, convenient, urban — Uber brand voice
- Include "Terms apply" or promo disclaimer when offering discounts
- No guaranteed claims`;
