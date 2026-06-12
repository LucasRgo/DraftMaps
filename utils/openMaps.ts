import { Linking } from "react-native";

import { buildMapsDirectionsUrl } from "./maps";
import type { Location } from "../types/location";

export function openMapsDirections(location: Location): void {
    const url = buildMapsDirectionsUrl(location.latitude, location.longitude);
    Linking.openURL(url).catch(() => {
        // Silently ignore if the user cancels or no app handles the URL
    });
}
