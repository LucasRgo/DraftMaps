import { Text, View } from "react-native";

import type { Location } from "../types/location";
import { AppButton } from "./AppButton";

type SelectedLocationCardProps = {
    location: Location | null;
    onViewDetails: (locationId: string) => void;
};

function formatCategory(category: Location["category"]): string {
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

export function SelectedLocationCard({
    location,
    onViewDetails,
}: SelectedLocationCardProps) {
    if (!location) {
        return null;
    }

    return (
        <View className="rounded-3xl border border-emerald-400 bg-slate-950 px-4 py-4">
            <Text className="text-sm uppercase tracking-wide text-emerald-300">
                Selected place
            </Text>
            <Text className="mt-2 text-xl font-semibold text-slate-100">
                {location.name}
            </Text>
            <Text className="mt-1 text-sm text-slate-300">
                {formatCategory(location.category)}
            </Text>
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
