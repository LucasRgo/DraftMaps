import { Text, View } from "react-native";

import type { Location } from "../types/location";

type LocationDetailsProps = {
    location: Location;
};

export function LocationDetails({ location }: LocationDetailsProps) {
    const categoryLabel =
        location.category[0].toUpperCase() + location.category.slice(1);

    return (
        <View className="gap-5 p-5">
            <View className="rounded-[24px] border border-emerald-200 bg-emerald-50/80 px-5 py-5">
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-emerald-800">
                    {categoryLabel}
                </Text>
                <Text className="mt-3 text-2xl font-bold leading-8 text-stone-900">
                    {location.name}
                </Text>
            </View>

            <View className="rounded-[24px] border border-stone-200 bg-white px-5 py-5 shadow-sm shadow-stone-300/20">
                <Text className="text-sm font-semibold uppercase tracking-[2px] text-stone-500">
                    Location details
                </Text>

                <View className="mt-5 gap-5">
                    {location.address && (
                        <View className="border-b border-stone-200 pb-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                Address
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-stone-800">
                                {location.address}
                            </Text>
                        </View>
                    )}
                    {location.openingHours && (
                        <View className="border-b border-stone-200 pb-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                Opening hours
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-stone-800">
                                {location.openingHours}
                            </Text>
                        </View>
                    )}
                    {location.phone && (
                        <View className="border-b border-stone-200 pb-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                Phone
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-stone-800">
                                {location.phone}
                            </Text>
                        </View>
                    )}
                    {location.websiteUrl && (
                        <View className="border-b border-stone-200 pb-3">
                            <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                                Website
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-stone-800">
                                {location.websiteUrl}
                            </Text>
                        </View>
                    )}
                    <View className="border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                            Coordinates
                        </Text>
                        <Text className="mt-1 text-base leading-6 text-stone-800">
                            {location.latitude.toFixed(5)},{" "}
                            {location.longitude.toFixed(5)}
                        </Text>
                    </View>
                    <View className="border-b border-stone-200 pb-3 last:border-b-0 last:pb-0">
                        <Text className="text-xs font-semibold uppercase tracking-[1.5px] text-stone-500">
                            Data source
                        </Text>
                        <Text className="mt-1 text-base leading-6 text-stone-800">
                            {location.source === "fallback"
                                ? "Fallback data"
                                : "OpenStreetMap"}
                        </Text>
                    </View>
                </View>
            </View>
        </View>
    );
}
