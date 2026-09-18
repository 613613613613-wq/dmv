export interface Offering {
  productId: string;
  title: string;
  priceLabel: string;
}

export interface EntitlementSnapshot {
  /** Active entitlement identifiers ("dealmaker", "principal", "enterprise"). */
  entitlements: string[];
  /** Latest expiration among active entitlements, ISO, or null when unknown / lifetime. */
  expiresAt: string | null;
}

export interface PurchaseResult {
  ok: boolean;
  /** Product ids now owned (for packs) or active entitlement ids (for subscriptions). */
  productIds: string[];
  entitlements: string[];
  error?: string;
  cancelled?: boolean;
}

/**
 * Store abstraction. The native implementation (src/native/purchases.ts) wraps
 * RevenueCat so one codebase covers StoreKit 2 and Google Play Billing. The
 * mock keeps the web build and tests independent of the stores.
 */
export interface PurchaseProvider {
  readonly id: "mock" | "revenuecat";
  available(): boolean;
  configure(): Promise<void>;
  offerings(): Promise<Offering[]>;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
  /** Current store truth without user interaction (cached by the SDK). null when unavailable. */
  currentEntitlements(): Promise<EntitlementSnapshot | null>;
  /** Fires whenever the store reports a change (renewal, refund, cancellation). */
  onEntitlementsChanged(cb: (snap: EntitlementSnapshot) => void): () => void;
  /** Manage-subscription deep link (App Store / Play). */
  manageUrl(): string | null;
}

export class MockPurchaseProvider implements PurchaseProvider {
  readonly id = "mock" as const;
  private owned = new Set<string>();

  constructor(private readonly catalogue: Offering[]) {}

  available(): boolean {
    return true;
  }
  async configure(): Promise<void> {}
  async offerings(): Promise<Offering[]> {
    return this.catalogue;
  }
  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.catalogue.some((o) => o.productId === productId)) return { ok: false, productIds: [], entitlements: [], error: "unknown product" };
    this.owned.add(productId);
    return { ok: true, productIds: [productId], entitlements: entitlementsFor([...this.owned]) };
  }
  async restore(): Promise<PurchaseResult> {
    return { ok: true, productIds: [...this.owned], entitlements: entitlementsFor([...this.owned]) };
  }
  async currentEntitlements(): Promise<EntitlementSnapshot | null> {
    return { entitlements: entitlementsFor([...this.owned]), expiresAt: null };
  }
  onEntitlementsChanged(): () => void {
    return () => undefined;
  }
  manageUrl(): string | null {
    return null;
  }
}

export function entitlementsFor(productIds: string[]): string[] {
  const out = new Set<string>();
  for (const p of productIds) {
    if (p.includes(".principal.")) out.add("principal");
    else if (p.includes(".dealmaker.")) out.add("dealmaker");
  }
  return [...out];
}
