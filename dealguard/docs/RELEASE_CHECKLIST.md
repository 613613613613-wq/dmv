# Release checklist — Deal Guard 1.0.0 (build 1)

An A-to-Z list for publishing on the Apple App Store and Google Play, with an
optional Samsung Galaxy Store section. Samsung Galaxy phones are served by
Google Play; the Galaxy Store is an additional, optional channel.

Identifiers used throughout:

| Item | Value |
|---|---|
| Bundle id / application id | `com.shlomo.dealguard` |
| Version / build | `1.0.0` / `1` |
| Support | support@dealguard.app |
| Marketing URL | https://dealguard.app |
| Privacy policy URL | https://dealguard.app/privacy |
| Terms URL | https://dealguard.app/terms |
| Category | Business |
| Age rating | 18+ (Apple manual override) / IARC as rated + "Target audience 18+" (Play) — professional tool, not for minors |

## Phase 0 — Before touching the stores

- [ ] `npm run check` passes locally (typecheck, 118 unit tests, build).
- [ ] `npm run e2e` passes; `npm run e2e:screenshots` regenerated
      `fastlane/screenshots/en-US/*.png` and
      `fastlane/metadata/android/en-US/images/phoneScreenshots/*.png`.
- [ ] Icon and splash generated: `npm run assets`.
- [ ] `src/brand.ts` values match `fastlane/metadata/**` and `fastlane/Appfile`.
- [ ] Privacy policy and terms are hosted at https://dealguard.app/privacy and
      https://dealguard.app/terms with the same text as `docs/PRIVACY_POLICY.md`
      and `docs/TERMS_OF_SERVICE.md` (the same text is also shown in-app).
- [ ] `docs/REVIEWER_NOTES.md` reviewed; Demo mode runs end to end with no
      network and no permissions.
- [ ] Legal review of `docs/COMPLIANCE.md`, privacy policy and terms.

## Phase 1 — Apple Developer Program and App Store Connect

- [ ] Enroll in the Apple Developer Program (organization preferred; D-U-N-S
      number required for an organization account).
- [ ] Accept the latest Paid Apps agreement in App Store Connect →
      Business → Agreements. Fill in banking and tax forms (subscriptions will
      not be purchasable until this is done).
- [ ] Certificates, Identifiers & Profiles → Identifiers → register App ID
      `com.shlomo.dealguard` (explicit, not wildcard).
- [ ] Capabilities: **In-App Purchase** on. No Push, no Sign in with Apple, no
      iCloud, no background modes are required. Audio is captured only while
      the app is foregrounded; keep-awake keeps the screen on instead.
- [ ] App Store Connect → My Apps → New App: platform iOS, name **Deal Guard**,
      primary language English (U.S.), bundle id `com.shlomo.dealguard`, SKU
      `dealguard-ios-001`.
- [ ] Create the App Store Connect API key (Users and Access → Integrations →
      App Store Connect API), role App Manager. Store issuer id, key id and the
      `.p8` file as `ASC_KEY_ID`, `ASC_ISSUER_ID`, `ASC_KEY_CONTENT` secrets.
- [ ] Set up `fastlane match` (private git repo for certificates) and store
      `MATCH_GIT_URL`, `MATCH_PASSWORD`. Run `fastlane match appstore` once.
- [ ] In Xcode (`ios/App/App.xcodeproj`, target App): set Team, bundle id,
      `MARKETING_VERSION = 1.0.0`, `CURRENT_PROJECT_VERSION = 1`.
- [ ] `ios/App/App/Info.plist` contains `NSMicrophoneUsageDescription`,
      `NSLocalNetworkUsageDescription`, and ATS `NSAllowsLocalNetworking = YES`.
- [ ] `ios/App/App/PrivacyInfo.xcprivacy` present with reason `CA92.1` for
      UserDefaults (see `docs/DATA_SAFETY.md`).
- [ ] Add `ITSAppUsesNonExemptEncryption = NO` to Info.plist (export
      compliance; the app uses only standard HTTPS/WSS — exempt).

## Phase 2 — Google Play Console

- [ ] Create a Google Play developer account (organization recommended; a
      D-U-N-S number is required for organization accounts; identity
      verification takes days).
- [ ] Set up a merchant profile in Payments (required for paid products).
- [ ] Play Console → Create app: name **Deal Guard**, default language
      English (US), App, Free (monetized via in-app products).
