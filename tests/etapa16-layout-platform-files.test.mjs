import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();

test("Etapa 16 keeps global.css out of the native layout entrypoint", () => {
    const nativeLayoutSource = fs.readFileSync(
        path.join(projectRoot, "app/_layout.tsx"),
        "utf8",
    );

    assert.equal(nativeLayoutSource.includes("global.css"), false);
    assert.equal(nativeLayoutSource.includes("../nativewind.css"), true);
    assert.equal(nativeLayoutSource.includes("headerShown: false"), true);
});

test("Etapa 16 loads global.css from the web-only layout entrypoint", () => {
    const webLayoutPath = path.join(projectRoot, "app/_layout.web.tsx");

    assert.equal(fs.existsSync(webLayoutPath), true);

    const webLayoutSource = fs.readFileSync(webLayoutPath, "utf8");

    assert.equal(webLayoutSource.includes("../global.css"), true);
});

test("Etapa 16 keeps NativeWind input isolated from web-only CSS rules", () => {
    const metroConfigSource = fs.readFileSync(
        path.join(projectRoot, "metro.config.js"),
        "utf8",
    );
    const nativeWindInputPath = path.join(projectRoot, "nativewind.css");

    assert.equal(metroConfigSource.includes('input: "./nativewind.css"'), true);
    assert.equal(fs.existsSync(nativeWindInputPath), true);

    const nativeWindInputSource = fs.readFileSync(nativeWindInputPath, "utf8");

    assert.equal(nativeWindInputSource.includes("@tailwind base;"), true);
    assert.equal(nativeWindInputSource.includes("@tailwind components;"), true);
    assert.equal(nativeWindInputSource.includes("@tailwind utilities;"), true);
    assert.equal(nativeWindInputSource.includes("leaflet"), false);
});

test("Etapa 16 keeps jsxImportSource configured for NativeWind", () => {
    const babelConfigSource = fs.readFileSync(
        path.join(projectRoot, "babel.config.js"),
        "utf8",
    );

    assert.equal(babelConfigSource.includes('jsxImportSource: "nativewind"'), true);
});
