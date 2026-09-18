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
    features: ["2 live deal hours", "1 deal dossier", "Real-time red flags", "Deal memorandum"],
    products: {},
  },
  dealmaker: {
    id: "dealmaker",
    name: "Dealmaker",
    priceLabel: "$99 / month",
    annualLabel: "$950 / year",
    monthlyHours: 15,
    dossierCap: 3,
    features: ["15 active deal hours / month", "3 active deal dossiers", "Local encrypted vault", "Real-time red flags", "Agreed-terms ledger & memo"],
    products: { monthly: PRODUCT_IDS.dealmakerMonthly, annual: PRODUCT_IDS.dealmakerAnnual },
  },
  principal: {
    id: "principal",
    name: "Principal",
    priceLabel: "$249 / month",
    annualLabel: "$2,400 / year",
    monthlyHours: 50,
    dossierCap: null,
    features: ["50 active deal hours / month", "Unlimited dossiers", "Multi-document cross audit", "Speculative turn prep", "Phone + desktop notch display", "Priority low-latency routing"],
    products: { monthly: PRODUCT_IDS.principalMonthly, annual: PRODUCT_IDS.principalAnnual },
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    priceLabel: "Custom ($5k+ / year)",
    monthlyHours: null,
    dossierCap: null,
    features: ["Unlimited deal hours", "Custom CRM / ERP retrieval", "Dedicated local vault", "Team permission locks"],
    products: {},
  },
};

export const PACK = { productId: PRODUCT_IDS.pack5h, hours: PACK_HOURS, priceLabel: `$49 / ${PACK_HOURS} hours` };
