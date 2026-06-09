import { isValidCoordinate } from "../types/city";
import type { Location } from "../types/location";
import { fallbackLocations } from "./fallbackLocations";
import { selectLocationsForMap } from "./locationSelection";
import { fetchGoianiaOverpassElements } from "./overpassClient";
import { normalizeOverpassElementToLocation } from "./overpassParser";

type LocationsResponse = {
  city: "goiania";
  source: "openstreetmap" | "fallback";
  locations: Location[];
};

const MIN_OVERPASS_LOCATIONS = 10;

const jsonHeaders = {
  "access-control-allow-origin": "*",
  "content-type": "application/json; charset=utf-8",
};

function isValidLocation(location: Location): boolean {
  return (
    location.name.trim().length > 0 &&
    isValidCoordinate(location.latitude, "latitude") &&
    isValidCoordinate(location.longitude, "longitude")
  );
}

function getValidFallbackLocations(): Location[] {
  return fallbackLocations.filter(isValidLocation);
}

export function jsonResponse(body: LocationsResponse | { error: string }, status = 200): Response {
  return new Response(JSON.stringify(body), {
    headers: jsonHeaders,
    status,
  });
}

export function notFoundResponse(): Response {
  return jsonResponse({ error: "Not found" }, 404);
}

export function methodNotAllowedResponse(): Response {
  return jsonResponse({ error: "Method not allowed" }, 405);
}

async function getLocationsResponse(): Promise<LocationsResponse> {
  try {
    const overpassElements = await fetchGoianiaOverpassElements();
    const normalizedLocations = overpassElements
      .map((element) => normalizeOverpassElementToLocation(element, "goiania"))
      .filter((location): location is Location => location !== null)
      .filter(isValidLocation);
    const selectedLocations = selectLocationsForMap(normalizedLocations);

    if (selectedLocations.length >= MIN_OVERPASS_LOCATIONS) {
      return {
        city: "goiania",
        source: "openstreetmap",
        locations: selectedLocations,
      };
    }
  } catch {
    // External API failures must not break the endpoint.
  }

  return {
    city: "goiania",
    source: "fallback",
    locations: getValidFallbackLocations(),
  };
}

export async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url);

  if (!url.pathname.startsWith("/api/")) {
    return notFoundResponse();
  }

  if (url.pathname !== "/api/locations") {
    return notFoundResponse();
  }

  if (request.method !== "GET") {
    return methodNotAllowedResponse();
  }

  return jsonResponse(await getLocationsResponse());
}

const worker = {
  async fetch(request: Request): Promise<Response> {
    try {
      return await handleRequest(request);
    } catch {
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  },
};

export default worker;
