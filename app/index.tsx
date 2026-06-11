import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { MapRenderer } from "../components/MapRenderer";
import { Screen } from "../components/Screen";
import { SelectedLocationCard } from "../components/SelectedLocationCard";
import { useLocations } from "../hooks/useLocations";
import { GOIANIA } from "../types/city";
import type { Location } from "../types/location";
import { getSelectedLocation } from "../utils/homePanel";

type LocationsScreenContentProps = {
    data: Location[];
    error: string | null;
    isLoading: boolean;
    onSelectLocation?: (locationId: string) => void;
    reload: () => void;
    selectedLocationId?: string | null;
};

type MapAndCardProps = {
    locations: Location[];
    selectedLocation: Location | null;
    onSelectLocation?: (locationId: string) => void;
    selectedLocationId?: string | null;
};

function MapAndCard({
    locations,
    selectedLocation,
    onSelectLocation,
    selectedLocationId,
}: MapAndCardProps) {
    function openDetails(locationId: string) {
        router.push({
            pathname: "/locations/[id]",
            params: { id: locationId },
        });
    }

    return (
        <View className="flex-1 overflow-hidden bg-stone-200">
            <MapRenderer
                locations={locations}
                onSelectLocation={(id) => onSelectLocation?.(id)}
                selectedLocationId={selectedLocationId}
            />
            <View className="absolute inset-x-4 bottom-6">
                {selectedLocation ? (
                    <SelectedLocationCard
                        location={selectedLocation}
                        onViewDetails={openDetails}
                    />
                ) : (
                    <View className="rounded-[24px] border border-stone-200 bg-stone-200 px-5 py-5 shadow-lg shadow-stone-900/90">
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                            Choose a place
                        </Text>
                        <Text className="mt-2 text-base leading-6 text-stone-700">
                            Tap a pin to see the details here.
                        </Text>
                    </View>
                )}
            </View>
        </View>
    );
}

export function LocationsScreenContent({
    data,
    error,
    isLoading,
    onSelectLocation,
    reload,
    selectedLocationId = null,
}: LocationsScreenContentProps) {
    const selectedLocation = getSelectedLocation(data, selectedLocationId);

    if (isLoading) {
        return (
            <Screen title="DraftMaps" subtitle={GOIANIA.subtitle}>
                <LoadingState />
            </Screen>
        );
    }

    if (error) {
        return (
            <Screen title="DraftMaps" subtitle={GOIANIA.subtitle}>
                <ErrorState message={error} onRetry={reload} />
            </Screen>
        );
    }

    if (data.length === 0) {
        return (
            <Screen title="DraftMaps" subtitle={GOIANIA.subtitle}>
                <EmptyState />
            </Screen>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-stone-100">
            <View className="px-5 pt-5">
                <Text className="text-[34px] font-bold tracking-[-1px] text-stone-900">
                    DraftMaps
                </Text>
                <Text className="mt-1 text-base font-serif italic text-stone-500">
                    {GOIANIA.subtitle}
                </Text>
            </View>
            <MapAndCard
                locations={data}
                onSelectLocation={onSelectLocation}
                selectedLocation={selectedLocation}
                selectedLocationId={selectedLocationId}
            />
        </SafeAreaView>
    );
}

export default function Index() {
    const locationsState = useLocations();
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(
        null,
    );

    return (
        <LocationsScreenContent
            data={locationsState.data}
            error={locationsState.error}
            isLoading={locationsState.isLoading}
            reload={locationsState.reload}
            selectedLocationId={selectedLocationId}
            onSelectLocation={setSelectedLocationId}
        />
    );
}
