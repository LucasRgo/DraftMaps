import { isValidCoordinate } from "../types/city";
import type { Location } from "../types/location";
import { fallbackLocations } from "./fallbackLocations";
import { findLocationById } from "./locationLookup";
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

function getLocationIdFromPath(pathname: string): string | null {
    const detailRoutePrefix = "/api/locations/";

    if (!pathname.startsWith(detailRoutePrefix)) {
        return null;
    }

    const pathSegments = pathname.slice(detailRoutePrefix.length).split("/");

    if (pathSegments.length !== 1 || pathSegments[0].length === 0) {
        return null;
    }

    try {
        return decodeURIComponent(pathSegments[0]);
    } catch {
        return null;
    }
}

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

export function jsonResponse(
    body: LocationsResponse | Location | { error: string },
    status = 200,
): Response {
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
            .map((element) =>
                normalizeOverpassElementToLocation(element, "goiania"),
            )
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

    if (url.pathname === "/api/locations") {
        if (request.method !== "GET") {
            return methodNotAllowedResponse();
        }

        return jsonResponse(await getLocationsResponse());
    }

    const locationId = getLocationIdFromPath(url.pathname);

    if (locationId !== null) {
        if (request.method !== "GET") {
            return methodNotAllowedResponse();
        }

        const locationsResponse = await getLocationsResponse();
        const location = findLocationById(
            locationsResponse.locations,
            locationId,
        );

        if (!location) {
            return notFoundResponse();
        }

        return jsonResponse(location);
    }

    return notFoundResponse();
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
