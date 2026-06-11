import { ActivityIndicator, Text, View } from "react-native";

type LoadingStateProps = {
    message?: string;
};

export function LoadingState({ message }: LoadingStateProps) {
    return (
        <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6 py-10 shadow-sm shadow-stone-300/20">
            <ActivityIndicator size="large" color="#78716c" />
            <View className="mt-4">
                <Text className="text-base font-medium text-stone-700">
                    {message ?? "Loading places..."}
                </Text>
            </View>
        </View>
    );
}
