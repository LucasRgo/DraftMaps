import { Text, View } from "react-native";

type EmptyStateProps = {
    message?: string;
    title?: string;
};

export function EmptyState({
    message = "We could not find places to show right now.",
    title = "No places found",
}: EmptyStateProps) {
    return (
        <View className="flex-1 items-center justify-center rounded-[28px] bg-stone-50 px-6 py-10">
            <Text className="text-center text-lg font-semibold text-stone-900">
                {title}
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-stone-600">
                {message}
            </Text>
        </View>
    );
}
