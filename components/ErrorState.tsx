import { Text, View } from "react-native";

import { AppButton } from "./AppButton";

type ErrorStateProps = {
    message?: string | null;
    onRetry?: () => void;
    retryLabel?: string;
};

const FALLBACK_MESSAGE = "Unable to load places right now.";

export function ErrorState({
    message,
    onRetry,
    retryLabel = "Try again",
}: ErrorStateProps) {
    const normalizedMessage = message?.trim() ? message : FALLBACK_MESSAGE;

    return (
        <View className="flex-1 items-center justify-center rounded-[28px] bg-white px-6 py-10">
            <Text className="text-center text-lg font-semibold text-stone-900">
                Something went wrong
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-stone-600">
                {normalizedMessage}
            </Text>
            {onRetry ? (
                <View className="mt-6">
                    <AppButton onPress={onRetry} title={retryLabel} />
                </View>
            ) : null}
        </View>
    );
}
