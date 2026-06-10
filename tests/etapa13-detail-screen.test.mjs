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
                "--lib",
                "ES2022,DOM",
                "--jsx",
                "react-jsx",
                "--skipLibCheck",
                ...entryFiles,
            ],
            {
                cwd: projectRoot,
                stdio: "pipe",
            },
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

async function importCompiledModule(tempPrefix, sourceFile) {
    const compiled = compileTypeScriptFiles(tempPrefix, [sourceFile]);

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

test("Etapa 13 location detail helpers format optional fields and fallback labels safely", async () => {
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa13-location-detail-utils-",
        path.join(projectRoot, "utils/locationDetails.ts"),
    );

    try {
        assert.equal(module.formatLocationCategoryLabel("library"), "Library");
        assert.equal(module.formatLocationCategoryLabel("unknown"), "Place");
        assert.equal(
            module.formatLocationCoordinates(-16.68, -49.25),
            "-16.68000, -49.25000",
        );
        assert.equal(
            module.formatLocationSourceLabel("openstreetmap"),
            "OpenStreetMap",
        );
        assert.equal(
            module.formatLocationSourceLabel("fallback"),
            "Fallback data",
        );
        assert.deepEqual(
            module.getLocationDetailFields({
                id: "goiania-library-1",
                name: "Biblioteca Estadual com um nome bem longo para teste",
                category: "library",
                latitude: -16.68,
                longitude: -49.25,
                address: "Rua 1, Centro, Goiânia - GO",
                openingHours: "Mon-Fri 08:00-18:00",
                phone: "+55 62 3333-4444",
                websiteUrl: "https://example.com/library",
                source: "openstreetmap",
            }),
            [
                {
                    label: "Address",
                    value: "Rua 1, Centro, Goiânia - GO",
                },
                {
                    label: "Opening hours",
                    value: "Mon-Fri 08:00-18:00",
                },
                {
                    label: "Phone",
                    value: "+55 62 3333-4444",
                },
                {
                    label: "Website",
                    value: "https://example.com/library",
                },
                {
                    label: "Coordinates",
                    value: "-16.68000, -49.25000",
                },
                {
                    label: "Data source",
                    value: "OpenStreetMap",
                },
            ],
        );
        assert.deepEqual(
            module.getLocationDetailFields({
                id: "goiania-unknown-1",
                name: "Lugar sem extras",
                category: "unknown",
                latitude: -16.7,
                longitude: -49.3,
                source: "fallback",
            }),
            [
                {
                    label: "Coordinates",
                    value: "-16.70000, -49.30000",
                },
                {
                    label: "Data source",
                    value: "Fallback data",
                },
            ],
        );
    } finally {
        cleanup();
    }
});

test("Etapa 13 detail route helper resolves ids from Expo Router params", async () => {
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa13-location-detail-utils-route-",
        path.join(projectRoot, "utils/locationDetails.ts"),
    );

    try {
        assert.equal(
            module.resolveLocationIdParam("goiania-park-1"),
            "goiania-park-1",
        );
        assert.equal(
            module.resolveLocationIdParam(["goiania-park-1", "extra"]),
            "goiania-park-1",
        );
        assert.equal(module.resolveLocationIdParam([]), "");
        assert.equal(module.resolveLocationIdParam(undefined), "");
    } finally {
        cleanup();
    }
});
