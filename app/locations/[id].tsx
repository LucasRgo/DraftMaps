import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";

import { AppButton } from "../../components/AppButton";
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

export { resolveLocationIdParam };

export function LocationScreenContent({
    data,
    error,
    isLoading,
    onBack,
    reload,
}: LocationScreenContentProps) {
    function renderContent() {
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

    return (
        <Screen title="Location">
            <View className="flex-1 gap-3">
                <View className="self-start">
                    <AppButton onPress={onBack} title="Back" />
                </View>

                <ScrollView
                    className="flex-1"
                    contentContainerClassName="pb-6"
                >
                    {renderContent()}
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
