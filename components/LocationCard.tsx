import { Pressable, Text, View } from "react-native";

import type { Location } from "../types/location";
import { formatLocationCategoryLabel } from "../utils/locationDetails";

type LocationCardProps = {
    isSelected: boolean;
    location: Location;
    onPress: () => void;
};

export function LocationCard({
    isSelected,
    location,
    onPress,
}: LocationCardProps) {
    return (
        <Pressable
            accessibilityLabel={`Select ${location.name}`}
            accessibilityRole="button"
            className={`rounded-[24px] border px-4 py-4 active:opacity-90 ${
                isSelected
                    ? "border-emerald-700 bg-emerald-50"
                    : "border-stone-200 bg-stone-50"
            }`}
            onPress={onPress}
        >
            <View className="gap-2">
                <Text className="text-lg font-semibold leading-7 text-stone-900">
                    {location.name}
                </Text>
                <Text className="text-sm font-medium text-stone-600">
                    {formatLocationCategoryLabel(location.category)}
                </Text>
                <Text
                    className={`text-sm font-medium ${
                        isSelected ? "text-emerald-800" : "text-stone-500"
                    }`}
                >
                    {isSelected ? "Selected" : "Tap to select"}
                </Text>
            </View>
        </Pressable>
    );
}
