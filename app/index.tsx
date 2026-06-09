import { Text, View } from "react-native";

export default function Index() {
    return (
        <View className="flex-1 items-center justify-center bg-slate-900 px-6">
            <Text className="text-4xl font-bold text-slate-200">DraftMaps</Text>
            <Text className="mt-2 text-base text-slate-200">
                Places to chill
            </Text>
        </View>
    );
}
