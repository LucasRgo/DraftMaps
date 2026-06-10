import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
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
            relativeSourceFile.replace(/\.ts$/, ".js"),
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

async function loadWorkerModule() {
    const compiled = compileTypeScriptFiles("draftmaps-etapa7-worker-", [
        path.join(projectRoot, "worker/index.ts"),
    ]);

    try {
        return {
            cleanup: compiled.cleanup,
            workerModule: await import(
                pathToFileURL(
                    path.join(compiled.outputDirectory, "worker/index.js"),
                ).href
            ),
        };
    } catch (error) {
        compiled.cleanup();
        throw error;
    }
}

function getWorkerFetch(workerModule) {
    if (typeof workerModule.default?.fetch === "function") {
        return workerModule.default.fetch.bind(workerModule.default);
    }

    if (typeof workerModule.default?.default?.fetch === "function") {
        return workerModule.default.default.fetch.bind(
            workerModule.default.default,
        );
    }

    throw new Error("Worker fetch handler was not exported");
}

test("Etapa 7 findLocationById returns the first matching location and null for missing ids", async () => {
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa7-lookup-",
        path.join(projectRoot, "worker/locationLookup.ts"),
    );

    try {
        const locations = [
            {
                id: "goiania-node-1",
                name: "Bosque dos Buritis",
                category: "park",
                latitude: -16.67,
                longitude: -49.26,
                source: "openstreetmap",
            },
            {
                id: "goiania-node-1",
                name: "Bosque dos Buritis Duplicate",
                category: "park",
                latitude: -16.68,
                longitude: -49.27,
                source: "openstreetmap",
            },
        ];

        assert.deepEqual(
            module.findLocationById(locations, "goiania-node-1"),
            locations[0],
        );
        assert.equal(
            module.findLocationById(locations, "goiania-node-999"),
            null,
        );
        assert.equal(module.findLocationById(locations, ""), null);
        assert.equal(module.findLocationById([], "goiania-node-1"), null);
    } finally {
        cleanup();
    }
});

test("Etapa 7 worker returns a single fallback location for GET /api/locations/:id when Overpass fails", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
        throw new Error("Overpass unavailable");
    };

    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request(
                "https://example.com/api/locations/goiania-bosque-dos-buritis",
            ),
        );
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.id, "goiania-bosque-dos-buritis");
        assert.equal(payload.name, "Bosque dos Buritis");
        assert.equal(payload.category, "park");
        assert.equal(payload.source, "fallback");
        assert.equal(typeof payload.latitude, "number");
        assert.equal(typeof payload.longitude, "number");
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});

test("Etapa 7 worker returns 404 for unknown ids on GET /api/locations/:id", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => {
        throw new Error("Overpass unavailable");
    };

    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request("https://example.com/api/locations/goiania-node-999"),
        );
        const payload = await response.json();

        assert.equal(response.status, 404);
        assert.equal(payload.error, "Not found");
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});
