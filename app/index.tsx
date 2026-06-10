import { useState } from "react";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { LocationCard } from "../components/LocationCard";
import { SelectedLocationCard } from "../components/SelectedLocationCard";
import { Screen } from "../components/Screen";
import { useLocations } from "../hooks/useLocations";
import type { Location } from "../types/location";

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
    const selectedLocation =
        data.find((location) => location.id === selectedLocationId) ?? null;

    function handleSelectLocation(locationId: string) {
        onSelectLocation?.(locationId);
    }

    let content;

    if (isLoading) {
        content = <LoadingState />;
    } else if (error) {
        content = <ErrorState message={error} onRetry={reload} />;
    } else if (data.length === 0) {
        content = <EmptyState />;
    } else {
        content = (
            <View className="flex-1 gap-4">
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="gap-3 pb-6"
                >
                    {data.map((location) => (
                        <LocationCard
                            key={location.id}
                            location={location}
                            isSelected={location.id === selectedLocationId}
                            onPress={() => {
                                handleSelectLocation(location.id);
                            }}
                        />
                    ))}
                </ScrollView>

                <SelectedLocationCard
                    location={selectedLocation}
                    onViewDetails={(locationId) => {
                        router.push({
                            pathname: "/locations/[id]",
                            params: { id: locationId },
                        });
                    }}
                />
            </View>
        );
    }

    return (
        <Screen title="DraftMaps" subtitle="Places for you to chill">
            {content}
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
