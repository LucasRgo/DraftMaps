import { useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { EmptyState } from "../components/EmptyState";
import { ErrorState } from "../components/ErrorState";
import { LoadingState } from "../components/LoadingState";
import { LocationCard } from "../components/LocationCard";
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

                {selectedLocation ? (
                    <View className="rounded-3xl border border-emerald-400 bg-slate-950 px-4 py-4">
                        <Text className="text-sm uppercase tracking-wide text-emerald-300">
                            Selected place
                        </Text>
                        <Text className="mt-2 text-xl font-semibold text-slate-100">
                            {selectedLocation.name}
                        </Text>
                        <Text className="mt-1 text-sm text-slate-300">
                            {selectedLocation.category.charAt(0).toUpperCase() +
                                selectedLocation.category.slice(1)}
                        </Text>
                    </View>
                ) : null}
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
