import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";

const projectRoot = process.cwd();
const componentTestFiles = [
    path.join(projectRoot, "components/visualStates.test.tsx"),
];
const sourceFiles = [
    path.join(projectRoot, "nativewind-env.d.ts"),
    path.join(projectRoot, "components/AppButton.tsx"),
    path.join(projectRoot, "components/EmptyState.tsx"),
    path.join(projectRoot, "components/ErrorState.tsx"),
    path.join(projectRoot, "components/LoadingState.tsx"),
    path.join(projectRoot, "components/Screen.tsx"),
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

        fs.mkdirSync(linkedNodeModules, { recursive: true });
        fs.symlinkSync(
            path.join(projectRoot, "node_modules/react"),
            path.join(linkedNodeModules, "react"),
            "dir",
        );
        fs.symlinkSync(
            path.join(projectRoot, "node_modules/react-test-renderer"),
            path.join(linkedNodeModules, "react-test-renderer"),
            "dir",
        );
        fs.writeFileSync(
            path.join(linkedNodeModules, "react-native.js"),
            [
                "const React = require('react');",
                "",
                "function createHostComponent(name) {",
                "  return function HostComponent(props) {",
                "    return React.createElement(name, props, props.children);",
                "  };",
                "}",
                "",
                "module.exports = {",
                "  ActivityIndicator: createHostComponent('ActivityIndicator'),",
                "  Pressable: createHostComponent('Pressable'),",
                "  Text: createHostComponent('Text'),",
                "  View: createHostComponent('View'),",
                "};",
                "",
            ].join("\n"),
            "utf8",
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

const compiled = compileTypeScriptFiles("draftmaps-etapa10-components-", [
    ...componentTestFiles,
    ...sourceFiles,
]);

process.on("exit", () => {
    compiled.cleanup();
});

for (const sourceFile of componentTestFiles) {
    const relativeSourceFile = path.relative(projectRoot, sourceFile);
    const modulePath = path.join(
        compiled.outputDirectory,
        relativeSourceFile.replace(/\.tsx$/, ".js"),
    );

    await import(pathToFileURL(modulePath).href);
}

test("Etapa 10 visual component tests load successfully", () => {
    assert.ok(true);
});
