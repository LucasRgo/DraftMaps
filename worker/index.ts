import { isValidCoordinate } from "../types/city";
import type { Location } from "../types/location";
import { fallbackLocations } from "./fallbackLocations";

type LocationsResponse = {
  city: "goiania";
  locations: Location[];
};

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

export function handleRequest(request: Request): Response {
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

  return jsonResponse({
    city: "goiania",
    locations: getValidFallbackLocations(),
  });
}

const worker = {
  fetch(request: Request): Response {
    try {
      return handleRequest(request);
    } catch {
      return jsonResponse({ error: "Internal server error" }, 500);
    }
  },
};

export default worker;
