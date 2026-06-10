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

test("Etapa 9 probeLocationsApi calls the locations API and reports success", async () => {
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
                source: "fallback",
                locations: [
                    {
                        id: "goiania-node-1",
                        name: "Bosque dos Buritis",
                        category: "park",
                        latitude: -16.67,
                        longitude: -49.26,
                        source: "fallback",
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
        "draftmaps-etapa9-api-probe-",
        servicePath,
    );

    try {
        const message = await module.probeLocationsApi();

        assert.equal(requestedUrl, "https://draftmaps.example/api/locations");
        assert.equal(message, "API OK: 1 location(s) loaded");
    } finally {
        cleanup();
        globalThis.fetch = originalFetch;
        restoreEnv();
    }
});
