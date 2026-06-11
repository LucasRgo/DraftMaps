// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
    expoConfig,
    {
        ignores: ["dist/*"],
        rules: {
            indent: ["error", 4],
            complexity: ["error", 10],
            "max-depth": ["error", 3],
            "max-lines-per-function": [
                "warn",
                { max: 50, skipBlankLines: true, skipComments: true },
            ],
            "max-params": ["warn", 4],
        },
    },
]);
