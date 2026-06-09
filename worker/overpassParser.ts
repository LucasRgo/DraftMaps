import { isValidCoordinate, type CitySlug } from "../types/city";
import type { Location, LocationCategory } from "../types/location";

type OverpassValue = number | string;

type OverpassTags = {
  amenity?: string;
  leisure?: string;
  tourism?: string;
  shop?: string;
  name?: string;
  website?: string;
  phone?: string;
  opening_hours?: string;
  "addr:street"?: string;
  "addr:housenumber"?: string;
};

type OverpassCenter = {
  lat?: OverpassValue;
  lon?: OverpassValue;
};

type OverpassElementBase = {
  id: number;
  type: "node" | "way" | "relation";
  tags?: OverpassTags;
};

type OverpassNodeElement = OverpassElementBase & {
  type: "node";
  lat?: OverpassValue;
  lon?: OverpassValue;
};

type OverpassWayOrRelationElement = OverpassElementBase & {
  type: "way" | "relation";
  center?: OverpassCenter;
};

export type OverpassElement = OverpassNodeElement | OverpassWayOrRelationElement;

function parseCoordinate(value: OverpassValue | undefined): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  const parsedValue = Number(trimmedValue);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function getOptionalTagValue(value: string | undefined): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : undefined;
}

export function getElementCoordinates(
  element: OverpassElement,
): { latitude: number; longitude: number } | null {
  const latitudeValue =
    element.type === "node" ? element.lat : element.center?.lat;
  const longitudeValue =
    element.type === "node" ? element.lon : element.center?.lon;

  const latitude = parseCoordinate(latitudeValue);
  const longitude = parseCoordinate(longitudeValue);

  if (latitude === null || longitude === null) {
    return null;
  }

  if (
    !isValidCoordinate(latitude, "latitude") ||
    !isValidCoordinate(longitude, "longitude")
  ) {
    return null;
  }

  return { latitude, longitude };
}

export function getLocationCategory(
  tags: OverpassTags | undefined,
): LocationCategory | null {
  if (!tags) {
    return null;
  }

  if (tags.amenity === "cafe") {
    return "cafe";
  }

  if (tags.amenity === "library") {
    return "library";
  }

  if (tags.tourism === "museum") {
    return "museum";
  }

  if (tags.leisure === "park") {
    return "park";
  }

  if (tags.shop === "books") {
    return "bookstore";
  }

  return null;
}

export function formatAddress(tags: OverpassTags | undefined): string | undefined {
  if (!tags) {
    return undefined;
  }

  const street = getOptionalTagValue(tags["addr:street"]);
  const houseNumber = getOptionalTagValue(tags["addr:housenumber"]);

  if (street && houseNumber) {
    return `${street}, ${houseNumber}`;
  }

  return street ?? houseNumber;
}

export function normalizeOverpassElementToLocation(
  element: OverpassElement,
  citySlug: CitySlug,
): Location | null {
  const name = getOptionalTagValue(element.tags?.name);

  if (!name) {
    return null;
  }

  const coordinates = getElementCoordinates(element);

  if (!coordinates) {
    return null;
  }

  const category = getLocationCategory(element.tags);

  if (!category) {
    return null;
  }

  const location: Location = {
    id: `${citySlug}-${element.type}-${element.id}`,
    name,
    category,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    source: "openstreetmap",
  };

  const address = formatAddress(element.tags);
  const openingHours = getOptionalTagValue(element.tags?.opening_hours);
  const phone = getOptionalTagValue(element.tags?.phone);
  const websiteUrl = getOptionalTagValue(element.tags?.website);

  if (address) {
    location.address = address;
  }

  if (openingHours) {
    location.openingHours = openingHours;
  }

  if (phone) {
    location.phone = phone;
  }

  if (websiteUrl) {
    location.websiteUrl = websiteUrl;
  }

  return location;
}
