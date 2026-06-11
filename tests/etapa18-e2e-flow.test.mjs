import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

function compileTypeScriptFiles(tempPrefix, entryFiles) {
    const outputDirectory = fs.mkdtempSync(path.join(os.tmpdir(), tempPrefix));
    const linkedNodeModules = path.join(outputDirectory, "node_modules");

    try {
        execFileSync(
            "node_modules/.bin/tsc",
            [
                "--outDir",
                outputDirectory,
                "--rootDir",
                projectRoot,
                "--module",
                "NodeNext",
                "--moduleResolution",
                "NodeNext",
                "--target",
                "ES2022",
                "--jsx",
                "react-jsx",
                "--lib",
                "ES2022,DOM",
                "--skipLibCheck",
                ...entryFiles,
            ],
            {
                cwd: projectRoot,
                stdio: "pipe",
            },
        );

        fs.mkdirSync(linkedNodeModules, { recursive: true });
        fs.symlinkSync(
            path.join(projectRoot, "node_modules/react"),
            path.join(linkedNodeModules, "react"),
            "dir",
        );
        fs.symlinkSync(
            path.join(projectRoot, "node_modules/react-test-renderer"),
            path.join(linkedNodeModules, "react-test-renderer"),
            "dir",
        );
        fs.mkdirSync(path.join(linkedNodeModules, "expo-router"), {
            recursive: true,
        });
        fs.writeFileSync(
            path.join(linkedNodeModules, "expo-router/index.js"),
            [
                "const router = {",
                "  push() {},",
                "  navigate() {},",
                "  replace() {},",
                "  back() {},",
                "  canGoBack() { return false; },",
                "};",
                "",
                "function useRouter() {",
                "  return router;",
                "}",
                "",
                "function useLocalSearchParams() {",
                "  return {};",
                "}",
                "",
                "module.exports = { router, useRouter, useLocalSearchParams };",
                "",
            ].join("\n"),
            "utf8",
        );
        fs.writeFileSync(
            path.join(linkedNodeModules, "react-native.js"),
            [
                "const React = require('react');",
                "",
                "function createHostComponent(name) {",
                "  return function HostComponent(props) {",
                "    return React.createElement(name, props, props.children);",
                "  };",
                "}",
                "",
                "module.exports = {",
                "  ActivityIndicator: createHostComponent('ActivityIndicator'),",
                "  Platform: { OS: 'web', select(options) { return options.web ?? options.default; } },",
                "  Pressable: createHostComponent('Pressable'),",
                "  ScrollView: createHostComponent('ScrollView'),",
                "  Text: createHostComponent('Text'),",
                "  View: createHostComponent('View'),",
                "};",
                "",
            ].join("\n"),
            "utf8",
        );
        fs.mkdirSync(
            path.join(linkedNodeModules, "react-native-safe-area-context"),
            { recursive: true },
        );
        fs.writeFileSync(
            path.join(
                linkedNodeModules,
                "react-native-safe-area-context/index.js",
            ),
            [
                "const React = require('react');",
                "",
                "function SafeAreaView(props) {",
                "  return React.createElement('SafeAreaView', props, props.children);",
                "}",
                "",
                "module.exports = { SafeAreaView };",
                "",
            ].join("\n"),
            "utf8",
        );
        fs.mkdirSync(path.join(linkedNodeModules, "react-leaflet"), {
            recursive: true,
        });
        fs.writeFileSync(
            path.join(linkedNodeModules, "react-leaflet/index.js"),
            [
                "const React = require('react');",
                "",
                "function MapContainer(props) {",
                "  return React.createElement('MapContainer', props, props.children);",
                "}",
                "",
                "function TileLayer(props) {",
                "  return React.createElement('TileLayer', props, props.children);",
                "}",
                "",
                "function Marker(props) {",
                "  return React.createElement('Marker', props, props.children);",
                "}",
                "",
                "module.exports = { MapContainer, TileLayer, Marker };",
                "",
            ].join("\n"),
            "utf8",
        );
        fs.mkdirSync(path.join(linkedNodeModules, "leaflet"), {
            recursive: true,
        });
        fs.writeFileSync(
            path.join(linkedNodeModules, "leaflet/index.js"),
            [
                "function divIcon(options) {",
                "  return { ...options, __type: 'divIcon' };",
                "}",
                "",
                "module.exports = { divIcon };",
                "",
            ].join("\n"),
            "utf8",
        );

        return {
            cleanup() {
                fs.rmSync(outputDirectory, { recursive: true, force: true });
            },
            outputDirectory,
        };
    } catch (error) {
        fs.rmSync(outputDirectory, { recursive: true, force: true });
        throw error;
    }
}

async function importCompiledModule(tempPrefix, entryFiles, sourceFile) {
    const compiled = compileTypeScriptFiles(tempPrefix, entryFiles);

    try {
        const relativeSourceFile = path.relative(projectRoot, sourceFile);
        const modulePath = path.join(
            compiled.outputDirectory,
            relativeSourceFile.replace(/\.(ts|tsx)$/, ".js"),
        );

        return {
            cleanup: compiled.cleanup,
            module: await import(pathToFileURL(modulePath).href),
        };
    } catch (error) {
        compiled.cleanup();
        throw error;
    }
}

function collectText(node) {
    if (typeof node === "string" || typeof node === "number") {
        return String(node);
    }

    if (node == null) {
        return "";
    }

    if (Symbol.iterator in Object(node)) {
        return Array.from(node).map((child) => collectText(child)).join("");
    }

    return collectText(node.props?.children ?? null);
}

