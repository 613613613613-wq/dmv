import { PACK_HOURS, PLANS, PRODUCT_IDS, TRIAL_DAYS, type PlanId } from "./plans";

export interface UsageState {
  planId: PlanId;
  /** "2026-09" — usage resets when this changes. */
  monthKey: string;
  secondsUsedThisMonth: number;
  packSecondsRemaining: number;
  trialStartedAt: string;
  /** ISO; undefined for trial / enterprise / lifetime. */
  planExpiresAt?: string;
}

export function monthKey(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function initialUsage(now: Date): UsageState {
  return { planId: "trial", monthKey: monthKey(now), secondsUsedThisMonth: 0, packSecondsRemaining: 0, trialStartedAt: now.toISOString() };
}

export function rollover(state: UsageState, now: Date): UsageState {
  const key = monthKey(now);
  let s = state;
  if (s.monthKey !== key) s = { ...s, monthKey: key, secondsUsedThisMonth: 0 };
  if (s.planExpiresAt && new Date(s.planExpiresAt).getTime() < now.getTime() && s.planId !== "trial") {
    s = { ...s, planId: "trial", planExpiresAt: undefined };
  }
  return s;
}

export function trialExpired(state: UsageState, now: Date): boolean {
  if (state.planId !== "trial") return false;
  const started = new Date(state.trialStartedAt).getTime();
  return now.getTime() - started > TRIAL_DAYS * 86_400_000;
}

/** Seconds of live time still available this month (plan + packs). Infinity when unlimited. */
export function remainingSeconds(state: UsageState, now: Date): number {
  const s = rollover(state, now);
  const plan = PLANS[s.planId];
  const planSeconds = plan.monthlyHours === null ? Infinity : plan.monthlyHours * 3600;
  const planLeft = s.planId === "trial" && trialExpired(s, now) ? 0 : Math.max(0, planSeconds - s.secondsUsedThisMonth);
  return planLeft + s.packSecondsRemaining;
}

export interface StartCheck {
  ok: boolean;
  reason?: "no_hours" | "trial_expired";
  remainingSeconds: number;
}

export function canStartSession(state: UsageState, now: Date): StartCheck {
  const remaining = remainingSeconds(state, now);
  if (remaining <= 0) {
    return { ok: false, reason: trialExpired(state, now) && state.packSecondsRemaining <= 0 ? "trial_expired" : "no_hours", remainingSeconds: 0 };
  }
  return { ok: true, remainingSeconds: remaining };
}

export function canCreateDossier(state: UsageState, activeDossiers: number): boolean {
  const cap = PLANS[state.planId].dossierCap;
  return cap === null || activeDossiers < cap;
}

/** Consume live seconds: plan allowance first, then pay-per-deal packs. */
export function recordUsage(state: UsageState, seconds: number, now: Date): UsageState {
  let s = rollover(state, now);
  const plan = PLANS[s.planId];
  const planSeconds = plan.monthlyHours === null ? Infinity : plan.monthlyHours * 3600;
  const planLeft = Math.max(0, planSeconds - s.secondsUsedThisMonth);
  const fromPlan = Math.min(planLeft, seconds);
  const fromPack = Math.min(s.packSecondsRemaining, seconds - fromPlan);
  s = {
    ...s,
    secondsUsedThisMonth: s.secondsUsedThisMonth + fromPlan + Math.max(0, seconds - fromPlan - fromPack),
    packSecondsRemaining: s.packSecondsRemaining - fromPack,
  };
  return s;
}

export function applyPurchase(state: UsageState, productId: string, now: Date): UsageState {
  const s = rollover(state, now);
  const addMonths = (n: number) => {
    const d = new Date(now);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.toISOString();
  };
  switch (productId) {
    case PRODUCT_IDS.dealmakerMonthly:
      return { ...s, planId: "dealmaker", planExpiresAt: addMonths(1) };
    case PRODUCT_IDS.dealmakerAnnual:
      return { ...s, planId: "dealmaker", planExpiresAt: addMonths(12) };
    case PRODUCT_IDS.principalMonthly:
      return { ...s, planId: "principal", planExpiresAt: addMonths(1) };
    case PRODUCT_IDS.principalAnnual:
      return { ...s, planId: "principal", planExpiresAt: addMonths(12) };
    case PRODUCT_IDS.pack5h:
      return { ...s, packSecondsRemaining: s.packSecondsRemaining + PACK_HOURS * 3600 };
    default:
      return s;
  }
}

/**
 * Reconcile local state with what the store says right now. The store is the
 * source of truth for subscriptions; packs (consumables) stay local.
 */
export function applyEntitlements(state: UsageState, snap: { entitlements: string[]; expiresAt: string | null }, now: Date): UsageState {
  const s = rollover(state, now);
  const plan = planFromEntitlements(snap.entitlements);
  if (plan) return { ...s, planId: plan, planExpiresAt: snap.expiresAt ?? undefined };
  if (s.planId !== "trial") return { ...s, planId: "trial", planExpiresAt: undefined };
  return s;
}

/** Map RevenueCat-style entitlement identifiers back to a plan. */
export function planFromEntitlements(active: string[]): PlanId | null {
  if (active.includes("enterprise")) return "enterprise";
  if (active.includes("principal")) return "principal";
  if (active.includes("dealmaker")) return "dealmaker";
  return null;
}

export function formatHours(seconds: number): string {
  if (!Number.isFinite(seconds)) return "Unlimited";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${m}m`;
}
