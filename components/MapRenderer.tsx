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
        <View className="flex-1 items-center justify-center bg-stone-100 px-6">
            <Text className="text-base font-medium text-stone-700">
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

    const { MapRenderer: NativeMapRenderer } = require("./MapRenderer.native") as {
        MapRenderer: (nativeProps: MapRendererProps) => JSX.Element;
    };

    return <NativeMapRenderer {...props} />;
}
