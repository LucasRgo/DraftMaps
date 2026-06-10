export type CitySlug = "goiania";

export type CityCenter = {
    latitude: number;
    longitude: number;
};

export type CityBoundingBox = [
    south: number,
    west: number,
    north: number,
    east: number,
];

export type City = {
    slug: CitySlug;
    name: string;
    subtitle: string;
    center: CityCenter;
    bbox: CityBoundingBox;
};

export function isValidCoordinate(
    value: number,
    axis: "latitude" | "longitude",
): boolean {
    if (!Number.isFinite(value)) {
        return false;
    }

    if (axis === "latitude") {
        return value >= -90 && value <= 90;
    }

    return value >= -180 && value <= 180;
}

export const GOIANIA: City = {
    slug: "goiania",
    name: "Goiânia",
    subtitle: "Places to chill",
    center: {
        latitude: -16.6869,
        longitude: -49.2648,
    },
    bbox: [-16.76, -49.36, -16.6, -49.16],
};