- [ ] Generate the **upload keystore** (kept out of git):

  ```bash
  keytool -genkeypair -v \
    -keystore dealguard-upload.keystore \
    -alias dealguard-upload \
    -keyalg RSA -keysize 4096 -validity 10000 \
    -dname "CN=Deal Guard, O=Deal Guard, C=US"
  ```

- [ ] Create `android/keystore.properties` (gitignored) and reference it from
      `android/app/build.gradle` `signingConfigs.release`:

  ```properties
  storeFile=/absolute/path/dealguard-upload.keystore
  storePassword=********
  keyAlias=dealguard-upload
  keyPassword=********
  ```

- [ ] Confirm `android/keystore.properties`, `*.keystore` and `*.jks` are
      ignored (`dealguard/.gitignore`). Back up the keystore and passwords in
      a password manager. Losing the upload key requires a key reset request
      with Google.
- [ ] Opt in to **Play App Signing** on first upload (Google holds the app
      signing key; you keep the upload key).
- [ ] `android/app/build.gradle`: `applicationId "com.shlomo.dealguard"`,
      `versionCode 1`, `versionName "1.0.0"`, `minSdk` per Capacitor 8
      default, `targetSdk` at the current Play requirement.
- [ ] `AndroidManifest.xml` permissions: `RECORD_AUDIO`, `INTERNET`,
      `WAKE_LOCK`, `com.android.vending.BILLING`. The network security config
      permits cleartext on the base config (Android cannot scope it by IP
      range); the app itself only ever opens `ws://` to private LAN hosts —
      see `docs/DATA_SAFETY.md` → Network security config for the wording
      to use if Play asks.
- [ ] Create a Play service account (Cloud Console → IAM → Service account →
      JSON key), grant it in Play Console → Users and permissions with
      release and financial-data permissions. Store the JSON as
      `PLAY_JSON_KEY`.
- [ ] Build once: `cd android && ./gradlew bundleRelease`; upload the AAB
      manually to Internal testing to unlock the API for `fastlane supply`.

## Phase 3 — RevenueCat

- [ ] Create a RevenueCat project "Deal Guard" with an iOS app
      (`com.shlomo.dealguard`) and an Android app (`com.shlomo.dealguard`).
- [ ] iOS app: upload the App Store Connect **In-App Purchase** API key
      (`.p8`) and the shared secret; enable StoreKit 2.
- [ ] Android app: upload the Play service-account JSON with financial-data
      permission; run the RevenueCat credential check.
- [ ] Products (must exactly match the store products in Phase 4):

  | RevenueCat product | Store id | Type |
  |---|---|---|
  | Dealmaker monthly | `com.shlomo.dealguard.dealmaker.monthly` | Subscription |
  | Dealmaker annual | `com.shlomo.dealguard.dealmaker.annual` | Subscription |
  | Principal monthly | `com.shlomo.dealguard.principal.monthly` | Subscription |
  | Principal annual | `com.shlomo.dealguard.principal.annual` | Subscription |
  | 5 live hours pack | `com.shlomo.dealguard.pack.5h` | Consumable |

- [ ] Entitlements: `dealmaker` (attached to both Dealmaker products) and
      `principal` (attached to both Principal products). The 5h pack grants no
      entitlement; the app credits hours on purchase.
- [ ] Offering `default` with packages `$rc_monthly`, `$rc_annual` for
      Dealmaker, and a second offering or custom packages
      `principal_monthly`, `principal_annual`, plus `pack_5h`. Make `default`
      current.
- [ ] Copy the public SDK keys into CI secrets `VITE_RC_IOS_KEY` and
      `VITE_RC_ANDROID_KEY`. They are baked in at build time. **A build made
      without them must never be submitted**: its paywall hides all plans and
      says "Subscriptions are coming to this build soon", which Apple treats
      as incomplete (2.1). Check the paywall on a TestFlight build first.
- [ ] Sandbox test: iOS sandbox tester account + Play license tester; verify
      purchase, restore, cancellation and consumable credit.

## Phase 4 — In-app products in both stores

### App Store Connect → Monetization

- [ ] Subscription group **Deal Guard Plans** (one group; users can switch
      between the four subscriptions within it).
