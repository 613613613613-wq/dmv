import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyPurchase, formatHours, planFromEntitlements, remainingSeconds } from "../../engine/billing/entitlements";
import { PACK, PLANS, type PlanId } from "../../engine/billing/plans";
import type { Offering } from "../../engine/billing/provider";
import { purchasesConfigured } from "../../native/purchases";
import { isNative } from "../../native/platform";
import { useApp } from "../AppContext";
import { Button, Card, Pill, Screen } from "../components";

export function PaywallView() {
  const nav = useNavigate();
  const { usage, setUsage, purchases } = useApp();
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [annual, setAnnual] = useState(false);
  const live = purchasesConfigured() || (!isNative() && import.meta.env.VITE_E2E === "1");

  useEffect(() => {
    if (!live) return;
    purchases
      .offerings()
      .then(setOfferings)
      .catch((e: unknown) => setMsg(e instanceof Error ? e.message : "Could not load products"));
  }, [purchases, live]);

  const price = (productId?: string, fallback?: string) => offerings.find((o) => o.productId === productId)?.priceLabel ?? fallback ?? "";

  const buy = async (productId?: string) => {
    if (!productId || !live) return;
    setBusy(productId);
    setMsg(null);
    try {
      const r = await purchases.purchase(productId);
      if (r.cancelled) return;
      if (!r.ok) return setMsg(r.error ?? "Purchase failed");
      let next = applyPurchase(usage, productId, new Date());
      const plan = planFromEntitlements(r.entitlements);
      if (plan) next = { ...next, planId: plan };
      await setUsage(next);
      setMsg("Thank you — you're upgraded.");
    } finally {
      setBusy(null);
    }
  };

  const restore = async () => {
    if (!live) return;
    setBusy("restore");
    const r = await purchases.restore();
    setBusy(null);
    if (!r.ok) return setMsg(r.error ?? "Nothing to restore");
    const plan = planFromEntitlements(r.entitlements);
    if (plan) {
      await setUsage({ ...usage, planId: plan });
      setMsg(`Restored ${PLANS[plan].name}.`);
    } else setMsg("No active subscription found for this account.");
  };

  const planCard = (id: PlanId) => {
    const p = PLANS[id];
    const current = usage.planId === id;
    const productId = annual ? p.products.annual : p.products.monthly;
    return (
      <Card key={id} className={current ? "border-ink-100" : ""} testId={`plan-${id}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="text-[18px] font-extrabold">{p.name}</div>
            <div className="text-[15px] text-ink-300 mt-0.5">{id === "enterprise" ? p.priceLabel : price(productId, annual ? p.annualLabel : p.priceLabel)}</div>
          </div>
          {current && <Pill tone="calm">Current</Pill>}
        </div>
        <ul className="mt-3 space-y-1.5 text-[14px] text-ink-100/90">
          {p.features.map((f) => (
            <li key={f} className="flex gap-2">
              <span className="text-calm">✓</span>
              {f}
            </li>
          ))}
        </ul>
        {id === "enterprise" ? (
          <a className="mt-4 block" href="mailto:sales@dealguard.app?subject=Deal%20Guard%20Enterprise">
            <Button variant="ghost" full>
              Contact sales
            </Button>
          </a>
        ) : (
          <Button full className="mt-4" disabled={!live || current || busy !== null} onClick={() => buy(productId)} data-testid={`buy-${id}`}>
            {busy === productId ? "Purchasing…" : current ? "Active" : `Choose ${p.name}`}
          </Button>
        )}
      </Card>
    );
  };

  return (
    <Screen title="Plans" back={true} testId="paywall">
      <Card className="mt-4">
        <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">Your {PLANS[usage.planId].name} plan</div>
        <div className="text-[22px] font-extrabold mt-0.5">{formatHours(remainingSeconds(usage, new Date()))} left this month</div>
        <p className="text-[13px] text-ink-400 mt-1 leading-snug">Live hours are counted only while a real call is running. Demo calls are free.</p>
      </Card>

      <div className="flex items-center justify-center gap-3 mt-6">
        <button className={`text-[14px] font-semibold ${!annual ? "text-ink-100" : "text-ink-400"}`} onClick={() => setAnnual(false)}>
          Monthly
        </button>
        <button role="switch" aria-checked={annual} onClick={() => setAnnual(!annual)} className={`w-12 h-7 rounded-full p-0.5 ${annual ? "bg-calm" : "bg-ink-700"}`}>
          <span className={`block w-6 h-6 rounded-full bg-white transition ${annual ? "translate-x-5" : ""}`} />
        </button>
        <button className={`text-[14px] font-semibold ${annual ? "text-ink-100" : "text-ink-400"}`} onClick={() => setAnnual(true)}>
          Annual <span className="text-calm">save 20%</span>
        </button>
      </div>

      <div className="space-y-3 mt-4">
        {planCard("dealmaker")}
        {planCard("principal")}
        {planCard("enterprise")}
      </div>

      <Card className="mt-3" testId="plan-pack">
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="text-[18px] font-extrabold">Pay-per-deal pack</div>
            <div className="text-[15px] text-ink-300 mt-0.5">{price(PACK.productId, PACK.priceLabel)}</div>
            <p className="text-[13px] text-ink-400 mt-1.5 leading-snug">{PACK.hours} live hours that never expire. For a two-week closing sprint without a subscription.</p>
          </div>
        </div>
        <Button variant="subtle" full className="mt-4" disabled={!live || busy !== null} onClick={() => buy(PACK.productId)} data-testid="buy-pack">
          {busy === PACK.productId ? "Purchasing…" : `Buy ${PACK.hours} hours`}
        </Button>
      </Card>

      {!live && (
        <p className="text-[13px] text-ink-400 mt-4 leading-snug" data-testid="purchases-unavailable">
          Purchases are handled by the App Store / Google Play and are not available in this build. Your trial keeps working.
        </p>
      )}
      {msg && (
        <p className="text-[13px] text-calm mt-3" role="status">
          {msg}
        </p>
      )}

      <div className="flex gap-3 mt-6">
        <Button variant="ghost" full disabled={!live || busy !== null} onClick={restore} data-testid="restore">
          Restore purchases
        </Button>
        {purchases.manageUrl() && (
          <a href={purchases.manageUrl()!} target="_blank" rel="noreferrer" className="flex-1">
            <Button variant="ghost" full>
              Manage
            </Button>
          </a>
        )}
      </div>
      <p className="text-[11px] text-ink-400 mt-5 leading-snug">
        Subscriptions renew automatically until cancelled in your App Store or Google Play account settings. Payment is charged to your store account at confirmation.{" "}
        <button className="underline" onClick={() => nav("/legal/terms")}>
          Terms
        </button>{" "}
        ·{" "}
        <button className="underline" onClick={() => nav("/legal/privacy")}>
          Privacy
        </button>
      </p>
    </Screen>
  );
}
