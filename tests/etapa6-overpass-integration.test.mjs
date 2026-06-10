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
    const compiled = compileTypeScriptFiles("draftmaps-etapa6-worker-", [
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

function createOverpassElement(id, category) {
    const base = {
        id,
        type: "node",
        lat: -16.68 - id / 10000,
        lon: -49.26 - id / 10000,
    };

    if (category === "cafe") {
        return {
            ...base,
            tags: { amenity: "cafe", name: `Cafe ${id}` },
        };
    }

    if (category === "library") {
        return {
            ...base,
            tags: { amenity: "library", name: `Library ${id}` },
        };
    }

    if (category === "museum") {
        return {
            ...base,
            tags: { tourism: "museum", name: `Museum ${id}` },
        };
    }

    if (category === "bookstore") {
        return {
            ...base,
            tags: { shop: "books", name: `Bookstore ${id}` },
        };
    }

    return {
        ...base,
        tags: { leisure: "park", name: `Park ${id}` },
    };
}

test("Etapa 6 builds a Goiânia Overpass query with the required categories", async () => {
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa6-query-",
        path.join(projectRoot, "worker/overpassClient.ts"),
    );

    try {
        const query = module.buildGoianiaOverpassQuery();

        assert.match(query, /-16\.76,-49\.36,-16\.6,-49\.16/);
        assert.match(query, /\["amenity"="cafe"\]/);
        assert.match(query, /\["amenity"="library"\]/);
        assert.match(query, /\["tourism"="museum"\]/);
        assert.match(query, /\["leisure"="park"\]/);
        assert.match(query, /\["shop"="books"\]/);
        assert.match(query, /out center tags/);
    } finally {
        cleanup();
    }
});

test("Etapa 6 sends the Overpass query in the data form field", async () => {
    const originalFetch = globalThis.fetch;
    let requestedUrl = "";
    let requestMethod = "";
    let requestContentType = "";
    let requestHost = "";
    let requestBody = "";

    globalThis.fetch = async (input, init) => {
        requestedUrl = String(input);
        requestMethod = init?.method ?? "";
        requestContentType = String(init?.headers?.["content-type"] ?? "");
        requestHost = String(init?.headers?.host ?? "");
        requestBody = String(init?.body ?? "");

        return new Response(JSON.stringify({ elements: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa6-overpass-request-",
        path.join(projectRoot, "worker/overpassClient.ts"),
    );

    try {
        await module.fetchGoianiaOverpassElements();

        assert.equal(
            requestedUrl,
            "http://65.109.112.52/api/interpreter",
        );
        assert.equal(requestMethod, "POST");
        assert.equal(
            requestContentType,
            "application/x-www-form-urlencoded; charset=utf-8",
        );
        assert.equal(requestHost, "overpass-api.de");
        assert.match(requestBody, /^data=/);
        assert.equal(
            requestBody.includes(encodeURIComponent("[out:json][timeout:8];")),
            true,
        );
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});

test("Etapa 6 retries the next Overpass endpoint when the first one fails", async () => {
    const originalFetch = globalThis.fetch;
    const requestedUrls = [];

    globalThis.fetch = async (input) => {
        requestedUrls.push(String(input));

        if (requestedUrls.length === 1) {
            throw new Error("connect timeout");
        }

        return new Response(JSON.stringify({ elements: [] }), {
            status: 200,
            headers: { "content-type": "application/json" },
        });
    };

    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa6-overpass-fallback-",
        path.join(projectRoot, "worker/overpassClient.ts"),
    );

    try {
        await module.fetchGoianiaOverpassElements();

        assert.deepEqual(requestedUrls, [
            "http://65.109.112.52/api/interpreter",
            "https://overpass-api.de/api/interpreter",
        ]);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});

test("Etapa 6 selectLocationsForMap limits results, balances categories, and removes duplicates", async () => {
    const { module, cleanup } = await importCompiledModule(
        "draftmaps-etapa6-selection-",
        path.join(projectRoot, "worker/locationSelection.ts"),
    );

    try {
        const locations = [
            {
                id: "park-1",
                name: "Bosque",
                category: "park",
                latitude: -16.67,
                longitude: -49.26,
                source: "openstreetmap",
            },
            {
                id: "park-duplicate",
                name: "bosque",
                category: "park",
                latitude: -16.67,
                longitude: -49.26,
                source: "openstreetmap",
            },
            {
                id: "park-2",
                name: "Lago das Rosas",
                category: "park",
                latitude: -16.68,
                longitude: -49.27,
                source: "openstreetmap",
            },
            {
                id: "park-3",
                name: "Vaca Brava",
                category: "park",
                latitude: -16.7,
                longitude: -49.28,
                source: "openstreetmap",
            },
            {
                id: "cafe-1",
                name: "Cafe Centro",
                category: "cafe",
                latitude: -16.69,
                longitude: -49.25,
                source: "openstreetmap",
            },
            {
                id: "library-1",
                name: "Biblioteca Central",
                category: "library",
                latitude: -16.71,
                longitude: -49.24,
                source: "openstreetmap",
            },
            {
                id: "museum-1",
                name: "Museu Central",
                category: "museum",
                latitude: -16.72,
                longitude: -49.23,
                source: "openstreetmap",
            },
        ];

        const selected = module.selectLocationsForMap(locations, { limit: 5 });

        assert.equal(selected.length, 5);
        assert.deepEqual(
            selected.map((location) => location.id),
            ["park-1", "cafe-1", "library-1", "museum-1", "park-2"],
        );
    } finally {
        cleanup();
    }
});

test("Etapa 6 worker returns OpenStreetMap data when Overpass provides at least 10 valid locations", async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () =>
        new Response(
            JSON.stringify({
                elements: [
                    createOverpassElement(1, "park"),
                    createOverpassElement(2, "park"),
                    createOverpassElement(3, "park"),
                    createOverpassElement(4, "park"),
                    createOverpassElement(5, "cafe"),
                    createOverpassElement(6, "cafe"),
                    createOverpassElement(7, "library"),
                    createOverpassElement(8, "museum"),
                    createOverpassElement(9, "bookstore"),
                    createOverpassElement(10, "park"),
                    {
                        id: 99,
                        type: "node",
                        lat: -16.6,
                        lon: -49.2,
                        tags: { leisure: "park" },
                    },
                ],
            }),
            {
                status: 200,
                headers: { "content-type": "application/json" },
            },
        );

    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request("https://example.com/api/locations"),
        );
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(payload.city, "goiania");
        assert.equal(payload.source, "openstreetmap");
        assert.equal(payload.locations.length, 10);
        assert.equal(
            payload.locations.every(
                (location) => location.source === "openstreetmap",
            ),
            true,
        );
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});

test("Etapa 6 worker falls back when Overpass fails or returns too few valid locations", async () => {
    const originalFetch = globalThis.fetch;
    let callCount = 0;

    globalThis.fetch = async () => {
        callCount += 1;

        if (callCount === 1) {
            throw new Error("Overpass unavailable");
        }

        return new Response(
            JSON.stringify({
                elements: [
                    createOverpassElement(1, "park"),
                    createOverpassElement(2, "cafe"),
                    createOverpassElement(3, "library"),
                    createOverpassElement(4, "museum"),
                ],
            }),
            {
                status: 200,
                headers: { "content-type": "application/json" },
            },
        );
    };

    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);

        const failedResponse = await fetchHandler(
            new Request("https://example.com/api/locations"),
        );
        const failedPayload = await failedResponse.json();

        assert.equal(failedResponse.status, 200);
        assert.equal(failedPayload.source, "fallback");
        assert.equal(failedPayload.city, "goiania");
        assert.ok(failedPayload.locations.length > 0);

        const lowCountResponse = await fetchHandler(
            new Request("https://example.com/api/locations"),
        );
        const lowCountPayload = await lowCountResponse.json();

        assert.equal(lowCountResponse.status, 200);
        assert.equal(lowCountPayload.source, "fallback");
        assert.ok(lowCountPayload.locations.length > 0);
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
    }
});
