import { Pressable, Text } from "react-native";

type AppButtonProps = {
    accessibilityLabel?: string;
    disabled?: boolean;
    onPress: () => void;
    title: string;
};

export function AppButton({
    accessibilityLabel,
    disabled = false,
    onPress,
    title,
}: AppButtonProps) {
    function handlePress() {
        if (disabled) {
            return;
        }

        onPress();
    }

    return (
        <Pressable
            accessibilityLabel={accessibilityLabel ?? title}
            accessibilityRole="button"
            className="rounded-full bg-emerald-500 px-5 py-3 active:bg-emerald-600 disabled:opacity-60"
            disabled={disabled}
            onPress={handlePress}
        >
            <Text className="text-center text-base font-semibold text-slate-950">
                {title}
            </Text>
        </Pressable>
    );
}
