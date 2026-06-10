import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const projectRoot = process.cwd();

function compileWorker() {
    const outputDirectory = fs.mkdtempSync(
        path.join(os.tmpdir(), "draftmaps-etapa20-"),
    );

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
                path.join(projectRoot, "worker/index.ts"),
            ],
            {
                cwd: projectRoot,
                stdio: "pipe",
            },
        );

        const compiledWorkerPath = path.join(
            outputDirectory,
            "worker/index.js",
        );

        return {
            cleanup() {
                fs.rmSync(outputDirectory, { recursive: true, force: true });
            },
            moduleUrl: pathToFileURL(compiledWorkerPath).href,
        };
    } catch (error) {
        fs.rmSync(outputDirectory, { recursive: true, force: true });
        throw error;
    }
}

async function loadWorkerModule() {
    const compiledWorker = compileWorker();

    try {
        return {
            cleanup: compiledWorker.cleanup,
            workerModule: await import(compiledWorker.moduleUrl),
        };
    } catch (error) {
        compiledWorker.cleanup();
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

test("Etapa 20 wrangler.jsonc configures assets with SPA fallback and run_worker_first", () => {
    const wranglerConfigPath = path.join(projectRoot, "wrangler.jsonc");
    const wranglerConfigSource = fs.readFileSync(wranglerConfigPath, "utf8");

    assert.match(wranglerConfigSource, /"assets"/);
    assert.match(wranglerConfigSource, /"directory"\s*:\s*"\.\/dist"/);
    assert.match(
        wranglerConfigSource,
        /"not_found_handling"\s*:\s*"single-page-application"/,
    );
    assert.match(
        wranglerConfigSource,
        /"run_worker_first"\s*:\s*\[\s*"\/api\/\*"\s*\]/,
    );
});

test("Etapa 20 worker serves API routes with JSON", async () => {
    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request("https://example.com/api/locations"),
        );
        const payload = await response.json();

        assert.equal(response.status, 200);
        assert.equal(
            response.headers.get("content-type"),
            "application/json; charset=utf-8",
        );
        assert.equal(payload.city, "goiania");
        assert.ok(Array.isArray(payload.locations));
        assert.ok(payload.locations.length > 0);
    } finally {
        cleanup();
    }
});

test("Etapa 20 worker returns 404 JSON for unknown API routes", async () => {
    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request("https://example.com/api/unknown"),
        );
        const payload = await response.json();

        assert.equal(response.status, 404);
        assert.equal(payload.error, "Not found");
    } finally {
        cleanup();
    }
});

test("Etapa 20 worker delegates non-API routes to ASSETS binding", async () => {
    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        let assetsWasCalled = false;
        const mockEnv = {
            ASSETS: {
                async fetch(request) {
                    assetsWasCalled = true;
                    return new Response("<html>app</html>", {
                        headers: { "content-type": "text/html" },
                    });
                },
            },
        };

        const response = await fetchHandler(
            new Request("https://example.com/"),
            mockEnv,
        );

        assert.equal(assetsWasCalled, true);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), "text/html");
    } finally {
        cleanup();
    }
});

test("Etapa 20 worker delegates app routes to ASSETS binding for SPA fallback", async () => {
    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        let assetsWasCalled = false;
        const mockEnv = {
            ASSETS: {
                async fetch(request) {
                    assetsWasCalled = true;
                    return new Response("<html>app</html>", {
                        headers: { "content-type": "text/html" },
                    });
                },
            },
        };

        const response = await fetchHandler(
            new Request("https://example.com/locations/goiania-bosque-dos-buritis"),
            mockEnv,
        );

        assert.equal(assetsWasCalled, true);
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("content-type"), "text/html");
    } finally {
        cleanup();
    }
});

test("Etapa 20 package.json includes build:web and cf scripts", () => {
    const packagePath = path.join(projectRoot, "package.json");
    const packageSource = fs.readFileSync(packagePath, "utf8");
    const packageJson = JSON.parse(packageSource);

    assert.equal(
        packageJson.scripts["build:web"],
        "expo export --platform web",
    );
    assert.ok(
        packageJson.scripts["cf:dev"].includes("npm run build:web"),
        "cf:dev should include build:web",
    );
    assert.ok(
        packageJson.scripts["cf:dev"].includes("wrangler dev"),
        "cf:dev should include wrangler dev",
    );
    assert.ok(
        packageJson.scripts["cf:deploy"].includes("npm run build:web"),
        "cf:deploy should include build:web",
    );
    assert.ok(
        packageJson.scripts["cf:deploy"].includes("wrangler deploy"),
        "cf:deploy should include wrangler deploy",
    );
});
