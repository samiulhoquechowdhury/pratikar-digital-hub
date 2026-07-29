/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...require("@pratikar/config/eslint-preset"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
  // See the note in apps/web/.eslintrc.js — pinned to __dirname so `@/...`
  // resolves the same whether eslint runs from the repo root or from here.
  settings: {
    "import/resolver": {
      typescript: { project: `${__dirname}/tsconfig.json` },
      node: true,
    },
  },
};
