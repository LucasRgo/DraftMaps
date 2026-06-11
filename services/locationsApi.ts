import type { Location } from "../types/location";

const API_URL = process.env.EXPO_PUBLIC_LOCATIONS_API_BASE_URL?.trim() || "http://127.0.0.1:8787";

function getApiUrl(path: string): string {
    const base = API_URL.replace(/\/$/, "");
    return `${base}${path}`;
}

export async function fetchLocations(): Promise<Location[]> {
    const response = await fetch(getApiUrl("/api/locations"));
    if (!response.ok) {
        throw new Error("Failed to load locations");
    }
    const data = (await response.json()) as { locations?: unknown[] };
    if (!Array.isArray(data.locations)) {
        throw new Error("Invalid response");
    }
    return data.locations as Location[];
}

export async function fetchLocationById(id: string): Promise<Location> {
    const trimmedId = id.trim();
    if (trimmedId.length === 0) {
        throw new Error("Location id is required");
    }
    const response = await fetch(getApiUrl(`/api/locations/${encodeURIComponent(trimmedId)}`));
    if (!response.ok) {
        if (response.status === 404) {
            throw new Error("Location not found");
        }
        throw new Error("Failed to load location");
    }
    return response.json() as Promise<Location>;
}
