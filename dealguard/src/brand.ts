/**
 * Single place to rename or re-identify the product.
 * Everything user-visible (app name, URLs, bundle id) reads from here so the
 * working title can be swapped for "Redline Live" / "Boundry" in one edit.
 */
export const BRAND = {
  name: "Deal Guard",
  tagline: "Never concede what you already agreed.",
  bundleId: "com.shlomo.dealguard",
  companyName: "Deal Guard",
  supportEmail: "support@dealguard.app",
  websiteUrl: "https://dealguard.app",
  privacyUrl: "https://dealguard.app/privacy",
  termsUrl: "https://dealguard.app/terms",
  version: "1.0.0",
  /** RevenueCat public SDK keys. Leave empty until products exist in the stores. */
  revenueCat: {
    ios: import.meta.env?.VITE_RC_IOS_KEY ?? "",
    android: import.meta.env?.VITE_RC_ANDROID_KEY ?? "",
  },
} as const;