- [ ] Auto-renewable subscriptions (reference name / product id / price):
  - [ ] Dealmaker Monthly — `com.shlomo.dealguard.dealmaker.monthly` — $99.00 / 1 month
  - [ ] Dealmaker Annual — `com.shlomo.dealguard.dealmaker.annual` — $950.00 / 1 year
  - [ ] Principal Monthly — `com.shlomo.dealguard.principal.monthly` — $249.00 / 1 month
  - [ ] Principal Annual — `com.shlomo.dealguard.principal.annual` — $2,400.00 / 1 year
- [ ] Subscription group levels: Principal above Dealmaker (so a change from
      Dealmaker to Principal is an upgrade).
- [ ] Consumable: 5 Live Hours — `com.shlomo.dealguard.pack.5h` — $49.00.
- [ ] Each product: localized display name and description, a review
      screenshot of the paywall, and status Ready to Submit. Attach all five
      to the 1.0.0 version before submitting (first-time IAPs must be
      submitted with the binary).
- [ ] Subscription "App Store Localization" text and the paywall show price,
      period and the auto-renew wording Apple requires; the paywall links to
      Terms and Privacy.

### Play Console → Monetize

- [ ] Subscriptions: create **two subscriptions** with base plans:
  - [ ] `com.shlomo.dealguard.dealmaker.monthly` — base plan `monthly`, $99.00
  - [ ] `com.shlomo.dealguard.dealmaker.annual` — base plan `annual`, $950.00
  - [ ] `com.shlomo.dealguard.principal.monthly` — base plan `monthly`, $249.00
  - [ ] `com.shlomo.dealguard.principal.annual` — base plan `annual`, $2,400.00

  (Play requires one subscription product per id; keep one base plan each so
  ids match RevenueCat exactly.)
- [ ] In-app product (consumable): `com.shlomo.dealguard.pack.5h` — $49.00.
- [ ] Activate all products. Set prices in USD and let Play convert, or set
      local prices deliberately for key markets.

## Phase 5 — Store listings

### App Store Connect

- [ ] Metadata from `fastlane/metadata/ios/en-US/` (name, subtitle,
      description, keywords, promotional text, release notes, URLs).
- [ ] Primary category Business; no secondary category needed.
- [ ] Screenshots: iPhone 6.7" (1290×2796), at least 3, up to 10, from
      `fastlane/screenshots/en-US/` (`npm run e2e:screenshots`). The project
      is **iPhone-only** (`TARGETED_DEVICE_FAMILY = 1`), so no iPad
      screenshots are needed; if you ever enable iPad, add 13" shots and
      test the layout first.
