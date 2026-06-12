import { fallbackLocations } from "../utils/fallbackLocations";
import type { Location } from "../types/location";

const API_URL =
    process.env.EXPO_PUBLIC_LOCATIONS_API_BASE_URL?.trim() ||
    "http://127.0.0.1:8787";

function url(path: string): string {
    return `${API_URL.replace(/\/$/, "")}${path}`;
}

export async function fetchLocations(): Promise<Location[]> {
    const u = url("/api/locations");
    console.log("[API] GET", u);

    try {
        const res = await fetch(u);
        console.log("[API] GET", u, "→", res.status);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = (await res.json()) as { locations?: unknown[] };
        if (!Array.isArray(data.locations)) throw new Error("bad response");
        return data.locations as Location[];
    } catch (err) {
        console.error("[API] GET", u, "→", err);
        return fallbackLocations;
    }
}

export async function fetchLocationById(id: string): Promise<Location> {
    const trimmed = id.trim();
    if (!trimmed) throw new Error("Location id is required");

    const u = url(`/api/locations/${encodeURIComponent(trimmed)}`);
    console.log("[API] GET", u);

    try {
        const res = await fetch(u);
        console.log("[API] GET", u, "→", res.status);
        if (!res.ok) {
            const fb = fallbackLocations.find((l) => l.id === trimmed);
            if (fb) return fb;
            if (res.status === 404) throw new Error("Location not found");
            throw new Error("HTTP " + res.status);
        }
        return res.json() as Promise<Location>;
    } catch (err) {
        console.error("[API] GET", u, "→", err);
        const fb = fallbackLocations.find((l) => l.id === trimmed);
        if (fb) return fb;
        if (err instanceof Error && err.message === "Location not found") throw err;
        throw new Error("Failed to load location");
    }
}
