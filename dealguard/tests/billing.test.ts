import { describe, expect, it } from "vitest";
import { applyPurchase, canCreateDossier, canStartSession, formatHours, initialUsage, planFromEntitlements, recordUsage, remainingSeconds, rollover } from "../src/engine/billing/entitlements";
import { PLANS, PRODUCT_IDS } from "../src/engine/billing/plans";
import { entitlementsFor, MockPurchaseProvider } from "../src/engine/billing/provider";

const sep1 = new Date("2026-09-01T10:00:00Z");
const sep20 = new Date("2026-09-20T10:00:00Z");
const oct2 = new Date("2026-10-02T10:00:00Z");

describe("entitlements", () => {
  it("starts every user on a 2-hour, 1-dossier trial", () => {
    const u = initialUsage(sep1);
    expect(u.planId).toBe("trial");
    expect(remainingSeconds(u, sep1)).toBe(2 * 3600);
    expect(canCreateDossier(u, 0)).toBe(true);
    expect(canCreateDossier(u, 1)).toBe(false);
  });

  it("consumes plan hours then pack hours, and blocks when exhausted", () => {
    let u = applyPurchase(initialUsage(sep1), PRODUCT_IDS.dealmakerMonthly, sep1);
    expect(u.planId).toBe("dealmaker");
    expect(remainingSeconds(u, sep1)).toBe(15 * 3600);
    u = recordUsage(u, 14 * 3600, sep1);
    u = applyPurchase(u, PRODUCT_IDS.pack5h, sep1);
    expect(remainingSeconds(u, sep1)).toBe(6 * 3600);
    u = recordUsage(u, 3 * 3600, sep1); // 1h from plan, 2h from pack
    expect(u.secondsUsedThisMonth).toBe(15 * 3600);
    expect(u.packSecondsRemaining).toBe(3 * 3600);
    u = recordUsage(u, 3 * 3600, sep1);
    expect(canStartSession(u, sep1)).toEqual({ ok: false, reason: "no_hours", remainingSeconds: 0 });
  });

  it("resets monthly usage on rollover but keeps packs", () => {
    let u = applyPurchase(initialUsage(sep1), PRODUCT_IDS.principalAnnual, sep1);
    u = recordUsage(u, 50 * 3600, sep20);
    u = applyPurchase(u, PRODUCT_IDS.pack5h, sep20);
    expect(remainingSeconds(u, sep20)).toBe(5 * 3600);
    const rolled = rollover(u, oct2);
    expect(rolled.secondsUsedThisMonth).toBe(0);
    expect(rolled.packSecondsRemaining).toBe(5 * 3600);
    expect(remainingSeconds(u, oct2)).toBe(55 * 3600);
  });

  it("downgrades to trial when a subscription lapses", () => {
    const u = applyPurchase(initialUsage(sep1), PRODUCT_IDS.dealmakerMonthly, sep1);
    expect(rollover(u, new Date("2026-10-15T00:00:00Z")).planId).toBe("trial");
    expect(rollover(u, sep20).planId).toBe("dealmaker");
  });

  it("expires the trial after 14 days", () => {
    const u = initialUsage(sep1);
    expect(canStartSession(u, sep20).ok).toBe(false);
    expect(canStartSession(u, sep20).reason).toBe("trial_expired");
  });

  it("maps entitlements and formats hours", () => {
    expect(planFromEntitlements(["dealmaker"])).toBe("dealmaker");
    expect(planFromEntitlements(["dealmaker", "principal"])).toBe("principal");
    expect(planFromEntitlements([])).toBeNull();
    expect(formatHours(Infinity)).toBe("Unlimited");
    expect(formatHours(3 * 3600 + 5 * 60)).toBe("3h 05m");
    expect(PLANS.enterprise.monthlyHours).toBeNull();
  });
});

describe("MockPurchaseProvider", () => {
  it("purchases and restores", async () => {
    const p = new MockPurchaseProvider([{ productId: PRODUCT_IDS.principalMonthly, title: "Principal", priceLabel: "$249" }]);
    const r = await p.purchase(PRODUCT_IDS.principalMonthly);
    expect(r.ok).toBe(true);
    expect(r.entitlements).toEqual(["principal"]);
    expect((await p.restore()).productIds).toEqual([PRODUCT_IDS.principalMonthly]);
    expect((await p.purchase("bogus")).ok).toBe(false);
    expect(entitlementsFor([PRODUCT_IDS.pack5h])).toEqual([]);
  });
});
