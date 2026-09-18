import { defineConfig, devices } from "@playwright/test";

/**
 * Two projects:
 *  - e2e: functional flows against the production build (vite preview).
 *  - store-screenshots: the same build at App Store / Play phone sizes,
 *    writing PNGs straight into the fastlane metadata folders.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 90_000,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    colorScheme: "dark",
    trace: "retain-on-failure",
    // PW_CHROMIUM lets a sandbox with a pre-installed Chromium run the suite
    // without `playwright install` (CI installs the matching browser instead).
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: "npm run build -- --mode e2e && npx vite preview --host 127.0.0.1 --port 4173 --strictPort",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: { VITE_E2E: "1" },
  },
  projects: [
    {
      name: "e2e",
      testMatch: /.*\.spec\.ts/,
      use: { ...devices["iPhone 14 Pro"], browserName: "chromium", permissions: ["clipboard-read", "clipboard-write"] },
    },
    {
      name: "store-screenshots",
      testMatch: /.*\.shots\.ts/,
      use: { browserName: "chromium", deviceScaleFactor: 3, viewport: { width: 430, height: 932 }, isMobile: true, hasTouch: true },
    },
  ],
});
