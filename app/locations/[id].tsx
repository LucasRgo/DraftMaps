import { router, useLocalSearchParams } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";

import { EmptyState } from "../../components/EmptyState";
import { ErrorState } from "../../components/ErrorState";
import { LoadingState } from "../../components/LoadingState";
import { LocationDetails } from "../../components/LocationDetails";
import { Screen } from "../../components/Screen";
import { useLocation } from "../../hooks/useLocation";
import type { Location } from "../../types/location";
import { resolveLocationIdParam } from "../../utils/locationDetails";

type LocationScreenContentProps = {
    data: Location | null;
    error: string | null;
    isLoading: boolean;
    onBack: () => void;
    reload: () => void;
};

type LocationBodyProps = {
    data: Location | null;
    error: string | null;
    isLoading: boolean;
    reload: () => void;
};

function LocationBody({
    data,
    error,
    isLoading,
    reload,
}: LocationBodyProps) {
    if (isLoading) {
        return <LoadingState message="Loading place details..." />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={reload} />;
    }

    if (!data) {
        return (
            <EmptyState
                title="Location not found"
                message="We could not find details for this place."
            />
        );
    }

    return <LocationDetails location={data} />;
}

export { resolveLocationIdParam };

export function LocationScreenContent({
    data,
    error,
    isLoading,
    onBack,
    reload,
}: LocationScreenContentProps) {
    const header = (
        <View className="flex-row items-center justify-between gap-4">
            <Pressable
                accessibilityLabel="Go back"
                accessibilityRole="button"
                className="rounded-full bg-stone-900 px-5 py-3 active:bg-stone-800"
                onPress={onBack}
            >
                <Text className="text-center text-sm font-semibold text-stone-50">
                    Back
                </Text>
            </Pressable>

            <Text className="text-[34px] font-bold tracking-[-1px] text-stone-900">
                Location
            </Text>
        </View>
    );

    return (
        <Screen header={header}>
            <View className="flex-1">
                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-6"
                >
                    <LocationBody
                        data={data}
                        error={error}
                        isLoading={isLoading}
                        reload={reload}
                    />
                </ScrollView>
            </View>
        </Screen>
    );
}

export default function LocationScreen() {
    const params = useLocalSearchParams<{ id?: string | string[] }>();
    const locationId = resolveLocationIdParam(params.id);
    const locationState = useLocation(locationId);

    function handleBack() {
        if (router.canGoBack()) {
            router.back();
            return;
        }

        router.replace("/");
    }

    return (
        <LocationScreenContent
            data={locationState.data}
            error={locationState.error}
            isLoading={locationState.isLoading}
            onBack={handleBack}
            reload={locationState.reload}
        />
    );
}
