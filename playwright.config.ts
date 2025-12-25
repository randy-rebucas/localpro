import { defineConfig, devices } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

// Load E2E env vars from a tracked file (this repo uses `env.*` naming, not `.env*`).
// Create `env.e2e` locally from `env.e2e.example`.
const envFile = path.resolve(__dirname, "env.e2e");
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";
const isLocalBaseUrl = /localhost|127\.0\.0\.1/.test(baseURL);

export default defineConfig({
  testDir: "e2e/journeys",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html"],
    ["json", { outputFile: "test-results/results.json" }],
    ["junit", { outputFile: "test-results/junit.xml" }],
  ],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Only auto-start a webServer for local runs (if you're pointing at a remote baseURL, do not start Next dev server).
  ...(isLocalBaseUrl
    ? {
        webServer: {
          command: "pnpm dev",
          url: baseURL,
          reuseExistingServer: !process.env.CI,
          timeout: 120 * 1000,
        },
      }
    : {}),
});


