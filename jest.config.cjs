const unitTransform = {
  "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.jest.json" }],
};

const e2eTransform = {
  "^.+\\.tsx?$": ["ts-jest", { tsconfig: "tsconfig.e2e.json", useESM: true }],
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "unit",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/tests/brave/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
      transform: unitTransform,
      testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/", "/tmp/"],
      testTimeout: 30_000,
    },
    {
      displayName: "e2e",
      testEnvironment: "node",
      extensionsToTreatAsEsm: [".ts"],
      testMatch: [
        "<rootDir>/src/tests/google/**/*.test.ts",
        "<rootDir>/src/tests/proton/**/*.test.ts",
      ],
      transform: e2eTransform,
      testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/", "/tmp/"],
      testTimeout: 30_000,
    },
  ],
};
