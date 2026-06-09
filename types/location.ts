export const locationCategories = [
  "cafe",
  "library",
  "museum",
  "park",
  "bookstore",
] as const;

export type LocationCategory = (typeof locationCategories)[number];

export type Location = {
  id: string;
  name: string;
  category: LocationCategory;
  latitude: number;
  longitude: number;
  address?: string;
  openingHours?: string;
  phone?: string;
  websiteUrl?: string;
  source: "openstreetmap" | "fallback";
};

export function isValidLocationCategory(
  value: string,
): value is LocationCategory {
  return locationCategories.includes(value as LocationCategory);
}
