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

const locationWithAllFields = {
    id: "goiania-complete-1",
    name: "Lugar Completo",
    category: "cafe",
    latitude: -16.695,
    longitude: -49.275,
    address: "Rua 1, 123",
    openingHours: "08:00-18:00",
    phone: "+55 62 9999-8888",
    websiteUrl: "https://example.com",
    source: "openstreetmap",
};

const locationWithMinimalFields = {
    id: "goiania-minimal-1",
    name: "Lugar Minimal",
    category: "park",
    latitude: -16.69,
    longitude: -49.28,
    source: "fallback",
};

test("Etapa 18 detail integration renders loading state", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-loading-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: null,
                    error: null,
                    isLoading: true,
                    onBack() {},
                    reload() {},
                }),
            );
        });

        assert.deepEqual(getRenderedText(renderer), [
            "Back",
            "Location",
            "Loading place details...",
        ]);
    } finally {
        cleanup();
    }
});

test("Etapa 18 detail integration renders success with all fields", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-success-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: locationWithAllFields,
                    error: null,
                    isLoading: false,
                    onBack() {},
                    reload() {},
                }),
            );
        });

        const text = getRenderedText(renderer);

        assert.ok(text.includes("Cafe"));
        assert.ok(text.includes("Lugar Completo"));
        assert.ok(text.includes("Address"));
        assert.ok(text.includes("Rua 1, 123"));
        assert.ok(text.includes("Opening hours"));
        assert.ok(text.includes("08:00-18:00"));
        assert.ok(text.includes("Phone"));
        assert.ok(text.includes("+55 62 9999-8888"));
        assert.ok(text.includes("Website"));
        assert.ok(text.includes("https://example.com"));
        assert.ok(text.includes("Coordinates"));
        assert.ok(text.includes("-16.69500, -49.27500"));
        assert.ok(text.includes("Data source"));
        assert.ok(text.includes("OpenStreetMap"));
    } finally {
        cleanup();
    }
});

test("Etapa 18 detail integration renders success with minimal fields without crashing", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-minimal-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: locationWithMinimalFields,
                    error: null,
                    isLoading: false,
                    onBack() {},
                    reload() {},
                }),
            );
        });

        const text = getRenderedText(renderer);

        assert.ok(text.includes("Park"));
        assert.ok(text.includes("Lugar Minimal"));
        assert.ok(!text.includes("Address"));
        assert.ok(!text.includes("Opening hours"));
        assert.ok(!text.includes("Phone"));
        assert.ok(!text.includes("Website"));
        assert.ok(text.includes("Coordinates"));
        assert.ok(text.includes("-16.69000, -49.28000"));
        assert.ok(text.includes("Data source"));
        assert.ok(text.includes("Fallback data"));
    } finally {
        cleanup();
    }
});

test("Etapa 18 detail integration renders 404 for missing location", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-404-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: null,
                    error: null,
                    isLoading: false,
                    onBack() {},
                    reload() {},
                }),
            );
        });

        assert.deepEqual(getRenderedText(renderer), [
            "Back",
            "Location",
            "Location not found",
            "We could not find details for this place.",
        ]);
    } finally {
        cleanup();
    }
});

test("Etapa 18 detail integration renders error state with retry", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-error-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let retries = 0;
        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: null,
                    error: "Location service failed",
                    isLoading: false,
                    onBack() {},
                    reload() {
                        retries += 1;
                    },
                }),
            );
        });

        const retryButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "Try again",
        });

        TestRenderer.act(() => {
            retryButton.props.onPress();
        });

        assert.equal(retries, 1);
        assert.deepEqual(getRenderedText(renderer), [
            "Back",
            "Location",
            "Something went wrong",
            "Location service failed",
            "Try again",
        ]);
    } finally {
        cleanup();
    }
});

test("Etapa 18 detail integration calls onBack when back button is pressed", async () => {
    const entryFiles = [
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
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa18-detail-back-",
        entryFiles,
        path.join(projectRoot, "app/locations/[id].tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let backCalls = 0;
        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.LocationScreenContent, {
                    data: locationWithMinimalFields,
                    error: null,
                    isLoading: false,
                    onBack() {
                        backCalls += 1;
                    },
                    reload() {},
                }),
            );
        });

        const backButton = renderer.root.findByProps({
            accessibilityRole: "button",
            accessibilityLabel: "Go back",
        });

        TestRenderer.act(() => {
            backButton.props.onPress();
        });

        assert.equal(backCalls, 1);
    } finally {
        cleanup();
    }
});
