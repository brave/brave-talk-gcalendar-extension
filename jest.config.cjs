const puppeteerPreset = require("jest-puppeteer/jest-preset");

const tsTransform = {
  "^.+\\.ts?$": [
    "ts-jest",
    { isolatedModules: true, tsconfig: "tsconfig.jest.json" },
  ],
};

/** @type {import('jest').Config} */
module.exports = {
  projects: [
    {
      displayName: "unit",
      preset: "ts-jest",
      testEnvironment: "jsdom",
      testMatch: ["<rootDir>/src/tests/brave/**/*.test.ts"],
      setupFilesAfterEnv: ["<rootDir>/src/tests/jest.setup.ts"],
      transform: tsTransform,
      testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/", "/tmp/"],
      testTimeout: 30_000,
    },
    {
      displayName: "e2e",
      preset: "ts-jest",
      testMatch: [
        "<rootDir>/src/tests/google/**/*.test.ts",
        "<rootDir>/src/tests/proton/**/*.test.ts",
      ],
      ...puppeteerPreset,
      transform: tsTransform,
      globals: { ...puppeteerPreset.globals },
      testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/", "/tmp/"],
      testTimeout: 30_000,
    },
  ],
};
