const puppeteerPreset = require("jest-puppeteer/jest-preset");

module.exports = {
  verbose: true,
  testTimeout: 30_000,
  preset: "ts-jest",
  ...puppeteerPreset,
  // testEnvironment: "jsdom",
  setupFilesAfterEnv: [...(puppeteerPreset.setupFilesAfterEnv || []), "./src/tests/jest.setup.ts"],
  transform: {
    "^.+\\.ts?$": [
      "ts-jest",
      {
        isolatedModules: true,
      },
    ],
  },
  globals: {
    ...puppeteerPreset.globals,
  },
  testPathIgnorePatterns: ["/node_modules/", "/build/", "/dist/", "/tmp/"],
};
