import { Text, View } from "react-native";

type Props = {
    title?: string;
    message?: string;
};

export function Empty({
    title = "No places found",
    message = "We could not find places to show right now.",
}: Props) {
    return (
        <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6 py-10 shadow-sm">
            <Text className="text-center text-lg font-semibold text-stone-900">
                {title}
            </Text>
            <Text className="mt-2 text-center text-base leading-6 text-stone-600">
                {message}
            </Text>
        </View>
    );
}
