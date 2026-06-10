import { Text, View } from "react-native";

type LoadingStateProps = {
    message?: string;
};

export function LoadingState({
    message = "Loading places...",
}: LoadingStateProps) {
    return (
        <View className="flex-1 items-center justify-center rounded-[24px] bg-white px-6 py-10 shadow-sm shadow-stone-300/20">
            <Text className="text-center text-base font-medium text-stone-700">
                {message}
            </Text>
        </View>
    );
}
