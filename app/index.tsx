import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { probeLocationsApi } from "../services/locationsApi";

export default function Index() {
    const [statusMessage, setStatusMessage] = useState(
        "Toque no botão para testar a API.",
    );
    const [isChecking, setIsChecking] = useState(false);

    async function handleCheckApi() {
        setIsChecking(true);

        try {
            const message = await probeLocationsApi();
            setStatusMessage(message);
        } catch (error) {
            setStatusMessage(
                error instanceof Error
                    ? error.message
                    : "Falha ao chamar a API",
            );
        } finally {
            setIsChecking(false);
        }
    }

    return (
        <View className="flex-1 items-center justify-center bg-slate-900 px-6">
            <Text className="text-4xl font-bold text-slate-200">DraftMaps</Text>
            <Text className="mt-2 text-base text-slate-200">
                Places to chill
            </Text>

            <Pressable
                accessibilityRole="button"
                onPress={handleCheckApi}
                disabled={isChecking}
                className="mt-8 rounded-full bg-emerald-500 px-5 py-3 active:bg-emerald-600 disabled:opacity-60"
            >
                <Text className="text-base font-semibold text-slate-950">
                    {isChecking ? "Testando API..." : "Testar API"}
                </Text>
            </Pressable>

            <Text className="mt-4 text-center text-sm text-slate-300">
                {statusMessage}
            </Text>
        </View>
    );
}
