import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();
const servicePath = path.join(projectRoot, "services/locationsApi.ts");

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
    const compiled = compileTypeScriptFiles(tempPrefix, [
        sourceFile,
        path.join(projectRoot, "types/location.ts"),
    ]);

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

function setEnv(env) {
    const originalProcess = globalThis.process;
    globalThis.process = {
        env,
    };

    return () => {
        globalThis.process = originalProcess;
    };
}

test("Etapa 8 provides the app locations service source file", () => {
    assert.equal(fs.existsSync(servicePath), true);
});

test("Etapa 8 fetchLocations returns a typed array and uses the configured base URL", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    let requestedUrl = "";

    globalThis.fetch = async (input) => {
        requestedUrl = String(input);

        return new Response(
            JSON.stringify({
                city: "goiania",
                source: "openstreetmap",
                locations: [
                    {
                        id: "goiania-node-1",
                        name: "Bosque dos Buritis",
                        category: "park",
                        latitude: -16.67,
                        longitude: -49.26,
                        source: "openstreetmap",
                    },
                ],
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-list-",
        servicePath,
    );

    try {
        const locations = await module.fetchLocations();

        assert.equal(requestedUrl, "https://draftmaps.example/api/locations");
        assert.deepEqual(locations, [
            {
                id: "goiania-node-1",
                name: "Bosque dos Buritis",
                category: "park",
                latitude: -16.67,
                longitude: -49.26,
                source: "openstreetmap",
            },
        ]);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 fetchLocations returns an empty array when the Worker returns locations: []", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
        new Response(
            JSON.stringify({
                city: "goiania",
                source: "fallback",
                locations: [],
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-empty-",
        servicePath,
    );

    try {
        const locations = await module.fetchLocations();

        assert.deepEqual(locations, []);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 fetchLocationById returns a single location and encodes the id in the URL", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    let requestedUrl = "";

    globalThis.fetch = async (input) => {
        requestedUrl = String(input);

        return new Response(
            JSON.stringify({
                id: "goiania-node-1",
                name: "Biblioteca Central",
                category: "library",
                latitude: -16.68,
                longitude: -49.25,
                source: "openstreetmap",
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-detail-",
        servicePath,
    );

    try {
        const location = await module.fetchLocationById("goiania node/1");

        assert.equal(
            requestedUrl,
            "https://draftmaps.example/api/locations/goiania%20node%2F1",
        );
        assert.deepEqual(location, {
            id: "goiania-node-1",
            name: "Biblioteca Central",
            category: "library",
            latitude: -16.68,
            longitude: -49.25,
            source: "openstreetmap",
        });
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 fetchLocationById throws a controlled error for 404 responses", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: "Not found" }), {
            status: 404,
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-404-",
        servicePath,
    );

    try {
        await assert.rejects(
            module.fetchLocationById("goiania-node-999"),
            /Location not found/i,
        );
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 service turns Worker 500 responses into readable errors", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
        new Response(JSON.stringify({ error: "Internal server error" }), {
            status: 500,
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-500-",
        servicePath,
    );

    try {
        await assert.rejects(module.fetchLocations(), /Internal server error/i);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 service throws a controlled error for invalid JSON responses", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;

    globalThis.fetch = async () =>
        new Response("{ invalid json", {
            status: 200,
            headers: {
                "content-type": "application/json; charset=utf-8",
            },
        });

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-invalid-json-",
        servicePath,
    );

    try {
        await assert.rejects(module.fetchLocations(), /Invalid API response/i);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 service falls back to the local Worker URL in development when the base URL env var is absent", async () => {
    const restoreEnv = setEnv({});
    const originalFetch = globalThis.fetch;
    let requestedUrl = "";

    globalThis.fetch = async (input) => {
        requestedUrl = String(input);

        return new Response(
            JSON.stringify({
                city: "goiania",
                source: "fallback",
                locations: [],
            }),
            {
                status: 200,
                headers: {
                    "content-type": "application/json; charset=utf-8",
                },
            },
        );
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-dev-base-url-",
        servicePath,
    );

    try {
        await module.fetchLocations();

        assert.equal(requestedUrl, "http://127.0.0.1:8787/api/locations");
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});

test("Etapa 8 service rejects empty ids before calling fetch", async () => {
    const restoreEnv = setEnv({
        EXPO_PUBLIC_LOCATIONS_API_BASE_URL: "https://draftmaps.example",
    });
    const originalFetch = globalThis.fetch;
    let fetchCalled = false;

    globalThis.fetch = async () => {
        fetchCalled = true;

        return new Response("{}", { status: 200 });
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa8-service-empty-id-",
        servicePath,
    );

    try {
        await assert.rejects(
            module.fetchLocationById("   "),
            /Location id is required/i,
        );
        assert.equal(fetchCalled, false);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});
