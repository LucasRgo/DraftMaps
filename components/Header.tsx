import { Pressable, Text, View } from "react-native";

type HeaderProps = {
    title: string;
    subtitle?: string;
    onBack?: () => void;
};

export function Header({ title, subtitle, onBack }: HeaderProps) {
    if (onBack) {
        return (
            <View className="flex-row items-center justify-between p-5 gap-4 mb-6">
                <Pressable
                    accessibilityLabel="Go back"
                    accessibilityRole="button"
                    className="rounded-full bg-stone-900 px-5 py-3 active:bg-stone-800"
                    onPress={onBack}
                >
                    <Text className="text-center text-sm font-semibold text-stone-50">
                        Back
                    </Text>
                </Pressable>
                <Text className="text-[34px] font-bold tracking-[-1px] text-stone-900">
                    {title}
                </Text>
            </View>
        );
    }

    return (
        <>
            <Text className="text-[34px] font-bold tracking-[-1px] text-stone-900">
                {title}
            </Text>
            {subtitle && (
                <Text className="mt-1 text-base font-serif italic text-stone-500">
                    {subtitle}
                </Text>
            )}
        </>
    );
}
