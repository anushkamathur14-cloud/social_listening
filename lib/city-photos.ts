import type { Market, SignalType } from "./types";

/** Verified working photos from https://images.unsplash.com/ (HEAD-checked) */
export interface CityPhoto {
  id: string;
  alt: string;
  credit: string;
}

const VERIFIED = {
  nycSkyline: {
    id: "photo-1496442226666-8d4d0e62e6e9",
    alt: "New York City skyline",
    credit: "Charles Postiaux",
  },
  laStreet: {
    id: "photo-1449157291145-7efd050a4d0e",
    alt: "Los Angeles street",
    credit: "Jorge Alcala",
  },
  chicago: {
    id: "photo-1477959858617-67f85cf4f1df",
    alt: "Chicago cityscape",
    credit: "Pedro Lastra",
  },
  cityStreet: {
    id: "photo-1449824913935-59a10b8d2000",
    alt: "City street at dusk",
    credit: "Benjamin Combs",
  },
  airport: {
    id: "photo-1436491865332-7a61a109cc05",
    alt: "Airport terminal",
    credit: "John McArthur",
  },
  travel: {
    id: "photo-1488646953014-85cb44e25828",
    alt: "Travel and luggage",
    credit: "Annie Spratt",
  },
  foodSpread: {
    id: "photo-1504674900247-0877df9cc836",
    alt: "Restaurant food spread",
    credit: "Eaters Collective",
  },
  restaurant: {
    id: "photo-1517248135467-4c7edcad34c4",
    alt: "Restaurant interior",
    credit: "Jakob Dalbjörn",
  },
  takeout: {
    id: "photo-1555939594-58d7cb561ad1",
    alt: "Takeout food",
    credit: "Chad Montano",
  },
  pizza: {
    id: "photo-1565299624946-b28f40a0ae38",
    alt: "Pizza delivery",
    credit: "Eiliv Aceron",
  },
  dining: {
    id: "photo-1555396273-367ea4eb4db5",
    alt: "Restaurant dining",
    credit: "Eaters Collective",
  },
  deepDish: {
    id: "photo-1552566626-52f8b828add9",
    alt: "Chicago-style pizza",
    credit: "Timothy Miles",
  },
  rooftop: {
    id: "photo-1559339352-11d035aa65de",
    alt: "Rooftop dining",
    credit: "Thomas Verbruggen",
  },
} as const;

export const FALLBACK_IMAGE = VERIFIED.cityStreet;

export const CITY_PHOTOS: Record<
  Market,
  { rides: CityPhoto; eats: CityPhoto; travel: CityPhoto; weather: CityPhoto }
> = {
  NYC: {
    rides: VERIFIED.nycSkyline,
    eats: VERIFIED.dining,
    travel: VERIFIED.airport,
    weather: VERIFIED.nycSkyline,
  },
  LAX: {
    rides: VERIFIED.laStreet,
    eats: VERIFIED.rooftop,
    travel: VERIFIED.travel,
    weather: VERIFIED.chicago,
  },
  ORD: {
    rides: VERIFIED.chicago,
    eats: VERIFIED.deepDish,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
  SEA: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.restaurant,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
  SFO: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.foodSpread,
    travel: VERIFIED.travel,
    weather: VERIFIED.chicago,
  },
  MIA: {
    rides: VERIFIED.laStreet,
    eats: VERIFIED.rooftop,
    travel: VERIFIED.travel,
    weather: VERIFIED.chicago,
  },
  BOS: {
    rides: VERIFIED.nycSkyline,
    eats: VERIFIED.restaurant,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
  AUS: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.takeout,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
  ATL: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.foodSpread,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
  DFW: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.takeout,
    travel: VERIFIED.travel,
    weather: VERIFIED.chicago,
  },
  US: {
    rides: VERIFIED.cityStreet,
    eats: VERIFIED.foodSpread,
    travel: VERIFIED.airport,
    weather: VERIFIED.chicago,
  },
};

export function pickCityPhoto(
  market: Market | undefined,
  signalType: SignalType,
  persona: string
): CityPhoto {
  const city = market && CITY_PHOTOS[market] ? CITY_PHOTOS[market] : CITY_PHOTOS.US;

  if (signalType === "weather") {
    return persona === "foodie" ? city.eats : city.weather;
  }
  if (signalType === "traffic") {
    return persona === "traveler" ? city.travel : city.rides;
  }
  if (signalType === "trends") {
    return persona === "foodie" ? city.eats : city.rides;
  }
  if (signalType === "reddit" || signalType === "social") {
    if (persona === "foodie") return city.eats;
    if (persona === "traveler") return city.travel;
    return city.rides;
  }
  return city.rides;
}

export function unsplashImageUrl(
  photo: CityPhoto,
  width: number,
  height: number
): string {
  return `https://images.unsplash.com/${photo.id}?auto=format&fit=crop&w=${width}&h=${height}&q=85`;
}
