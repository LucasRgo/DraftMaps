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
            className={`rounded-[20px] border px-5 py-5 active:opacity-90 ${
                isSelected
                    ? "border-emerald-600 bg-emerald-50 shadow-sm shadow-emerald-200/40"
                    : "border-stone-200 bg-white shadow-sm shadow-stone-300/20"
            }`}
            onPress={onPress}
        >
            <View className="gap-1.5">
                <Text className="text-[17px] font-semibold leading-6 text-stone-900">
                    {location.name}
                </Text>
                <Text className="text-xs font-semibold uppercase tracking-[1px] text-stone-500">
                    {formatLocationCategoryLabel(location.category)}
                </Text>
                <Text
                    className={`text-xs font-medium ${
                        isSelected ? "text-emerald-700" : "text-stone-400"
                    }`}
                >
                    {isSelected ? "Selected" : "Tap to select"}
                </Text>
            </View>
        </Pressable>
    );
}
