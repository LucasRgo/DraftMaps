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
        path.join(os.tmpdir(), "draftmaps-etapa4-"),
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

test("Etapa 4 worker serves Goiania fallback locations as JSON", async () => {
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

        for (const location of payload.locations) {
            assert.equal(typeof location.id, "string");
            assert.equal(typeof location.name, "string");
            assert.notEqual(location.name.length, 0);
            assert.equal(typeof location.category, "string");
            assert.equal(typeof location.latitude, "number");
            assert.equal(typeof location.longitude, "number");
        }
    } finally {
        cleanup();
    }
});

test("Etapa 4 worker rejects unsupported methods on the known endpoint", async () => {
    const { workerModule, cleanup } = await loadWorkerModule();

    try {
        const fetchHandler = getWorkerFetch(workerModule);
        const response = await fetchHandler(
            new Request("https://example.com/api/locations", {
                method: "POST",
            }),
        );
        const payload = await response.json();

        assert.equal(response.status, 405);
        assert.equal(payload.error, "Method not allowed");
    } finally {
        cleanup();
    }
});

test("Etapa 4 worker returns 404 for unknown API routes", async () => {
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

test("Etapa 4 wrangler config exists for the worker entrypoint", () => {
    const wranglerConfigPath = path.join(projectRoot, "wrangler.jsonc");

    assert.equal(fs.existsSync(wranglerConfigPath), true);

    const wranglerConfigSource = fs.readFileSync(wranglerConfigPath, "utf8");

    assert.match(wranglerConfigSource, /"main"\s*:\s*"worker\/index\.ts"/);
});
