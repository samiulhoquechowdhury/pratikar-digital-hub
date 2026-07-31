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
  // next/core-web-vitals last so its rules win over the shared preset.
  extends: [...preset.extends, "next/core-web-vitals"],
  ignorePatterns: [...preset.ignorePatterns, "next-env.d.ts"],
  // See the note in apps/web/.eslintrc.js — pinned to __dirname so eslint
  // resolves `@/...` identically whether lint-staged runs it from the repo
  // root or `next lint` runs it from here.
  settings: {
    ...preset.settings,
    "import/resolver": {
      typescript: { project: `${__dirname}/tsconfig.json` },
      node: true,
    },
  },
};
