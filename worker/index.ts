import { GOIANIA } from "../types/city";
import type { Location } from "../types/location";
import { fallbackLocations } from "./fallbackLocations";

const jsonHeaders = {
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8",
};

function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { headers: jsonHeaders, status });
}

function isValidCoordinate(value: number): boolean {
    return Number.isFinite(value);
}

function hasNameAndCoords(location: Location): boolean {
    return (
        location.name.trim().length > 0 &&
        isValidCoordinate(location.latitude) &&
        isValidCoordinate(location.longitude)
    );
}

function buildOverpassQuery(): string {
    const [south, west, north, east] = GOIANIA.bbox;
    const bbox = `${south},${west},${north},${east}`;
    return `[out:json][timeout:8];(node["amenity"="cafe"](${bbox});way["amenity"="cafe"](${bbox});relation["amenity"="cafe"](${bbox});node["amenity"="library"](${bbox});way["amenity"="library"](${bbox});relation["amenity"="library"](${bbox});node["tourism"="museum"](${bbox});way["tourism"="museum"](${bbox});relation["tourism"="museum"](${bbox});node["leisure"="park"](${bbox});way["leisure"="park"](${bbox});relation["leisure"="park"](${bbox});node["shop"="books"](${bbox});way["shop"="books"](${bbox});relation["shop"="books"](${bbox}););out center tags;`;
}

function getCategory(
    tags: Record<string, string>,
): Location["category"] | null {
    if (tags.amenity === "cafe") return "cafe";
    if (tags.amenity === "library") return "library";
    if (tags.tourism === "museum") return "museum";
    if (tags.leisure === "park") return "park";
    if (tags.shop === "books") return "bookstore";
    return null;
}

function getAddress(tags: Record<string, string>): string | undefined {
    const street = tags["addr:street"]?.trim();
    const house = tags["addr:housenumber"]?.trim();
    if (street && house) return `${street}, ${house}`;
    return street || house;
}

function parseElement(element: unknown): Location | null {
    if (typeof element !== "object" || element === null) return null;
    const el = element as Record<string, unknown>;
    const tags = (el.tags || {}) as Record<string, string>;
    const name = tags.name?.trim();
    if (!name) return null;

    let lat: number | undefined;
    let lon: number | undefined;

    if (typeof el.lat === "number") lat = el.lat;
    if (typeof el.lat === "string") lat = Number(el.lat);
    if (typeof el.center === "object" && el.center !== null) {
        const c = el.center as Record<string, unknown>;
        if (typeof c.lat === "number") lat = c.lat;
        if (typeof c.lat === "string") lat = Number(c.lat);
        if (typeof c.lon === "number") lon = c.lon;
        if (typeof c.lon === "string") lon = Number(c.lon);
    }
    if (typeof el.lon === "number") lon = el.lon;
    if (typeof el.lon === "string") lon = Number(el.lon);

    if (
        lat === undefined ||
        lon === undefined ||
        !isValidCoordinate(lat) ||
        !isValidCoordinate(lon)
    )
        return null;

    const category = getCategory(tags);
    if (!category) return null;

    const location: Location = {
        id: `goiania-${el.type as string}-${el.id as number}`,
        name,
        category,
        latitude: lat!,
        longitude: lon!,
        source: "openstreetmap",
    };

    const address = getAddress(tags);
    if (address) location.address = address;
    if (tags.opening_hours) location.openingHours = tags.opening_hours;
    if (tags.phone) location.phone = tags.phone;
    if (tags.website) location.websiteUrl = tags.website;

    return location;
}

async function fetchOverpassLocations(): Promise<Location[]> {
    const response = await fetch("https://z.overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            accept: "*/*",
            "user-agent": "DraftMaps/1.0",
        },
        body: `data=${encodeURIComponent(buildOverpassQuery())}`,
    });

    if (!response.ok) {
        throw new Error(`Overpass failed: ${response.status}`);
    }

    const data = (await response.json()) as { elements?: unknown[] };
    if (!Array.isArray(data.elements)) {
        throw new Error("Invalid overpass response");
    }

    return data.elements
        .map(parseElement)
        .filter((l): l is Location => l !== null)
        .filter(hasNameAndCoords)
        .slice(0, 30);
}

async function getLocations(): Promise<{
    city: "goiania";
    source: "openstreetmap" | "fallback";
    locations: Location[];
}> {
    try {
        const locations = await fetchOverpassLocations();
        if (locations.length >= 10) {
            return { city: "goiania", source: "openstreetmap", locations };
        }
    } catch {
        // Overpass failed, use fallback
    }

    return {
        city: "goiania",
        source: "fallback",
        locations: fallbackLocations.filter(hasNameAndCoords),
    };
}

async function getLocationById(id: string): Promise<Location | null> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) return null;

    const { locations } = await getLocations();
    return locations.find((l) => l.id === trimmedId) || null;
}

export async function handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const pathname = url.pathname;

    if (request.method !== "GET") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    if (pathname === "/api/locations") {
        return jsonResponse(await getLocations());
    }

    if (pathname.startsWith("/api/locations/")) {
        const id = pathname.slice("/api/locations/".length);
        const location = await getLocationById(decodeURIComponent(id));
        if (!location) return jsonResponse({ error: "Not found" }, 404);
        return jsonResponse(location);
    }

    return jsonResponse({ error: "Not found" }, 404);
}

type Env = { ASSETS?: { fetch: (req: Request) => Promise<Response> } };

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);
        if (url.pathname.startsWith("/api/")) {
            try {
                return await handleRequest(request);
            } catch {
                return jsonResponse({ error: "Internal server error" }, 500);
            }
        }
        if (env.ASSETS) {
            return env.ASSETS.fetch(request);
        }
        return jsonResponse({ error: "Not found" }, 404);
    },
};
