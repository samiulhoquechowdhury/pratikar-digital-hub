/** @type {import('eslint').Linter.Config} */
module.exports = {
  ...require("@pratikar/config/eslint-preset"),
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: ["./tsconfig.json"],
    tsconfigRootDir: __dirname,
  },
};
