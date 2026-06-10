import type { Location } from "../types/location";

export type LocationDetailField = {
    label: string;
    value: string;
};

export function resolveLocationIdParam(
    value: string | string[] | undefined,
): string {
    if (typeof value === "string") {
        return value;
    }

    if (Array.isArray(value)) {
        return value[0] ?? "";
    }

    return "";
}

export function formatLocationCategoryLabel(category: string): string {
    switch (category) {
        case "bookstore":
            return "Bookstore";
        case "cafe":
            return "Cafe";
        case "library":
            return "Library";
        case "museum":
            return "Museum";
        case "park":
            return "Park";
        default:
            return "Place";
    }
}

export function formatLocationCoordinates(
    latitude: number,
    longitude: number,
): string {
    return `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
}

export function formatLocationSourceLabel(source: Location["source"]): string {
    if (source === "fallback") {
        return "Fallback data";
    }

    return "OpenStreetMap";
}

export function getLocationDetailFields(
    location: Pick<
        Location,
        | "address"
        | "latitude"
        | "longitude"
        | "openingHours"
        | "phone"
        | "source"
        | "websiteUrl"
    >,
): LocationDetailField[] {
    const fields: LocationDetailField[] = [];

    if (location.address) {
        fields.push({
            label: "Address",
            value: location.address,
        });
    }

    if (location.openingHours) {
        fields.push({
            label: "Opening hours",
            value: location.openingHours,
        });
    }

    if (location.phone) {
        fields.push({
            label: "Phone",
            value: location.phone,
        });
    }

    if (location.websiteUrl) {
        fields.push({
            label: "Website",
            value: location.websiteUrl,
        });
    }

    fields.push({
        label: "Coordinates",
        value: formatLocationCoordinates(location.latitude, location.longitude),
    });
    fields.push({
        label: "Data source",
        value: formatLocationSourceLabel(location.source),
    });

    return fields;
}
