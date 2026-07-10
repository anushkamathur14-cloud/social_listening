export type UberVertical = "rides" | "eats" | "travel" | "cross";

export const VERTICAL_META: Record<
  UberVertical,
  { label: string; color: string; bg: string; border: string }
> = {
  rides: {
    label: "Uber Rides",
    color: "text-white",
    bg: "bg-black",
    border: "border-zinc-700",
  },
  eats: {
    label: "Uber Eats",
    color: "text-emerald-950",
    bg: "bg-emerald-400",
    border: "border-emerald-500/40",
  },
  travel: {
    label: "Uber Travel",
    color: "text-sky-950",
    bg: "bg-sky-400",
    border: "border-sky-500/40",
  },
  cross: {
    label: "Rides + Eats",
    color: "text-zinc-200",
    bg: "bg-zinc-700",
    border: "border-zinc-600",
  },
};

export function verticalFromPersona(
  persona: string,
  productOffer?: string
): UberVertical {
  const offer = (productOffer ?? "").toLowerCase();
  if (offer.includes("eats")) return "eats";
  if (offer.includes("travel") || offer.includes("airport")) return "travel";
  if (offer.includes("cross")) return "cross";

  if (persona === "foodie") return "eats";
  if (persona === "traveler") return "travel";
  return "rides";
}

export function signalVerticalHint(
  signalType: string
): { vertical: UberVertical; hint: string } {
  switch (signalType) {
    case "weather":
      return { vertical: "rides", hint: "Likely UA: Rides safety + Eats stay-in" };
    case "traffic":
      return { vertical: "travel", hint: "Likely UA: Airport rides & travel" };
    case "trends":
      return { vertical: "eats", hint: "Likely UA: Eats or Rides from search spike" };
    case "reddit":
      return { vertical: "cross", hint: "User intent from local threads → Eats or Rides promo" };
    default:
      return { vertical: "rides", hint: "UA: New-user promo" };
  }
}
