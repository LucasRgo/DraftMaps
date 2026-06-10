import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const projectRoot = process.cwd();
const hookTestFiles = [
    path.join(projectRoot, "hooks/useLocations.test.tsx"),
    path.join(projectRoot, "hooks/useLocation.test.tsx"),
];
const sourceFiles = [
    path.join(projectRoot, "hooks/useLocations.ts"),
    path.join(projectRoot, "hooks/useLocation.ts"),
    path.join(projectRoot, "services/locationsApi.ts"),
    path.join(projectRoot, "types/location.ts"),
];

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

        fs.symlinkSync(
            path.join(projectRoot, "node_modules"),
            linkedNodeModules,
            "dir",
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

const compiled = compileTypeScriptFiles("draftmaps-etapa10-hooks-", [
    ...hookTestFiles,
    ...sourceFiles,
]);

process.on("exit", () => {
    compiled.cleanup();
});

for (const sourceFile of hookTestFiles) {
    const relativeSourceFile = path.relative(projectRoot, sourceFile);
    const modulePath = path.join(
        compiled.outputDirectory,
        relativeSourceFile.replace(/\.tsx$/, ".js"),
    );

    await import(pathToFileURL(modulePath).href);
}

test("Etapa 10 hook tests load successfully", () => {
    assert.ok(true);
});
