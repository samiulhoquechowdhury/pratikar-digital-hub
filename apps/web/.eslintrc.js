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
};
