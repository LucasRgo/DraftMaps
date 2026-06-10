import { Text, View } from "react-native";

import type { Location } from "../types/location";
import { formatLocationCategoryLabel } from "../utils/locationDetails";
import { AppButton } from "./AppButton";

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

    return (
        <View className="rounded-[24px] border border-emerald-200 bg-emerald-50 px-4 py-4">
            <View className="gap-2">
                <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-emerald-800">
                    Selected place
                </Text>
                <Text className="text-2xl font-semibold text-stone-900">
                    {location.name}
                </Text>
                <Text className="text-sm font-medium text-emerald-900">
                    {formatLocationCategoryLabel(location.category)}
                </Text>
            </View>

            <View className="mt-4 self-start">
                <AppButton
                    accessibilityLabel={`View details for ${location.name}`}
                    onPress={() => {
                        onViewDetails(location.id);
                    }}
                    title="View details"
                />
            </View>
        </View>
    );
}
