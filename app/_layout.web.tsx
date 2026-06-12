import "../nativewind.css";
import "../leaflet.css";

import { Stack } from "expo-router";

export default function RootLayout() {
    return <Stack screenOptions={{ headerShown: false }} />;
}
