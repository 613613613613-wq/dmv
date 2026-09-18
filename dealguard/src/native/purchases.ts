import { Purchases, LOG_LEVEL, type PurchasesPackage } from "@revenuecat/purchases-capacitor";
import { BRAND } from "../brand";
import { PLANS, PACK } from "../engine/billing/plans";
import { MockPurchaseProvider, type Offering, type PurchaseProvider, type PurchaseResult } from "../engine/billing/provider";
import { isNative, platform } from "./platform";

/**
 * RevenueCat-backed store access (StoreKit 2 on iOS, Google Play Billing on
 * Android). Enabled only when a public SDK key is present for the platform;
 * otherwise the paywall renders in "not configured" mode.
 */
export class RevenueCatProvider implements PurchaseProvider {
  readonly id = "revenuecat" as const;
  private configured = false;
  private packages: PurchasesPackage[] = [];

  constructor(private readonly apiKey: string) {}

  available(): boolean {
    return isNative() && !!this.apiKey;
  }

  async configure(): Promise<void> {
    if (this.configured || !this.available()) return;
    await Purchases.setLogLevel({ level: LOG_LEVEL.WARN });
    await Purchases.configure({ apiKey: this.apiKey });
    this.configured = true;
  }

  async offerings(): Promise<Offering[]> {
    await this.configure();
    const res = await Purchases.getOfferings();
    const pkgs = res.current?.availablePackages ?? Object.values(res.all).flatMap((o) => o.availablePackages);
    this.packages = pkgs;
    return pkgs.map((p) => ({ productId: p.product.identifier, title: p.product.title, priceLabel: p.product.priceString }));
  }

  private fromCustomerInfo(info: { entitlements: { active: Record<string, unknown> }; allPurchasedProductIdentifiers: string[] }): PurchaseResult {
    return { ok: true, productIds: info.allPurchasedProductIdentifiers, entitlements: Object.keys(info.entitlements.active) };
  }

  async purchase(productId: string): Promise<PurchaseResult> {
    try {
      await this.configure();
      if (!this.packages.length) await this.offerings();
      const pkg = this.packages.find((p) => p.product.identifier === productId);
      if (!pkg) return { ok: false, productIds: [], entitlements: [], error: "Product not available in the store yet." };
      const res = await Purchases.purchasePackage({ aPackage: pkg });
      const r = this.fromCustomerInfo(res.customerInfo);
      if (!r.productIds.includes(res.productIdentifier)) r.productIds.push(res.productIdentifier);
      return r;
    } catch (e) {
      const err = e as { userCancelled?: boolean; message?: string; code?: string | number };
      const cancelled = !!err.userCancelled || String(err.code) === "1" || /cancel/i.test(err.message ?? "");
      return { ok: false, productIds: [], entitlements: [], cancelled, error: cancelled ? undefined : err.message ?? "Purchase failed" };
    }
  }

  async restore(): Promise<PurchaseResult> {
    try {
      await this.configure();
      const res = await Purchases.restorePurchases();
      return this.fromCustomerInfo(res.customerInfo);
    } catch (e) {
      return { ok: false, productIds: [], entitlements: [], error: e instanceof Error ? e.message : "Restore failed" };
    }
  }

  manageUrl(): string | null {
    return platform() === "ios" ? "https://apps.apple.com/account/subscriptions" : "https://play.google.com/store/account/subscriptions";
  }
}

export function makePurchaseProvider(): PurchaseProvider {
  const key = platform() === "ios" ? BRAND.revenueCat.ios : platform() === "android" ? BRAND.revenueCat.android : "";
  if (isNative() && key) return new RevenueCatProvider(key);
  const catalogue: Offering[] = [
    { productId: PLANS.dealmaker.products.monthly!, title: "Dealmaker (monthly)", priceLabel: PLANS.dealmaker.priceLabel },
    { productId: PLANS.dealmaker.products.annual!, title: "Dealmaker (annual)", priceLabel: PLANS.dealmaker.annualLabel! },
    { productId: PLANS.principal.products.monthly!, title: "Principal (monthly)", priceLabel: PLANS.principal.priceLabel },
    { productId: PLANS.principal.products.annual!, title: "Principal (annual)", priceLabel: PLANS.principal.annualLabel! },
    { productId: PACK.productId, title: "5-hour deal pack", priceLabel: PACK.priceLabel },
  ];
  return new MockPurchaseProvider(catalogue);
}

/** True when real purchasing is possible on this build/platform. */
export function purchasesConfigured(): boolean {
  const key = platform() === "ios" ? BRAND.revenueCat.ios : platform() === "android" ? BRAND.revenueCat.android : "";
  return isNative() && !!key;
}
