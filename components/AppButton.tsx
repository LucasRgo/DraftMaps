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
            className="rounded-full bg-stone-950 px-5 py-3.5 active:bg-stone-800 disabled:bg-stone-300"
            disabled={disabled}
            onPress={handlePress}
        >
            <Text className="text-center text-base font-semibold text-stone-50">
                {title}
            </Text>
        </Pressable>
    );
}
