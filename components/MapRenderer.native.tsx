import MapView, { Marker } from "react-native-maps";
import { View } from "react-native";

import type { MapRendererProps } from "./MapRenderer";
import { formatLocationCategoryLabel } from "../utils/locationDetails";

const initialRegion = {
    latitude: -16.6864,
    longitude: -49.2643,
    latitudeDelta: 0.12,
    longitudeDelta: 0.12,
};

function isValidCoordinate(value: number): boolean {
    return Number.isFinite(value);
}

export function MapRenderer({
    locations,
    onSelectLocation,
    selectedLocationId = null,
}: MapRendererProps) {
    const validLocations = locations.filter((location) => {
        return (
            isValidCoordinate(location.latitude) &&
            isValidCoordinate(location.longitude)
        );
    });

    return (
        <View className="flex-1 overflow-hidden bg-stone-100">
            <MapView
                initialRegion={initialRegion}
                loadingEnabled
                showsCompass={false}
                toolbarEnabled={false}
                style={{ width: "100%", height: "100%" }}
            >
                {validLocations.map((location) => (
                    <Marker
                        key={location.id}
                        coordinate={{
                            latitude: location.latitude,
                            longitude: location.longitude,
                        }}
                        description={formatLocationCategoryLabel(
                            location.category,
                        )}
                        onPress={() => {
                            onSelectLocation(location.id);
                        }}
                        pinColor={
                            location.id === selectedLocationId
                                ? "#065f46"
                                : "#d97706"
                        }
                        title={location.name}
                    />
                ))}
            </MapView>
        </View>
    );
}
