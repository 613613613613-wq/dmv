import { expect, test } from "@playwright/test";
import { onboard } from "./helpers";

test.describe("Conversations (goal-driven coaching)", () => {
  test("demo talk: silent until they speak, then what they said + what to say", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("talk-demo").click();
    await expect(page.getByTestId("live")).toBeVisible();
    // Nothing on screen before the first counterparty line.
    await expect(page.getByTestId("cue")).toHaveCount(0);
    await expect(page.getByTestId("live-indicator")).toContainText("DEMO");

    const cue = page.getByTestId("cue");
    await expect(cue).toBeVisible({ timeout: 20_000 });
    await expect(page.getByTestId("cue-context")).toContainText("did you look at the flights");
    await expect(page.getByTestId("cue-headline")).toContainText("Yes, I did. Let me show you what I found.");
    await expect(cue).toHaveAttribute("data-kind", "REPLY");

    // Later: acknowledgement after the venting line, then the budget close.
    await expect(page.getByTestId("cue-headline")).toContainText("You're right, you carry most of the planning", { timeout: 30_000 });
    await expect(page.getByTestId("cue-headline")).toContainText("What number feels right to you?", { timeout: 30_000 });
    await expect(page.getByTestId("cue-headline")).toContainText("book the car by Friday", { timeout: 30_000 });
    // Let the scripted user actually say the commitment before ending, so it lands in the memo.
    await page.waitForTimeout(6_000);

    await page.getByTestId("end").click();
    await expect(page.getByTestId("memo")).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId("memo")).toContainText("October trip with Dana");
    await expect(page.getByTestId("memo")).toContainText("book the car by Friday");
  });

  test("new conversation: chat-box setup saves and starts", async ({ page }) => {
    await onboard(page);
    await page.getByTestId("new-talk").click();
    await expect(page.getByTestId("talk-setup")).toBeVisible();
    await expect(page.getByTestId("talk-start")).toBeDisabled();
    await page.getByTestId("talk-goal").fill("Ask Sam to hold the rent this year without souring things.");
    await page.getByTestId("talk-who").fill("Sam, my landlord");
    await page.getByTestId("tone-calm").click();
    // Live is blocked without a Deepgram key; demo works.
    await page.getByTestId("talk-mode-live").click();
    await expect(page.getByTestId("talk-setup")).toContainText("Add your Deepgram API key");
    await expect(page.getByTestId("talk-start")).toBeDisabled();
    await page.getByTestId("talk-mode-demo").click();
    await expect(page.getByTestId("talk-start")).toBeEnabled();
    await page.getByTestId("talk-start").click();
    await expect(page.getByTestId("live")).toBeVisible();
    await page.getByTestId("end").click();
    await expect(page.getByTestId("memo")).toBeVisible();
    await page.goto("/#/home");
    await expect(page.getByTestId("home")).toContainText("Talk with Sam, my landlord");
  });
});
