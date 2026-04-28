# DMV Permit Prep

Native iOS permit-test prep, shipped as one App Store SKU per state. Privacy-first. Offline-first. Buy-once.

This is the V1 scaffold — engine + tests + SwiftUI app shell + Florida sample content. **Not yet shippable.** Still needed: full 400-question Florida bank with handbook citations and translations, App Store assets, accuracy review per state. See `docs/CONTENT_PIPELINE.md`.

## What's here

```
.
├── Package.swift               SwiftPM manifest for the engine library
├── project.yml                 XcodeGen — produces DMVPrep.xcodeproj with one scheme per state
├── Sources/DMVEngine/          Engine: models, content pack loader, SRS, mock test, store, audio
├── Tests/DMVEngineTests/       Engine unit tests — runnable with `swift test`
├── App/                        SwiftUI app shell (state-agnostic; reads STATE_CODE at launch)
│   ├── DMVPrepApp.swift
│   ├── AppEnvironment.swift
│   ├── Views/                  Home, Practice, Mock test, Result, Review, Bookmarks, Settings, Paywall
│   └── Resources/Info.plist
├── ContentPacks/
│   └── florida.json            15 SAMPLE questions — engine validation only
└── docs/
    ├── BUILD.md                How to generate the Xcode project, run tests, ship
    ├── CONTENT_PIPELINE.md     How to write a state's question bank
    ├── COMPETITIVE_ANALYSIS.md Market scan, positioning recommendations
    └── ANDROID_WEB_DEFERRED.md Why Android & web are V2; what changes if we lift that
```

## Quick start

```sh
# Verify the engine works (no Xcode needed)
swift run SmokeCheck

# Generate the Xcode project and open it
brew install xcodegen
xcodegen
open DMVPrep.xcodeproj
# Pick the Florida scheme, ⌘R in the simulator
# ⌘U runs the XCTest suite (requires Xcode, not just Command Line Tools)
```

## Architecture summary

The doc that drove this scaffold lives at `~/Downloads/file7s/dmv_app_architecture.md`. Highlights:

- **One engine, 51 states.** Each state ships as a separate App Store SKU (separate bundle ID, listing, ASO). Internally they're the same binary with a different bundled JSON content pack.
- **No network.** No analytics SDKs. No accounts. App Store privacy label target: "Data Not Collected."
- **SM-2 spaced repetition** — implemented in `Sources/DMVEngine/SRSEngine.swift`, tested in `Tests/DMVEngineTests/SRSEngineTests.swift`.
- **Stratified mock test** — exam mode samples by category weight to mirror the real state exam exactly. See `MockTestGenerator.swift`.
- **StoreKit 2, buy-once.** No subscriptions, ever. `Sources/DMVEngine/Store/StoreManager.swift`.
- **GRDB for local persistence.** Schema in `Sources/DMVEngine/Storage/Schema.swift`. The engine package itself has zero dependencies; the app target wires GRDB into the `ProgressStore` protocol.

## Competitive context

`docs/COMPETITIVE_ANALYSIS.md` has the full scan. Two findings drive product positioning:

1. **No major competitor publishes a "Data Not Collected" privacy label.** Zutobi, Aceable, DMV Genie, DriversEd.com all track. Privacy + buy-once is a structural wedge none of them can match without rebuilding their business.
2. **State-accurate ≠ what most apps deliver.** Generic "DMV" branding dominates even though only ~25 states use that acronym (FL = FLHSMV, TX = TX DPS, MD = MVA, MA = RMV). Pairing "FLHSMV-accurate" with "every wrong answer cites the handbook page" is a credible accuracy claim no surveyed competitor advertises.

Recommended App Store messaging:
- **Subtitle:** *"Privacy-first. No accounts. No tracking. Yours forever for one payment."*
- **Body:** *"Florida-accurate. Real FLHSMV laws, real fines, every wrong answer cites the handbook page."*
- **Pricing:** $5.99–$7.99 one-time per state.

## What's deliberately not here

- **Android, web** — deferred per architecture principle #5. See `docs/ANDROID_WEB_DEFERRED.md` for the path forward when we revisit.
- **GRDB integration** — the engine defines the `ProgressStore` protocol and ships an `InMemoryProgressStore`. The app target wires the GRDB-backed implementation; that's a 50-line file added during the next pass.
- **App icon, accent color, screenshots** — placeholders; needs design work.
- **Localizations beyond English** — translation strings exist in the JSON but the `.lproj/Localizable.strings` files for the SwiftUI shell aren't populated yet.
- **The other ~385 Florida questions** — see `docs/CONTENT_PIPELINE.md` for the workflow.
- **Other 50 states** — Florida is the launch state per the doc.

## Status

| Layer | Status |
|---|---|
| Engine (models, SRS, mock generator, content loader) | ✅ Built, tested |
| SwiftUI app shell | ✅ Built — practice, mock, review, bookmarks, settings, paywall |
| Florida sample content (15 Qs) | ✅ Engine-validated |
| Florida full content (~400 Qs) | ❌ Per pipeline doc |
| App Store assets (icon, screenshots, ASO) | ❌ Needs design |
| GRDB-backed ProgressStore | ❌ Stub only |
| Localizations (ES, HT) | ❌ Strings exist in pack, not in UI |
| Fastlane / CI | ❌ Sketched in BUILD.md |
| Android, web | 🚫 Deferred — see ANDROID_WEB_DEFERRED.md |
