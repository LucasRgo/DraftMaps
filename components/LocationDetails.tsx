import { Text, View } from "react-native";

import type { Location } from "../types/location";
import {
    formatLocationCategoryLabel,
    getLocationDetailFields,
} from "../utils/locationDetails";

type LocationDetailsProps = {
    location: Location;
};

export function LocationDetails({ location }: LocationDetailsProps) {
    const fields = getLocationDetailFields(location);

    return (
        <View className="gap-4">
            <View className="rounded-[32px] border border-emerald-200 bg-emerald-50 px-5 py-5">
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-emerald-800">
                    {formatLocationCategoryLabel(location.category)}
                </Text>
                <Text className="mt-2 text-3xl font-bold leading-9 text-stone-900">
                    {location.name}
                </Text>
            </View>

            <View className="rounded-[32px] border border-stone-200 bg-white px-5 py-5">
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-stone-500">
                    Location details
                </Text>

                <View className="mt-4 gap-4">
                    {fields.map((field) => (
                        <View
                            key={field.label}
                            className="border-b border-stone-200 pb-4 last:border-b-0 last:pb-0"
                        >
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                {field.label}
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-stone-800">
                                {field.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}
