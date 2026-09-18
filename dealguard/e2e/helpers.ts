import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

/** Complete onboarding (FL selected → all-party consent), landing on Home with the sample deal loaded. */
export async function onboard(page: Page, opts: { jurisdictions?: string[] } = {}) {
  await page.goto("/#/onboarding");
  await expect(page.getByTestId("onboarding")).toBeVisible();
  await page.getByTestId("ob-next").click();
  await page.getByTestId("ob-name").fill("Alex Rosen");
  for (const j of opts.jurisdictions ?? ["FL"]) await page.getByTestId(`juris-${j}`).click();
  await page.getByTestId("ob-next").click();
  await page.getByTestId("ob-ack").click();
  await page.getByTestId("ob-finish").click();
  await expect(page.getByTestId("home")).toBeVisible();
}

export async function startDemo(page: Page) {
  await page.getByTestId("start-demo-harbor-point").click();
  await expect(page.getByTestId("preflight")).toBeVisible();
  await page.getByTestId("mode-demo").click();
  await page.getByTestId("pf-next").click();
  await page.getByTestId("pf-confirm-terms").click();
  await page.getByTestId("pf-next").click();
  await page.getByTestId("pf-start").click();
  await expect(page.getByTestId("live")).toBeVisible();
}
