import { Text, View } from "react-native";

type LoadingStateProps = {
    message?: string;
};

export function LoadingState({
    message = "Loading places...",
}: LoadingStateProps) {
    return (
        <View className="flex-1 items-center justify-center px-6 py-10">
            <Text className="text-center text-base text-slate-200">
                {message}
            </Text>
        </View>
    );
}
