import { chromium, devices } from "@playwright/test";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({ ...devices["iPhone 14 Pro"] });
const page = await ctx.newPage();
page.on("console", (m) => console.log("console:", m.type(), m.text()));
page.on("pageerror", (e) => console.log("pageerror:", e.message));
await page.goto("http://127.0.0.1:4173/#/onboarding");
await page.getByTestId("ob-next").click();
await page.getByTestId("ob-next").click();
await page.getByTestId("ob-ack").click();
await page.getByTestId("ob-finish").click();
await page.getByTestId("talk-demo").click();
const t0 = Date.now();
for (let i = 0; i < 40; i++) {
  await page.waitForTimeout(1000);
  const footer = await page.locator('[data-testid="live"]').innerText().catch(() => "");
  const cue = await page.getByTestId("cue-headline").innerText().catch(() => "-");
  console.log(((Date.now() - t0) / 1000).toFixed(0) + "s", footer.replace(/\n/g, " | ").slice(-120), "||", cue);
}
await browser.close();
