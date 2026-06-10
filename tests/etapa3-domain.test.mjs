import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";

const projectRoot = process.cwd();

function fileExists(relativePath) {
    return fs.existsSync(path.join(projectRoot, relativePath));
}

function readFile(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function runTypecheck(entryFileContents) {
    const tempDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "draftmaps-etapa3-"),
    );
    const entryPath = path.join(tempDirectory, "entry.ts");

    fs.writeFileSync(entryPath, entryFileContents);

    try {
        execFileSync(
            "node_modules/.bin/tsc",
            [
                "--noEmit",
                "--strict",
                "--target",
                "ES2020",
                "--allowImportingTsExtensions",
                "--module",
                "NodeNext",
                "--moduleResolution",
                "NodeNext",
                "--skipLibCheck",
                entryPath,
            ],
            {
                cwd: projectRoot,
                stdio: "pipe",
            },
        );
    } finally {
        fs.rmSync(tempDirectory, { recursive: true, force: true });
    }
}

test("Etapa 3 provides the core domain files", () => {
    for (const relativePath of [
        "types/location.ts",
        "types/city.ts",
        "worker/fallbackLocations.ts",
    ]) {
        assert.equal(
            fileExists(relativePath),
            true,
            `${relativePath} should exist`,
        );
    }
});

test("Etapa 3 domain is importable and models Goiania with typed fallback data", () => {
    runTypecheck(`
import { GOIANIA, isValidCoordinate } from "${path.join(projectRoot, "types/city.ts")}";
import { fallbackLocations } from "${path.join(projectRoot, "worker/fallbackLocations.ts")}";
import type { Location, LocationCategory } from "${path.join(projectRoot, "types/location.ts")}";

const category: LocationCategory = "park";
const firstLocation: Location = fallbackLocations[0];

if (category !== "park") {
  throw new Error("Category should stay typed");
}

if (GOIANIA.slug !== "goiania") {
  throw new Error("Initial city slug should be goiania");
}

if (GOIANIA.name !== "Goiânia") {
  throw new Error("Initial city name should be Goiânia");
}

if (GOIANIA.bbox.length !== 4) {
  throw new Error("Bounding box should expose four coordinates");
}

if (fallbackLocations.length === 0) {
  throw new Error("Fallback locations should not be empty");
}

if (firstLocation.source !== "fallback") {
  throw new Error("Fallback entries should use fallback source");
}

if (!isValidCoordinate(firstLocation.latitude, "latitude")) {
  throw new Error("Fallback latitude should be valid");
}

if (!isValidCoordinate(firstLocation.longitude, "longitude")) {
  throw new Error("Fallback longitude should be valid");
}
`);
});

test("Etapa 3 source files keep the category union constrained to MVP scope", () => {
    const locationSource = readFile("types/location.ts");

    assert.match(locationSource, /"cafe"/);
    assert.match(locationSource, /"library"/);
    assert.match(locationSource, /"museum"/);
    assert.match(locationSource, /"park"/);
    assert.match(locationSource, /"bookstore"/);
    assert.doesNotMatch(locationSource, /"restaurant"/);
});
