import { isValidLocationCategory, type Location } from "../types/location";

const DEFAULT_LOCATIONS_API_BASE_URL = "http://127.0.0.1:8787";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null;
}

function getConfiguredBaseUrl(): string | undefined {
    const value = process.env.EXPO_PUBLIC_LOCATIONS_API_BASE_URL;

    if (typeof value !== "string") {
        return undefined;
    }

    const trimmedValue = value.trim();

    return trimmedValue.length > 0 ? trimmedValue : undefined;
}

function removeTrailingSlash(url: string): string {
    return url.replace(/\/+$/, "");
}

function getBrowserOrigin(): string | undefined {
    const { location } = globalThis;

    if (
        !location ||
        typeof location.origin !== "string" ||
        location.origin.trim().length === 0
    ) {
        return undefined;
    }

    return removeTrailingSlash(location.origin);
}

export function resolveLocationsApiBaseUrl(): string {
    const configuredBaseUrl = getConfiguredBaseUrl();

    if (configuredBaseUrl) {
        return removeTrailingSlash(configuredBaseUrl);
    }

    const browserOrigin = getBrowserOrigin();

    if (browserOrigin) {
        return browserOrigin;
    }

    return DEFAULT_LOCATIONS_API_BASE_URL;
}

function getErrorMessage(payload: unknown): string | null {
    if (!isRecord(payload) || typeof payload.error !== "string") {
        return null;
    }

    const message = payload.error.trim();

    return message.length > 0 ? message : null;
}

async function parseJson(response: Response): Promise<unknown> {
    try {
        return await response.json();
    } catch {
        throw new Error("Invalid API response");
    }
}

function parseLocation(value: unknown): Location {
    if (!isRecord(value)) {
        throw new Error("Invalid API response");
    }

    const {
        id,
        name,
        category,
        latitude,
        longitude,
        address,
        openingHours,
        phone,
        websiteUrl,
        source,
    } = value;

    if (
        typeof id !== "string" ||
        typeof name !== "string" ||
        typeof category !== "string" ||
        !isValidLocationCategory(category) ||
        typeof latitude !== "number" ||
        typeof longitude !== "number" ||
        (address !== undefined && typeof address !== "string") ||
        (openingHours !== undefined && typeof openingHours !== "string") ||
        (phone !== undefined && typeof phone !== "string") ||
        (websiteUrl !== undefined && typeof websiteUrl !== "string") ||
        (source !== "openstreetmap" && source !== "fallback")
    ) {
        throw new Error("Invalid API response");
    }

    const location: Location = {
        id,
        name,
        category,
        latitude,
        longitude,
        source,
    };

    if (typeof address === "string") {
        location.address = address;
    }

    if (typeof openingHours === "string") {
        location.openingHours = openingHours;
    }

    if (typeof phone === "string") {
        location.phone = phone;
    }

    if (typeof websiteUrl === "string") {
        location.websiteUrl = websiteUrl;
    }

    return location;
}

async function requestJson(pathname: string): Promise<unknown> {
    let response: Response;

    try {
        response = await fetch(`${resolveLocationsApiBaseUrl()}${pathname}`);
    } catch {
        throw new Error("Unable to reach locations API");
    }

    const payload = await parseJson(response);

    if (!response.ok) {
        if (response.status === 404 && pathname.startsWith("/api/locations/")) {
            throw new Error("Location not found");
        }

        throw new Error(
            getErrorMessage(payload) ??
                `Locations API request failed with status ${response.status}`,
        );
    }

    return payload;
}

export async function fetchLocations(): Promise<Location[]> {
    const payload = await requestJson("/api/locations");

    if (!isRecord(payload) || !Array.isArray(payload.locations)) {
        throw new Error("Invalid API response");
    }

    return payload.locations.map(parseLocation);
}

export async function fetchLocationById(id: string): Promise<Location> {
    const trimmedId = id.trim();

    if (trimmedId.length === 0) {
        throw new Error("Location id is required");
    }

    const payload = await requestJson(
        `/api/locations/${encodeURIComponent(trimmedId)}`,
    );

    return parseLocation(payload);
}

export async function probeLocationsApi(): Promise<string> {
    const locations = await fetchLocations();

    return `API OK: ${locations.length} location(s) loaded`;
}
