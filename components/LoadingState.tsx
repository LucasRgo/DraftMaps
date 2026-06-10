import { Text, View } from "react-native";

type LoadingStateProps = {
    message?: string;
};

export function LoadingState({
    message = "Loading places...",
}: LoadingStateProps) {
    return (
        <View className="flex-1 items-center justify-center rounded-[28px] bg-white px-6 py-10">
            <Text className="text-center text-base font-medium text-stone-700">
                {message}
            </Text>
        </View>
    );
}
