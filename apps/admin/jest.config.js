/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "node",
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // The app tsconfig targets ESNext modules for Next's bundler; Jest runs
  // CommonJS, so override just the module settings for the test transform
  // rather than compromising the build config.
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          isolatedModules: false,
        },
      },
    ],
  },
};