- [ ] Age rating questionnaire: no objectionable content categories; set
      **18+** manually (Apple's tiers are 4+/9+/13+/16+/18+) because the
      product is a professional business tool not intended for minors. Mark
      "Unrestricted Web Access: No".
- [ ] App Privacy (nutrition labels): **Data Not Collected** for everything
      except **Purchases** (Purchase History, linked to user: No, tracking:
      No, used for App Functionality). Microphone audio is used but not
      collected. See `docs/DATA_SAFETY.md`.
- [ ] Review Information: contact from
      `fastlane/metadata/ios/review_information/`, sign-in not required,
      notes from `docs/REVIEWER_NOTES.md` (Demo mode instructions).
- [ ] Content Rights: does not contain third-party content.
- [ ] Export compliance: "Uses encryption: Yes; only standard/exempt
      encryption (HTTPS/WSS)" — no documentation needed.
- [ ] Pricing: Free. Availability: chosen territories.

### Play Console

- [ ] Main store listing from `fastlane/metadata/android/en-US/` (title,
      short description, full description, changelog).
- [ ] Graphics: app icon 512×512, feature graphic 1024×500, phone
      screenshots (min 2, 16:9 to 9:16) from
      `fastlane/metadata/android/en-US/images/phoneScreenshots/`.
- [ ] App content:
  - [ ] Privacy policy URL.
  - [ ] Ads: No.
  - [ ] App access: "All functionality is available without special access"
        plus the Demo-mode instructions from `docs/REVIEWER_NOTES.md`.
  - [ ] Content rating (IARC questionnaire): Utility/Productivity, no
        violence, no user-generated public content, no sharing of location,
        allows purchases. Target audience 18+.
  - [ ] Target audience and content: 18 and over; not designed for children.
  - [ ] News app: No. COVID-19 contact tracing: No. Government app: No.
  - [ ] Data safety: see `docs/DATA_SAFETY.md` (audio processed ephemerally,
        purchase history collected by Google Play; no data shared for
        advertising).
  - [ ] Financial features: none (the app does not provide loans or banking).
  - [ ] Health: not a health app.
- [ ] Category Business; tags Productivity, Business tools.
- [ ] Contact details: support@dealguard.app, https://dealguard.app.

## Phase 6 — Beta

- [ ] `bundle exec fastlane ios beta` from `dealguard/` → TestFlight build 1.
- [ ] TestFlight: fill test information, add internal testers, then an
      external group (external testing needs a Beta App Review; use the same
      reviewer notes).
- [ ] `bundle exec fastlane android internal` → Play Internal testing track.
- [ ] Add testers by email list; verify install, Demo mode, Live mode with a
      real Deepgram key, Companion mode with `npm run mock-hud`, purchase
      flow in sandbox, restore purchases, Export/Delete data.
- [ ] Run through `docs/PILOT_BENCHMARKS.md` Phase 1–3 gates on a real device.
- [ ] Crash-free on iPhone 12 or newer and on a mid-range Android (e.g.
      Pixel 6a, Galaxy A-series).

## Phase 7 — Submission

- [ ] Bump nothing (first release stays 1.0.0 / 1). For later releases see
      "Version bump procedure".
- [ ] iOS: `bundle exec fastlane ios release` uploads the build and metadata
      with `submit_for_review: false`; then in App Store Connect select the
      build, attach the five IAPs, answer export compliance, and press
      **Submit for Review**. Choose manual release.
- [ ] Android: `bundle exec fastlane android production` uploads to the
      production track as a **draft**; in Play Console review the release
      and start a **staged rollout at 10%**.
- [ ] Expect Apple to test Demo mode and the paywall; keep the sandbox
      products active. Common rejection points: paywall missing price/period,
      privacy policy link unreachable, microphone purpose string too vague.

## Phase 8 — Post-launch

- [ ] iOS: release the approved build manually; Android: raise rollout 10% →
      50% → 100% over several days, watching Android vitals (crash rate,
      ANR).
- [ ] Monitor RevenueCat charts (trials, conversions, refunds) and App Store
      Connect / Play Console reviews daily for the first two weeks.
- [ ] Watch support@dealguard.app; answer store reviews.
- [ ] Verify Deepgram, Gemini and Groq API changes do not break Live mode or
      Help Now (they are user-keyed; failures degrade to templates).
- [ ] Keep the privacy policy "last reviewed" date current when anything
      in the data flow changes.

## Optional — Samsung Galaxy Store

Galaxy devices install Deal Guard from Google Play. Listing on the Galaxy
Store is optional extra distribution.

- [ ] Register at Samsung Seller Portal (seller.samsungapps.com) as a
      Commercial seller (requires business verification).
- [ ] Add New Application → Android; upload the **same release AAB or a
      signed APK** built by `./gradlew bundleRelease` / `assembleRelease`
      with the upload key. Galaxy Store does not use Play App Signing, so an
      APK must be signed with your own release key; keep it in the same
      keystore.
- [ ] In-app purchases: Galaxy Store uses Samsung IAP, which RevenueCat does
      not support for this app. Either leave subscriptions Play-only and
      state on the listing that plans are purchased via Google Play, or omit
      the paywall in a Galaxy-specific build. Do not ship Play Billing to
      the Galaxy Store.
- [ ] Complete Samsung's content rating questionnaire (IARC).
- [ ] Reuse the Play listing text and screenshots; add a 1440×1440 hi-res
      icon if requested.
- [ ] Submit for Galaxy Store review (typically several business days) and
      handle any device-compatibility flags.

## Version bump procedure

For every release after 1.0.0 (1), update all four places, then commit:

1. `dealguard/package.json` → `"version": "X.Y.Z"` (also mirrored in
   `src/brand.ts` `version`).
2. iOS: `ios/App/App.xcodeproj/project.pbxproj` → `MARKETING_VERSION = X.Y.Z;`
   and `CURRENT_PROJECT_VERSION = N;` (both occurrences: Debug and Release).
   Build numbers must strictly increase per version on TestFlight.
3. Android: `android/app/build.gradle` → `versionName "X.Y.Z"` and
   `versionCode N` (monotonic across all uploads, never reused).
4. `fastlane/metadata/ios/en-US/release_notes.txt` and
   `fastlane/metadata/android/en-US/changelogs/<versionCode>.txt`.

Run `npm run cap:sync`, then the beta lanes, then the release lanes.
