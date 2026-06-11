import type { Location, LocationCategory } from "../types/location";

const categoryOrder: LocationCategory[] = [
    "park",
    "cafe",
    "library",
    "museum",
    "bookstore",
];

type SelectionOptions = {
    limit?: number;
};

function getLocationDeduplicationKey(location: Location): string {
    return [
        location.name.trim().toLowerCase(),
        location.latitude.toFixed(5),
        location.longitude.toFixed(5),
    ].join(":");
}

function removeDuplicateLocations(locations: Location[]): Location[] {
    const seenKeys = new Set<string>();
    const uniqueLocations: Location[] = [];

    for (const location of locations) {
        const deduplicationKey = getLocationDeduplicationKey(location);

        if (seenKeys.has(deduplicationKey)) {
            continue;
        }

        seenKeys.add(deduplicationKey);
        uniqueLocations.push(location);
    }

    return uniqueLocations;
}

function pickNextRoundRobinLocation(
    locationsByCategory: Map<LocationCategory, Location[]>,
    startIndex: number,
): { location: Location; nextIndex: number } | null {
    for (let offset = 0; offset < categoryOrder.length; offset += 1) {
        const category = categoryOrder[(startIndex + offset) % categoryOrder.length];
        const bucket = locationsByCategory.get(category);
        const nextLocation = bucket?.shift();

        if (nextLocation) {
            return {
                location: nextLocation,
                nextIndex: (startIndex + offset + 1) % categoryOrder.length,
            };
        }
    }

    return null;
}

export function selectLocationsForMap(
    locations: Location[],
    options: SelectionOptions = {},
): Location[] {
    const limit = options.limit ?? 24;

    if (limit <= 0 || locations.length === 0) {
        return [];
    }

    const uniqueLocations = removeDuplicateLocations(locations);
    const locationsByCategory = new Map<LocationCategory, Location[]>();

    for (const category of categoryOrder) {
        locationsByCategory.set(category, []);
    }

    for (const location of uniqueLocations) {
        locationsByCategory.get(location.category)?.push(location);
    }

    const selectedLocations: Location[] = [];
    let categoryIndex = 0;

    while (selectedLocations.length < limit) {
        const pick = pickNextRoundRobinLocation(locationsByCategory, categoryIndex);

        if (!pick) {
            return selectedLocations;
        }

        selectedLocations.push(pick.location);
        categoryIndex = pick.nextIndex;
    }

    return selectedLocations;
}
