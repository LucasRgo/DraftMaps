import type { DivIcon } from "leaflet";
import type { ComponentType } from "react";
import { View } from "react-native";

import type { MapRendererProps } from "./MapRenderer";

const goianiaCenter: [number, number] = [-16.6864, -49.2643];
const mapZoom = 13;

function isValidCoordinate(value: number): boolean {
    return Number.isFinite(value);
}

type LeafletModules = {
    MapContainer: ComponentType<Record<string, unknown>>;
    Marker: ComponentType<Record<string, unknown>>;
    TileLayer: ComponentType<Record<string, unknown>>;
    divIcon: (options: {
        className: string;
        html: string;
        iconSize: [number, number];
        iconAnchor: [number, number];
    }) => DivIcon;
};

function getLeafletModules(): LeafletModules | null {
    if (typeof window === "undefined") {
        return null;
    }

    const { MapContainer, Marker, TileLayer } = require("react-leaflet") as {
        MapContainer: LeafletModules["MapContainer"];
        Marker: LeafletModules["Marker"];
        TileLayer: LeafletModules["TileLayer"];
    };
    const { divIcon } = require("leaflet") as {
        divIcon: LeafletModules["divIcon"];
    };

    return { MapContainer, Marker, TileLayer, divIcon };
}

function createMarkerIcon(
    divIcon: LeafletModules["divIcon"],
    isSelected: boolean,
) {
    return divIcon({
        className: "draftmaps-marker-shell",
        html: `<span class="draftmaps-marker${
            isSelected ? " draftmaps-marker-selected" : ""
        }"></span>`,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
    });
}

export function MapRenderer({
    locations,
    onSelectLocation,
    selectedLocationId = null,
}: MapRendererProps) {
    const leafletModules = getLeafletModules();
    const validLocations = locations.filter((location) => {
        return (
            isValidCoordinate(location.latitude) &&
            isValidCoordinate(location.longitude)
        );
    });

    if (!leafletModules) {
        return (
            <View className="h-80 items-center justify-center rounded-[28px] border border-slate-800 bg-slate-950 px-6">
                <View className="hidden" />
            </View>
        );
    }

    const { MapContainer, Marker, TileLayer, divIcon } = leafletModules;

    return (
        <View className="overflow-hidden rounded-[28px] border border-slate-800 bg-slate-950">
            <MapContainer
                center={goianiaCenter}
                className="h-80 w-full"
                id="locations-map"
                scrollWheelZoom={false}
                zoom={mapZoom}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {validLocations.map((location) => (
                    <Marker
                        key={location.id}
                        eventHandlers={{
                            click: () => {
                                onSelectLocation(location.id);
                            },
                        }}
                        icon={createMarkerIcon(
                            divIcon,
                            location.id === selectedLocationId,
                        )}
                        position={[location.latitude, location.longitude]}
                    />
                ))}
            </MapContainer>
        </View>
    );
}
