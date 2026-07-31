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
  // Pinned to __dirname, not a cwd-relative path. lint-staged runs eslint from
  // the repo root while `next lint` runs from here; without this the resolver
  // only finds tsconfig in the second case, so `@/...` is classified as a
  // different import group in each and `import/order` disagrees with itself.
  // The pre-commit hook's --fix would then rewrite imports into the exact
  // order CI warns about.
  settings: {
    ...preset.settings,
    "import/resolver": {
      typescript: { project: `${__dirname}/tsconfig.json` },
      node: true,
    },
  },
};
