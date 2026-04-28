# Android & Web — Deferred to V2+

The architecture doc (`Apple principle #5`) commits to **native iOS only** for V1: SwiftUI + Swift, no React Native, no Flutter. The reasoning is in §1 of the architecture doc — native = trust, performance, accessibility, Apple Watch, smaller binary.

Adding Android and web means choosing one of three paths, each with real tradeoffs. **Pick before code is written**, because the choice cascades.

## Option A — Three native codebases (recommended for V2+)

- **iOS** — this repo, SwiftUI / Swift (already built).
- **Android** — separate Kotlin + Jetpack Compose repo. The same content pack JSON ships unchanged. The engine logic (SRS, mock test generator, content pack loader) is re-implemented; the algorithms are tiny so this is days of work, not weeks. SQLite via Room.
- **Web** — Next.js + TypeScript + IndexedDB. Same content pack JSON. PWA for offline.

**Pros:** Best per-platform feel. Matches "Privacy-first / Offline-first" promise on every platform. Each platform's accessibility primitives (VoiceOver, TalkBack, ARIA) get used natively.
**Cons:** 3× the maintenance. Engine logic exists in three forms — content authoring stays single-source-of-truth (one JSON), but the algorithms drift unless you write a contract test suite that runs against all three implementations.

## Option B — Cross-platform (Flutter / React Native)

- One codebase, three platforms.
- **Pros:** ~1 dev across all platforms. Faster cross-state ASO rollout.
- **Cons:** Violates principle #5 of the architecture doc. Cross-platform accessibility on iOS specifically is a known gap (VoiceOver lag, Dynamic Type quirks, especially with React Native). Bigger binary. Smaller App Store trust signal. Privacy posture is harder — RN/Flutter apps tend to pull in analytics dependencies through transitive packages.
- **Verdict:** Only consider if the team is one engineer and shipping Android matters more than per-platform polish.

## Option C — iOS native + responsive web only (skip Android)

- iOS gets everything (this repo).
- Web gets a Next.js companion that handles SEO, the landing page, FAQ, support, *and* a free practice-test page that doubles as marketing.
- Android is deferred until iOS revenue justifies it.
- **Pros:** Web doubles as marketing acquisition. Android is the smaller market for permit-test apps in the US (iPhone share among teens is high in this category). Skips the Android long tail until economics demand it.
- **Cons:** "Why no Android?" is a real customer support question that costs you reviews and word-of-mouth.

## Recommended sequence

1. **V1 Florida iOS** — this repo. Ship.
2. **V1.x marketing web** — Next.js landing page + 50-question free demo. SEO acquisition for the iOS app.
3. **V2 Android (Compose)** — once 5 states are revenue-positive on iOS. Re-implement the engine in Kotlin; reuse the JSON content packs unchanged.
4. **V2.x full web app** — IndexedDB + service worker for offline; gated by demand.

## Shared assets across platforms

Whatever path is chosen, these stay single-source-of-truth and never get duplicated:

- **Content packs** — `ContentPacks/*.json`. Schema is in `Sources/DMVEngine/Models/`.
- **Translations of UI strings** — keep in a separate `i18n/` directory referenced by all three platforms.
- **Brand assets** — logo, colors, screenshots.
- **Privacy policy and ToS** — one canonical version on the web.

The content pipeline (`docs/CONTENT_PIPELINE.md`) is platform-independent — write the question once, ship to all three.
