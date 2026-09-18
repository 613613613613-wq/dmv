import { BRAND } from "../../brand";

export type PlanId = "trial" | "dealmaker" | "principal" | "enterprise";

export interface Plan {
  id: PlanId;
  name: string;
  priceLabel: string;
  annualLabel?: string;
  /** Live deal hours per calendar month; null = unlimited. */
  monthlyHours: number | null;
  /** Active (non-archived) dossiers; null = unlimited. */
  dossierCap: number | null;
  features: string[];
  products: { monthly?: string; annual?: string };
}

const pid = (s: string) => `${BRAND.bundleId}.${s}`;

export const PRODUCT_IDS = {
  dealmakerMonthly: pid("dealmaker.monthly"),
  dealmakerAnnual: pid("dealmaker.annual"),
  principalMonthly: pid("principal.monthly"),
  principalAnnual: pid("principal.annual"),
  pack5h: pid("pack.5h"),
} as const;

export const PACK_HOURS = 5;
export const TRIAL_HOURS = 2;
export const TRIAL_DAYS = 14;

export const PLANS: Record<PlanId, Plan> = {
  trial: {
    id: "trial",
    name: "Trial",
    priceLabel: "Free",
    monthlyHours: TRIAL_HOURS,
    dossierCap: 1,
    features: ["2 live hours, 14 days", "1 active deal dossier", "Red flags, fact cards, Help Now", "Deal memorandum with ledger audit"],
    products: {},
  },
  dealmaker: {
    id: "dealmaker",
    name: "Dealmaker",
    priceLabel: "$99 / month",
    annualLabel: "$950 / year",
    monthlyHours: 15,
    dossierCap: 3,
    features: ["15 live hours / month", "3 active deal dossiers", "Red flags, fact cards, Help Now", "Deal memorandum with ledger audit", "Companion desktop HUD mode"],
    products: { monthly: PRODUCT_IDS.dealmakerMonthly, annual: PRODUCT_IDS.dealmakerAnnual },
  },
  principal: {
    id: "principal",
    name: "Principal",
    priceLabel: "$249 / month",
    annualLabel: "$2,400 / year",
    monthlyHours: 50,
    dossierCap: null,
    features: ["50 live hours / month", "Unlimited active dossiers", "Everything in Dealmaker"],
    products: { monthly: PRODUCT_IDS.principalMonthly, annual: PRODUCT_IDS.principalAnnual },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    // Not sold in-app (App Store 3.1.1 / Play Payments): granted via a RevenueCat
    // promotional entitlement for organisations that contract directly.
    priceLabel: "By agreement",
    monthlyHours: null,
    dossierCap: null,
    features: ["Unlimited live hours", "Unlimited active dossiers"],
    products: {},
  },
};

export const PACK = { productId: PRODUCT_IDS.pack5h, hours: PACK_HOURS, priceLabel: `$49 / ${PACK_HOURS} hours` };
