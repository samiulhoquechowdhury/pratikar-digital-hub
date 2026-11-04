const preset = require("@pratikar/config/eslint-preset");

/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...preset,
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  plugins: [...preset.plugins, "react-hooks"],
  extends: [...preset.extends, "plugin:react-hooks/recommended"],
  ignorePatterns: [...preset.ignorePatterns, ".expo", "android", "ios", "*.js"],
  // Pinned to __dirname, as in apps/web: lint-staged runs eslint from the
  // repo root, and `@/...` must resolve the same from there.
  settings: {
    ...preset.settings,
    "import/resolver": {
      typescript: { project: `${__dirname}/tsconfig.json` },
      node: true,
    },
  },
};
