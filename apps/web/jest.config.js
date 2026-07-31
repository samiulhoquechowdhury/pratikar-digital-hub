/** @type {import('jest').Config} */
module.exports = {
  // jsdom rather than admin's "node": the tests worth having here cover React
  // hooks (checkout state, download gating), which need a renderer. admin's
  // suites are pure functions and don't.
  testEnvironment: "jsdom",
  rootDir: "src",
  testRegex: ".*\\.spec\\.tsx?$",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  // Same reasoning as apps/admin: the app tsconfig targets ESNext modules and
  // leaves JSX for Next to transform, neither of which Jest can consume — so
  // override just those settings for the test transform rather than
  // compromising the build config.
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "CommonJS",
          moduleResolution: "Node",
          jsx: "react-jsx",
          isolatedModules: false,
        },
      },
    ],
  },
};
