import type { JSX } from "react";
import { Platform } from "react-native";

import type { Location } from "../types/location";

export type MapRendererProps = {
    locations: Location[];
    onSelectLocation: (locationId: string) => void;
    selectedLocationId?: string | null;
};

export function MapRenderer(props: MapRendererProps): JSX.Element {
    if (Platform.OS === "web") {
        const { MapRenderer: WebMapRenderer } =
            require("./MapRenderer.web") as {
                MapRenderer: (webProps: MapRendererProps) => JSX.Element;
            };
        return <WebMapRenderer {...props} />;
    }

    const { MapRenderer: NativeMapRenderer } =
        require("./MapRenderer.native") as {
            MapRenderer: (nativeProps: MapRendererProps) => JSX.Element;
        };
    return <NativeMapRenderer {...props} />;
}
