import { useState } from "react";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Empty } from "../components/Empty";
import { Error } from "../components/Error";
import { Header } from "../components/Header";
import { Loading } from "../components/Loading";
import { MapRenderer } from "../components/MapRenderer";
import { SelectedLocationCard } from "../components/SelectedLocationCard";
import { useLocations } from "../hooks/useLocations";
import { GOIANIA } from "../types/city";
import type { Location as AppLocation } from "../types/location";

function HomeLayout({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView className="flex-1 bg-stone-100 px-5 py-5">
            <Header title="DraftMaps" subtitle={GOIANIA.subtitle} />
            {children}
        </SafeAreaView>
    );
}

export default function Index() {
    const { data, error, isLoading, reload } = useLocations();
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const selectedLocation =
        data.find((l: AppLocation) => l.id === selectedId) || null;

    function openDetails(id: string) {
        router.push({ pathname: "/locations/[id]", params: { id } });
    }

    if (isLoading) {
        return (
            <HomeLayout>
                <Loading message="Loading places..." />
            </HomeLayout>
        );
    }

    if (error) {
        return (
            <HomeLayout>
                <Error message={error || undefined} onRetry={reload} />
            </HomeLayout>
        );
    }

    if (data.length === 0) {
        return (
            <HomeLayout>
                <Empty
                    title="No places found"
                    message="We could not find places to show right now."
                />
            </HomeLayout>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-stone-100">
            <View className="px-5 pt-5">
                <Header title="DraftMaps" subtitle={GOIANIA.subtitle} />
            </View>
            <View className="flex-1 overflow-hidden bg-stone-200">
                <MapRenderer
                    locations={data}
                    onSelectLocation={setSelectedId}
                    selectedLocationId={selectedId}
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
        </SafeAreaView>
    );
}
