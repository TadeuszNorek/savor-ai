import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";
import path from "path";

// Read environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",

  /* Run tests in files in parallel */
  fullyParallel: true,

  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,

  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,

  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,

  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [["html"], ["list"], ["json", { outputFile: "test-results/results.json" }]],

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.BASE_URL || "http://localhost:3001",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Capture screenshot on failure */
    screenshot: "only-on-failure",

    /* Capture video on failure */
    video: "retain-on-failure",

    /* Browser contexts for test isolation */
    contextOptions: {
      // Strict mode for better error messages
      strictSelectors: true,
    },
  },

  /* Visual regression testing configuration */
  expect: {
    toHaveScreenshot: {
      // Maximum pixel ratio difference allowed
      maxDiffPixelRatio: 0.01,
      // Update snapshots on first run
      // updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',
    },
  },

  /* Configure projects for Chromium only */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npx dotenvx run --env-file=.env.test -- npm run dev",
    url: "http://localhost:3001",
    reuseExistingServer: false, // Always restart to ensure .env.test is loaded
    timeout: 120000,
    stdout: "pipe",
    stderr: "pipe",
    env: {
      PLAYWRIGHT_TEST: "true", // Signal to astro.config that we're running tests
    },
  },
});
