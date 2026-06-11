import type { DivIcon } from "leaflet";
import type { ComponentType } from "react";
import { View } from "react-native";

import type { MapRendererProps } from "./MapRenderer";
import type { Location } from "../types/location";

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

type MapBodyProps = {
    leafletModules: LeafletModules;
    validLocations: Location[];
    onSelectLocation: (locationId: string) => void;
    selectedLocationId: string | null;
};

function MapBody({
    leafletModules,
    validLocations,
    onSelectLocation,
    selectedLocationId,
}: MapBodyProps) {
    const { MapContainer, Marker, TileLayer, divIcon } = leafletModules;

    return (
        <View className="flex-1 overflow-hidden bg-stone-100">
            <MapContainer
                center={goianiaCenter}
                className="h-full w-full"
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
            <View className="flex-1 items-center justify-center bg-stone-100 px-6">
                <View className="hidden" />
            </View>
        );
    }

    return (
        <MapBody
            leafletModules={leafletModules}
            validLocations={validLocations}
            onSelectLocation={onSelectLocation}
            selectedLocationId={selectedLocationId}
        />
    );
}
