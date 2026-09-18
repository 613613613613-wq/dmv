import { test } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { onboard, startDemo } from "./helpers";

/**
 * Store screenshots, written straight into the fastlane folders so
 * `fastlane deliver` / `supply` pick them up.
 *  - project "store-screenshots": 430×932 @3x = 1290×2796 (App Store 6.7"/6.9")
 *  - project "play-screenshots":  414×736 @3x = 1242×2208 (Google Play phone, ≤ 2:1)
 */
const IOS = "fastlane/screenshots/en-US";
const ANDROID = "fastlane/metadata/android/en-US/images/phoneScreenshots";

async function shot(page: import("@playwright/test").Page, name: string) {
  const dir = test.info().project.name === "play-screenshots" ? ANDROID : IOS;
  mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: `${dir}/${name}.png`, fullPage: false });
}

test("capture store screenshots", async ({ page }) => {
  await onboard(page);
  await shot(page, "01-home");

  await page.getByTestId("edit-demo-harbor-point").click();
  await page.waitForSelector('[data-testid="deal-editor"]');
  await shot(page, "02-deal-terms");

  await page.goto("/#/home");
  await startDemo(page);
  await page.getByTestId("cue-headline").waitFor({ timeout: 30_000 });
  await shot(page, "03-red-flag");

  // Wait for a fact card.
  await page.getByTestId("hud").click();
  await page.waitForFunction(() => document.querySelector('[data-testid="cue"]')?.getAttribute("data-tier") === "2", null, { timeout: 40_000 }).catch(() => undefined);
  await shot(page, "04-fact-card");

  await page.getByTestId("end").click();
  await page.waitForSelector('[data-testid="memo"]');
  await shot(page, "05-memorandum");

  await page.goto("/#/preflight/demo-harbor-point");
  await page.getByTestId("pf-next").click();
  await page.getByTestId("pf-confirm-terms").click();
  await page.getByTestId("pf-next").click();
  await shot(page, "06-consent");

  await page.goto("/#/paywall");
  await page.waitForSelector('[data-testid="paywall"]');
  await shot(page, "07-plans");
});
