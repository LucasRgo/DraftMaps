import { router, useLocalSearchParams } from "expo-router";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Empty } from "../../components/Empty";
import { Error } from "../../components/Error";
import { Header } from "../../components/Header";
import { Loading } from "../../components/Loading";
import { LocationDetails } from "../../components/LocationDetails";
import { useLocation } from "../../hooks/useLocation";

function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace("/");
}

function Screen({ children }: { children: React.ReactNode }) {
    return (
        <SafeAreaView className="flex-1 bg-stone-100 px-5 py-5">
            <Header title="Location" onBack={goBack} />
            {children}
        </SafeAreaView>
    );
}

export default function LocationScreen() {
    const { id } = useLocalSearchParams<{ id?: string | string[] }>();
    const locationId = Array.isArray(id) ? id[0] : id;
    const { data, error, isLoading, reload } = useLocation(locationId ?? "");

    if (isLoading) {
        return (
            <Screen>
                <Loading message="Loading place details..." />
            </Screen>
        );
    }

    if (error) {
        return (
            <Screen>
                <Error message={error || undefined} onRetry={reload} />
            </Screen>
        );
    }

    if (!data) {
        return (
            <Screen>
                <Empty
                    title="Location not found"
                    message="We could not find details for this place."
                />
            </Screen>
        );
    }

    return (
        <Screen>
            <View className="flex-1">
                <ScrollView className="flex-1" contentContainerClassName="pb-6">
                    <LocationDetails location={data} />
                </ScrollView>
            </View>
        </Screen>
    );
}