function getRenderedText(renderer) {
    return renderer.root.findAllByType("Text").map((textNode) => {
        return collectText(textNode.props.children ?? null);
    });
}

const locations = [
    {
        id: "goiania-park-1",
        name: "Bosque dos Buritis",
        category: "park",
        latitude: -16.67,
        longitude: -49.26,
        source: "openstreetmap",
    },
    {
        id: "goiania-library-1",
        name: "Biblioteca Central",
        category: "library",
        latitude: -16.68,
        longitude: -49.25,
        source: "fallback",
    },
];

test("Etapa 18 E2E web flow: home -> select -> detail -> back", async () => {
    globalThis.window = {};

    const homeEntryFiles = [
        path.join(projectRoot, "app/index.tsx"),
        path.join(projectRoot, "components/AppButton.tsx"),
        path.join(projectRoot, "components/EmptyState.tsx"),
        path.join(projectRoot, "components/ErrorState.tsx"),
        path.join(projectRoot, "components/LoadingState.tsx"),
        path.join(projectRoot, "components/LocationCard.tsx"),
        path.join(projectRoot, "components/MapRenderer.tsx"),
        path.join(projectRoot, "components/MapRenderer.web.tsx"),
        path.join(projectRoot, "components/Screen.tsx"),
        path.join(projectRoot, "components/SelectedLocationCard.tsx"),
        path.join(projectRoot, "hooks/useLocations.ts"),
        path.join(projectRoot, "nativewind-env.d.ts"),
        path.join(projectRoot, "services/locationsApi.ts"),
        path.join(projectRoot, "types/city.ts"),
        path.join(projectRoot, "types/location.ts"),
        path.join(projectRoot, "utils/homePanel.ts"),
        path.join(projectRoot, "utils/locationDetails.ts"),
    ];
    const detailEntryFiles = [
        path.join(projectRoot, "app/locations/[id].tsx"),
        path.join(projectRoot, "components/AppButton.tsx"),
        path.join(projectRoot, "components/EmptyState.tsx"),
        path.join(projectRoot, "components/ErrorState.tsx"),
        path.join(projectRoot, "components/LoadingState.tsx"),
        path.join(projectRoot, "components/LocationDetails.tsx"),
        path.join(projectRoot, "components/Screen.tsx"),
        path.join(projectRoot, "nativewind-env.d.ts"),
        path.join(projectRoot, "types/location.ts"),
        path.join(projectRoot, "utils/locationDetails.ts"),
    ];

    const { module: homeModule, cleanup: cleanupHome } =
        await importCompiledModule(
            "draftmaps-etapa18-e2e-home-",
            homeEntryFiles,
            path.join(projectRoot, "app/index.tsx"),
        );

    const { module: detailModule, cleanup: cleanupDetail } =
        await importCompiledModule(
            "draftmaps-etapa18-e2e-detail-",
            detailEntryFiles,
            path.join(projectRoot, "app/locations/[id].tsx"),
        );

    try {
        const React = (await import("react")).default;
        const { useState } = await import("react");
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let selectedId = null;
        let detailLocation = null;
        let screen = "home";

        function HomeScreen() {
            const [selectedLocationId, setSelectedLocationId] = useState(null);

            return React.createElement(homeModule.LocationsScreenContent, {
                data: locations,
                error: null,
                isLoading: false,
                reload() {},
                selectedLocationId,
                onSelectLocation(id) {
                    setSelectedLocationId(id);
                    selectedId = id;
                },
            });
        }

        function DetailScreen() {
            return React.createElement(
                detailModule.LocationScreenContent,
                {
                    data: detailLocation,
                    error: null,
                    isLoading: false,
                    onBack() {
                        screen = "home";
                    },
                    reload() {},
                },
            );
        }

        function App() {
            if (screen === "home") {
                return React.createElement(HomeScreen);
            }

            return React.createElement(DetailScreen);
        }

        let renderer;

        // 1. App opens on home
        TestRenderer.act(() => {
            renderer = TestRenderer.create(React.createElement(App));
        });

        let text = getRenderedText(renderer);

        assert.ok(text.some((t) => t.includes("DraftMaps")));
        assert.ok(text.some((t) => t.includes("Choose a place")));

        // 2. Select location from map
        const markers = renderer.root.findAllByType("Marker");

        TestRenderer.act(() => {
            markers[0].props.eventHandlers.click();
        });

        text = getRenderedText(renderer);
        assert.ok(text.some((t) => t.includes("Selected place")));
        assert.ok(text.some((t) => t.includes("Bosque dos Buritis")));
        assert.ok(text.some((t) => t.includes("View details")));

        // 4. Open details
        const viewDetailsButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "View details for Bosque dos Buritis",
        });

        detailLocation = locations[0];
        screen = "detail";

        TestRenderer.act(() => {
            renderer.update(React.createElement(App));
        });

        text = getRenderedText(renderer);
        assert.ok(text.some((t) => t.includes("Location")));
        assert.ok(text.some((t) => t.includes("Bosque dos Buritis")));
        assert.ok(text.some((t) => t.includes("Park")));
        assert.ok(text.some((t) => t.includes("Back")));

        // 5. Back to home
        const backButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "Go back",
        });

        TestRenderer.act(() => {
            backButton.props.onPress();
        });

        TestRenderer.act(() => {
            renderer.update(React.createElement(App));
        });

        text = getRenderedText(renderer);
        assert.ok(text.some((t) => t.includes("DraftMaps")));
        assert.ok(text.some((t) => t.includes("Choose a place")));
    } finally {
        cleanupHome();
        cleanupDetail();
        delete globalThis.window;
    }
});
