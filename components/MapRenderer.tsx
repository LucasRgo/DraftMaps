import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Platform, Text, View } from "react-native";

import type { Location } from "../types/location";

export type MapRendererProps = {
    locations: Location[];
    onSelectLocation: (locationId: string) => void;
    selectedLocationId?: string | null;
};

function MapPlaceholder() {
    return (
        <View className="h-80 items-center justify-center rounded-[28px] border border-slate-800 bg-slate-950 px-6">
            <Text className="text-base font-medium text-slate-100">
                Loading map...
            </Text>
        </View>
    );
}

export function MapRenderer(props: MapRendererProps) {
    const [isClientReady, setIsClientReady] = useState(Platform.OS !== "web");

    useEffect(() => {
        if (Platform.OS !== "web") {
            return;
        }

        setIsClientReady(true);
    }, []);

    if (Platform.OS === "web") {
        if (!isClientReady) {
            return <MapPlaceholder />;
        }

        const { MapRenderer: WebMapRenderer } =
            require("./MapRenderer.web") as {
                MapRenderer: (webProps: MapRendererProps) => JSX.Element;
            };

        return <WebMapRenderer {...props} />;
    }

    return <MapPlaceholder />;
}
