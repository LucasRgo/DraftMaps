import { Pressable, Text, View } from "react-native";

import type { Location } from "../types/location";

type SelectedLocationCardProps = {
    location: Location | null;
    onViewDetails: (locationId: string) => void;
};

export function SelectedLocationCard({
    location,
    onViewDetails,
}: SelectedLocationCardProps) {
    if (!location) {
        return null;
    }

    const categoryLabel =
        location.category[0].toUpperCase() + location.category.slice(1);

    return (
        <View className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-5 shadow-sm shadow-emerald-200/40">
            <View className="gap-1.5">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-emerald-800">
                    Selected place
                </Text>
                <Text className="text-xl font-bold text-stone-900">
                    {location.name}
                </Text>
                <Text className="text-sm font-medium text-emerald-900">
                    {categoryLabel}
                </Text>
            </View>

            <View className="mt-5 self-start">
                <Pressable
                    accessibilityLabel={`View details for ${location.name}`}
                    accessibilityRole="button"
                    className="rounded-full bg-stone-900 px-5 py-3 active:bg-stone-800"
                    onPress={() => onViewDetails(location.id)}
                >
                    <Text className="text-center text-sm font-semibold text-stone-50">
                        View details
                    </Text>
                </Pressable>
            </View>
        </View>
    );
}
