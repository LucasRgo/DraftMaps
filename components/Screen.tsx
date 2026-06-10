import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ScreenProps = {
    children: ReactNode;
    subtitle?: string;
    title?: string;
};

export function Screen({ children, subtitle, title }: ScreenProps) {
    return (
        <SafeAreaView className="flex-1 bg-stone-100">
            <View className="flex-1 px-5 py-4">
                {title ? (
                    <View className="mb-4">
                        <Text className="text-[34px] font-bold tracking-[-1px] text-stone-900">
                            {title}
                        </Text>
                        {subtitle ? (
                            <Text className="mt-1 text-base text-stone-600">
                                {subtitle}
                            </Text>
                        ) : null}
                    </View>
                ) : null}
                <View className="flex-1">{children}</View>
            </View>
        </SafeAreaView>
    );
}
