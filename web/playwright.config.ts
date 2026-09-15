import { defineConfig } from "@playwright/test";

const hostedBaseURL = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: "./test-results",
  reporter: "line",
  use: {
    baseURL: hostedBaseURL ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    launchOptions: { args: ["--disable-gpu"] },
  },
  ...(hostedBaseURL ? {} : {
    webServer: {
      command: "npm run preview -- --host 127.0.0.1 --port 4173",
      url: "http://127.0.0.1:4173",
      reuseExistingServer: false,
      timeout: 120_000,
    },
  }),
});
