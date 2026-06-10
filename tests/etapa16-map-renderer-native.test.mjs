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
                "  Platform: { OS: 'ios', select(options) { return options.ios ?? options.native ?? options.default; } },",
                "  Text: createHostComponent('Text'),",
                "  View: createHostComponent('View'),",
                "};",
                "",
            ].join("\n"),
            "utf8",
        );
        fs.mkdirSync(path.join(linkedNodeModules, "react-native-maps"), {
            recursive: true,
        });
        fs.writeFileSync(
            path.join(linkedNodeModules, "react-native-maps/index.js"),
            [
                "const React = require('react');",
                "",
                "function MapView(props) {",
                "  return React.createElement('MapView', props, props.children);",
                "}",
                "",
                "function Marker(props) {",
                "  return React.createElement('Marker', props, props.children);",
                "}",
                "",
                "module.exports = MapView;",
                "module.exports.Marker = Marker;",
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

test("Etapa 16 native map renders markers, keeps Goiânia region, and selects a location", async () => {
    const entryFiles = [
        path.join(projectRoot, "nativewind-env.d.ts"),
        path.join(projectRoot, "components/MapRenderer.tsx"),
        path.join(projectRoot, "components/MapRenderer.native.tsx"),
        path.join(projectRoot, "types/location.ts"),
    ];
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa16-map-renderer-native-",
        entryFiles,
        path.join(projectRoot, "components/MapRenderer.tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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
                id: "invalid-location",
                name: "Sem coordenada",
                category: "park",
                latitude: Number.NaN,
                longitude: -49.25,
                source: "fallback",
            },
        ];
        const selectCalls = [];
        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.MapRenderer, {
                    locations,
                    onSelectLocation(locationId) {
                        selectCalls.push(locationId);
                    },
                    selectedLocationId: "goiania-park-1",
                }),
            );
        });

        const mapView = renderer.root.findByType("MapView");
        const markers = renderer.root.findAllByType("Marker");

        assert.deepEqual(mapView.props.initialRegion, {
            latitude: -16.6864,
            longitude: -49.2643,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
        });
        assert.equal(markers.length, 1);
        assert.deepEqual(markers[0].props.coordinate, {
            latitude: -16.67,
            longitude: -49.26,
        });
        assert.equal(markers[0].props.pinColor, "#f97316");

        TestRenderer.act(() => {
            markers[0].props.onPress();
        });

        assert.deepEqual(selectCalls, ["goiania-park-1"]);
    } finally {
        cleanup();
    }
});

test("Etapa 16 native map renders empty and centered with no locations", async () => {
    const entryFiles = [
        path.join(projectRoot, "nativewind-env.d.ts"),
        path.join(projectRoot, "components/MapRenderer.tsx"),
        path.join(projectRoot, "components/MapRenderer.native.tsx"),
        path.join(projectRoot, "types/location.ts"),
    ];
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa16-map-renderer-native-empty-",
        entryFiles,
        path.join(projectRoot, "components/MapRenderer.tsx"),
    );

    try {
        const React = (await import("react")).default;
        const TestRenderer = await import("react-test-renderer");

        globalThis.IS_REACT_ACT_ENVIRONMENT = true;

        let renderer;

        TestRenderer.act(() => {
            renderer = TestRenderer.create(
                React.createElement(module.MapRenderer, {
                    locations: [],
                    onSelectLocation() {},
                    selectedLocationId: null,
                }),
            );
        });

        const mapView = renderer.root.findByType("MapView");
        const markers = renderer.root.findAllByType("Marker");

        assert.deepEqual(mapView.props.initialRegion, {
            latitude: -16.6864,
            longitude: -49.2643,
            latitudeDelta: 0.12,
            longitudeDelta: 0.12,
        });
        assert.equal(markers.length, 0);
    } finally {
        cleanup();
    }
});
