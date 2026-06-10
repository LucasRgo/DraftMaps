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
            <View className="rounded-3xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-4">
                <Text className="text-sm uppercase tracking-[2px] text-emerald-300">
                    {formatLocationCategoryLabel(location.category)}
                </Text>
                <Text className="mt-2 text-3xl font-bold leading-9 text-slate-50">
                    {location.name}
                </Text>
            </View>

            <View className="rounded-3xl border border-slate-800 bg-slate-950/70 px-4 py-4">
                <Text className="text-sm uppercase tracking-[2px] text-slate-400">
                    Location details
                </Text>

                <View className="mt-4 gap-4">
                    {fields.map((field) => (
                        <View
                            key={field.label}
                            className="border-b border-slate-800 pb-4 last:border-b-0 last:pb-0"
                        >
                            <Text className="text-xs uppercase tracking-[1.5px] text-slate-500">
                                {field.label}
                            </Text>
                            <Text className="mt-1 text-base leading-6 text-slate-100">
                                {field.value}
                            </Text>
                        </View>
                    ))}
                </View>
            </View>
        </View>
    );
}
