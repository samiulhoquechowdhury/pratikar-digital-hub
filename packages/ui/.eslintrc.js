/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...require("@pratikar/config/eslint-preset"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    ecmaFeatures: { jsx: true },
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
};
