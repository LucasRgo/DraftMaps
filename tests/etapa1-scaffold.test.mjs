import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const projectRoot = process.cwd();

function readFile(relativePath) {
    return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("Etapa 1 scaffold matches the required base contract", () => {
    const packageJson = JSON.parse(readFile("package.json"));
    const tsconfig = JSON.parse(readFile("tsconfig.json"));
    const layoutSource = readFile("app/_layout.tsx");
    const indexSource = readFile("app/index.tsx");

    assert.equal(packageJson.scripts.start, "expo start");
    assert.equal(packageJson.scripts.web, "expo start --web");
    assert.equal(packageJson.scripts.typecheck, "tsc --noEmit");

    assert.equal(tsconfig.compilerOptions.strict, true);
    assert.match(String(packageJson.dependencies.expo), /^~54\./);

    assert.match(layoutSource, /<Stack/);
    assert.match(indexSource, /DraftMaps/);

    for (const directory of [
        "app",
        "components",
        "hooks",
        "services",
        "types",
        "utils",
        "worker",
    ]) {
        assert.equal(
            fs.existsSync(path.join(projectRoot, directory)),
            true,
            `${directory} should exist`,
        );
    }
});
