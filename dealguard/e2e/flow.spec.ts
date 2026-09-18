import { expect, test } from "@playwright/test";
import { onboard, startDemo } from "./helpers";

test.describe("Deal Guard — end to end", () => {
  test("onboarding gates the app and loads the sample deal", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("onboarding")).toBeVisible();
    await onboard(page);
    await expect(page.getByTestId("deal-demo-harbor-point")).toContainText("Harbor Point Industrial (Sample)");
    await expect(page.getByTestId("usage-card")).toContainText("Trial plan");
    await expect(page.getByTestId("usage-card")).toContainText("2h 00m");
    // Reload: onboarding is remembered.
    await page.reload();
    await expect(page.getByTestId("home")).toBeVisible();
  });

  test("demo call: red flags, fact cards, dismiss, freeze, help, memo", async ({ page }) => {
    await onboard(page);
    await startDemo(page);

    // First contradiction in the script: "we agreed to twelve million on the price".
    const cue = page.getByTestId("cue");
    await expect(cue).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("cue-headline")).toContainText("Record: Purchase price is $14,250,000, not $12M");
    await expect(page.getByTestId("cue-source")).toHaveText("PSA_Draft_v3_Clean.pdf · 2026-08-15");
    await expect(cue).toHaveAttribute("data-tier", "1");
    const words = (await page.getByTestId("cue-headline").innerText()).trim().split(/\s+/).length;
    expect(words).toBeLessThanOrEqual(12);

    // Tap dismisses.
    await page.getByTestId("hud").click();
    await expect(page.getByTestId("cue")).toHaveCount(0);

    // Next Tier 1: inspection below the 21-day floor.
    await expect(page.getByTestId("cue-headline")).toContainText("10 days is below inspection window", { timeout: 30_000 });

    // Help Now publishes a grounded talking point instantly (template mode).
    await page.getByTestId("help").click();
    await expect(page.getByTestId("cue-headline")).toContainText(/Hold inspection window at 21 calendar days|Anchor on|Ask what/);

    // Fact card for "What was the deposit again?"
    await expect(page.getByTestId("cue-headline")).toContainText("Earnest deposit: $500,000", { timeout: 30_000 });

    // Long-press freezes.
    const hud = page.getByTestId("hud");
    const box = (await hud.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(1700);
    await page.mouse.up();
    await expect(page.getByTestId("cue")).toContainText("frozen");

    // A Tier 1 still overrides a frozen Tier 2 ("we would need you at fifteen million").
    await expect(page.getByTestId("cue-headline")).toContainText("$15M is above walk away price", { timeout: 30_000 });

    // End meeting → memo within a second.
    await page.getByTestId("end").click();
    await expect(page.getByTestId("memo")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("memo")).toContainText("Deal Memorandum — Harbor Point Industrial (Sample)");
    await expect(page.getByTestId("memo")).toContainText("Ledger audit");
    await expect(page.getByTestId("memo")).toContainText("Median time-to-cue");
    await page.getByTestId("toggle-ledger").click();
    await expect(page.getByTestId("ledger")).toContainText("twelve million");

    // Share copies markdown on the web.
    await page.getByTestId("memo-share").click();
    await expect(page.getByTestId("memo-share")).toContainText(/Copied|Shared/);

    // Home lists the memo; demo consumed no trial hours.
    await page.goto("/#/home");
    await expect(page.getByTestId("home")).toContainText("Harbor Point Industrial (Sample)");
    await expect(page.getByTestId("usage-card")).toContainText("2h 00m");
  });

  test("pre-flight blocks live mode without a key and enforces all-party consent", async ({ page }) => {
    await onboard(page, { jurisdictions: ["CA"] });
    await page.getByTestId("start-demo-harbor-point").click();
    await page.getByTestId("mode-deepgram").click();
    await expect(page.getByTestId("preflight")).toContainText("Add your Deepgram API key");
    await expect(page.getByTestId("pf-next")).toBeDisabled();

    // Add a key in settings, come back.
    await page.goto("/#/settings");
    await page.getByTestId("set-dg").fill("dg_test_key");
    await page.goto("/#/preflight/demo-harbor-point");
    await page.getByTestId("mode-deepgram").click();
    await page.getByTestId("pf-next").click();
    await page.getByTestId("pf-confirm-terms").click();
    await page.getByTestId("pf-next").click();
    await expect(page.getByTestId("preflight")).toContainText("All-party consent required");
    await expect(page.getByTestId("preflight")).toContainText("Cal. Penal Code § 632");
    await expect(page.getByTestId("pf-start")).toBeDisabled();
    await page.getByTestId("pf-informed").click();
    await expect(page.getByTestId("pf-start")).toBeEnabled();
  });

  test("deal editor: add a hard cap and see it in pre-flight", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("new-deal").click();
    // Trial allows one dossier: the sample already exists → paywall.
    await expect(page.getByTestId("paywall")).toBeVisible();
    await expect(page.getByTestId("plan-dealmaker")).toContainText("$99 / month");
    await expect(page.getByTestId("plan-principal")).toContainText("$249 / month");

    // Mock store (VITE_E2E=1): buy Principal, then create the deal.
    await page.getByTestId("buy-principal").click();
    await expect(page.getByTestId("paywall")).toContainText("you're upgraded");
    await page.goto("/#/home");
    await expect(page.getByTestId("usage-card")).toContainText("Principal plan");
    await expect(page.getByTestId("usage-card")).toContainText("50h 00m");
    await page.getByTestId("new-deal").click();
    await expect(page.getByTestId("deal-editor")).toBeVisible();
    await page.getByTestId("deal-name").fill("Elm Street Portfolio");
    await page.getByTestId("add-term").click();
    await page.getByTestId("term-field").selectOption("walk_away_price");
    await page.getByTestId("term-value").fill("$9,800,000");
    await page.getByTestId("term-status").selectOption("hard_cap");
    await page.getByTestId("term-source").fill("IC_Memo.pdf");
    await page.getByTestId("term-save").click();
    await expect(page.getByTestId("term-walk_away_price")).toContainText("$9,800,000");
    await page.getByTestId("deal-save").click();
    await expect(page.getByTestId("home")).toContainText("Elm Street Portfolio");
  });

  test("settings: legal docs render and delete-all resets to onboarding", async ({ page }) => {
    await onboard(page);
    await page.goto("/#/legal/privacy");
    await expect(page.getByTestId("legal")).toContainText(/Privacy/i);
    await page.goto("/#/legal/terms");
    await expect(page.getByTestId("legal")).toContainText(/Terms/i);
    await page.goto("/#/settings");
    page.once("dialog", (d) => d.accept());
    await page.getByTestId("erase").click();
    await expect(page.getByTestId("onboarding")).toBeVisible();
  });
});
