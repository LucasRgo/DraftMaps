import { Pressable, Text, View } from "react-native";

type Props = {
    title?: string;
    message?: string;
    onRetry?: () => void;
};

export function Error({
    title = "Something went wrong",
    message = "Unable to load places right now.",
    onRetry,
}: Props) {
    return (
        <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6 py-10 shadow-sm">
            <Text className="text-center text-lg font-semibold text-stone-900">
                {title}
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-stone-600">
                {message}
            </Text>
            {onRetry && (
                <View className="mt-6">
                    <Pressable
                        accessibilityRole="button"
                        className="rounded-full bg-stone-900 px-5 py-3 active:bg-stone-800"
                        onPress={onRetry}
                    >
                        <Text className="text-center text-sm font-semibold text-stone-50">
                            Try again
                        </Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}
