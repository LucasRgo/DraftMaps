import { useState } from "react";
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { LocationCard } from "../components/LocationCard";
import { MapRenderer } from "../components/MapRenderer";
import { Screen } from "../components/Screen";
import { SelectedLocationCard } from "../components/SelectedLocationCard";
import { useLocations } from "../hooks/useLocations";
import { GOIANIA } from "../types/city";
import type { Location } from "../types/location";
import {
    getLocationsPanelSummary,
    getLocationsPanelToggleLabel,
    getSelectedLocation,
} from "../utils/homePanel";

type LocationsScreenContentProps = {
    data: Location[];
    error: string | null;
    isLoading: boolean;
    onSelectLocation?: (locationId: string) => void;
    reload: () => void;
    selectedLocationId?: string | null;
};

export function LocationsScreenContent({
    data,
    error,
    isLoading,
    onSelectLocation,
    reload,
    selectedLocationId = null,
}: LocationsScreenContentProps) {
    const [isListOpen, setIsListOpen] = useState(false);
    const selectedLocation = getSelectedLocation(data, selectedLocationId);
    const listToggleLabel = getLocationsPanelToggleLabel(isListOpen);
    const listToggleAccessibilityLabel = isListOpen
        ? "Hide locations list"
        : "Show locations list";
    const panelSummary = getLocationsPanelSummary(
        data.length,
        selectedLocation?.name ?? null,
    );

    function handleSelectLocation(locationId: string) {
        onSelectLocation?.(locationId);
    }

    function openDetails(locationId: string) {
        router.push({
            pathname: "/locations/[id]",
            params: { id: locationId },
        });
    }

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
        <Screen title="DraftMaps" subtitle={GOIANIA.subtitle}>
            <View className="flex-1 gap-5 lg:flex-row">
                <View className="flex-1 overflow-hidden rounded-[24px] border border-stone-200 bg-white px-4 py-4 shadow-md shadow-stone-300/20 lg:flex-1">
                    <View className="mb-4 flex-row items-center justify-between gap-3 px-1">
                        <View className="flex-1 gap-1 pr-3">
                            <Text className="text-sm font-medium text-stone-500">
                                {GOIANIA.name}
                            </Text>
                            <Text className="text-sm leading-5 text-stone-600">
                                {panelSummary}
                            </Text>
                        </View>

                        <Pressable
                            accessibilityLabel={listToggleAccessibilityLabel}
                            accessibilityRole="button"
                            className="rounded-full bg-stone-900 px-4 py-2 active:bg-stone-800"
                            onPress={() => {
                                setIsListOpen((currentValue) => !currentValue);
                            }}
                        >
                            <Text className="text-sm font-semibold text-stone-50">
                                {listToggleLabel}
                            </Text>
                        </Pressable>
                    </View>

                    <MapRenderer
                        locations={data}
                        onSelectLocation={handleSelectLocation}
                        selectedLocationId={selectedLocationId}
                    />
                </View>

                <View className="rounded-[24px] border border-stone-200 bg-white px-5 py-5 shadow-md shadow-stone-300/20 lg:w-[360px]">
                    {selectedLocation ? (
                        <SelectedLocationCard
                            location={selectedLocation}
                            onViewDetails={openDetails}
                        />
                    ) : (
                        <View className="gap-2 rounded-[20px] bg-stone-50 px-4 py-4">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                Choose a place
                            </Text>
                            <Text className="text-base leading-6 text-stone-700">
                                Tap a pin or open the list to pick somewhere calm.
                            </Text>
                        </View>
                    )}

                    {isListOpen ? (
                        <ScrollView
                            className="mt-5"
                            contentContainerClassName="gap-3 pb-1"
                            showsVerticalScrollIndicator={false}
                            style={{ maxHeight: 240 }}
                        >
                            {data.map((location) => (
                                <LocationCard
                                    key={location.id}
                                    isSelected={location.id === selectedLocationId}
                                    location={location}
                                    onPress={() => {
                                        handleSelectLocation(location.id);
                                    }}
                                />
                            ))}
                        </ScrollView>
                    ) : null}
                </View>
            </View>
        </Screen>
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
