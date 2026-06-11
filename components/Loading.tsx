import { ActivityIndicator, Text, View } from "react-native";

type Props = {
    message?: string;
};

export function Loading({ message = "Loading..." }: Props) {
    return (
        <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6 py-10 shadow-sm">
            <ActivityIndicator size="large" color="#78716c" />
            <Text className="mt-4 text-base font-medium text-stone-700">
                {message}
            </Text>
        </View>
    );
}
