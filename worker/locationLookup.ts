import type { Location } from "../types/location";

export function findLocationById(
    locations: Location[],
    id: string,
): Location | null {
    const normalizedId = id.trim();

    if (normalizedId.length === 0) {
        return null;
    }

    for (const location of locations) {
        if (location.id === normalizedId) {
            return location;
        }
    }

    return null;
}
