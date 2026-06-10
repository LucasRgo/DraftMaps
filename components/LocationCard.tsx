import { Pressable, Text, View } from "react-native";

import type { Location, LocationCategory } from "../types/location";

type LocationCardProps = {
    isSelected: boolean;
    location: Location;
    onPress: () => void;
};

function formatCategory(category: LocationCategory): string {
    switch (category) {
        case "bookstore":
            return "Bookstore";
        case "cafe":
            return "Cafe";
        case "library":
            return "Library";
        case "museum":
            return "Museum";
        case "park":
            return "Park";
    }
}

export function LocationCard({
    isSelected,
    location,
    onPress,
}: LocationCardProps) {
    return (
        <Pressable
            accessibilityLabel={`Select ${location.name}`}
            accessibilityRole="button"
            className={`rounded-3xl border px-4 py-4 ${
                isSelected
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-slate-800 bg-slate-950/60"
            }`}
            onPress={onPress}
        >
            <View className="gap-2">
                <Text className="text-lg font-semibold text-slate-100">
                    {location.name}
                </Text>
                <Text className="text-sm uppercase tracking-wide text-slate-300">
                    {formatCategory(location.category)}
                </Text>
                <Text
                    className={`text-sm font-medium ${
                        isSelected ? "text-emerald-300" : "text-slate-400"
                    }`}
                >
                    {isSelected ? "Selected" : "Tap to select"}
                </Text>
            </View>
        </Pressable>
    );
}
