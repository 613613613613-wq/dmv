# Architecture

Deal Guard is a Capacitor 8 shell around a Vite/React web bundle. All deal
logic lives in `src/engine/` as pure TypeScript with no DOM or native
dependencies, which is what makes it unit-testable (118 Vitest tests) and
reusable by the desktop daemon in Companion mode. The UI in `src/ui/` renders
whatever the engine publishes and nothing more.

Design rules the engine enforces:

1. **Deterministic facts.** Red flags and fact cards are produced by rules over
   the user's own term vault. No model is consulted for facts.
2. **One cue at a time.** The gate publishes at most one cue; a new cue
   replaces the old one only if it outranks it or the old one expired.
3. **≤ 12 words + one source line.** Every cue carries a headline and a
   source such as `PSA_Draft_v3_Clean.pdf · 2026-08-15`.
4. **Zero persistence of audio and raw transcript.** Both are RAM-only and
   are dropped when the memorandum is built.

## Pipeline

```
 ┌──────────────┐  16 kHz PCM  ┌──────────────┐ 50 ms / 800-sample frames ┌───────────────────┐
 │  Microphone  │─────────────▶│   capture    │──────────────────────────▶│      chunker      │
 │ (Live mode)  │              │ audio/capture│                           │  audio/chunker    │
 └──────────────┘              └──────────────┘                           │ bounded queue 100 │
                                                                          │ drop oldest       │
 ┌──────────────┐  scripted lines                                         │ non-speech > 20   │
 │  Demo script │────────────────────────────┐                            └─────────┬─────────┘
 │  demoDeal.ts │                            │                                      │ binary frames
 └──────────────┘                            ▼                                      ▼
                                   ┌──────────────────┐                   ┌───────────────────┐
                                   │    stt/mock      │                   │   stt/deepgram    │
                                   │ (Demo mode)      │                   │ nova-3 WS, diarize│
                                   └────────┬─────────┘                   └─────────┬─────────┘
                                            │        interim / final events         │
                                            └──────────────────┬────────────────────┘
                                                               ▼
                                                    ┌───────────────────┐
                                                    │    normalize      │  numbers, %, dates,
                                                    │  normalize.ts     │  speaker tags
                                                    └─────────┬─────────┘
                                                              ▼
                                       ┌──────────────────────────────────────────┐
                                       │               classify.ts                │
                                       │ OFFER · CONCESSION · REJECTION           │
                                       │ QUESTION · AGREEMENT  (+ verbatim text)  │
                                       └──────────┬───────────────────┬───────────┘
                                                  │                   │
                             interim ▼            │                   │ final
                                ┌─────────────────┴───┐         ┌─────┴───────────┐
                                │  speculative.ts     │         │   ledger.ts     │
                                │ prepare candidate   │         │ typed assertion │
                                │ cue before turn end │         │ + mm:ss stamp   │
                                └──────────┬──────────┘         └─────────────────┘
                                           ▼
                                ┌─────────────────────┐   term vault (store/vault.ts, terms.ts)
                                │      gating.ts      │◀───────────────────────────────────────
                                │ Tier 1 RED FLAG     │
                                │ Tier 2 FACT CARD    │
                                │ Tier 3 TALKING POINT│  (Help Now only)
                                │ else: blank         │
                                └──────────┬──────────┘
                                           │ 0 or 1 cue
                                           ▼
                                ┌─────────────────────┐
                                │     Glance HUD      │  black screen, one headline,
                                │     ui/views        │  one source line
                                └─────────────────────┘

 "End meeting" ──▶ memorandum.ts ──▶ Deal Memorandum (< 1 s)
                   agreed terms (mm:ss) · open issues · boundary audit
                   raw transcript discarded
```

### Stage by stage

| Stage | Module | Notes |
|---|---|---|
| Capture | `src/engine/audio/capture.ts` | Requests the microphone (Live mode only), produces mono 16 kHz PCM. |
| Chunking | `src/engine/audio/chunker.ts` | Cuts 50 ms / 800-sample frames. Bounded queue of 100 frames; when more than 20 frames are queued, the oldest **non-speech** frames are dropped first so latency stays bounded without losing words. |
| STT | `src/engine/stt/deepgram.ts`, `src/engine/stt/mock.ts`, `src/engine/stt/types.ts` | Deepgram nova-3 streaming over WebSocket with diarization, emitting `interim` and `final` events. The mock replays `demoDeal.ts` with realistic timing and needs no network. |
| Normalize | `src/engine/normalize.ts` | Spoken numbers, percentages, currency, dates and durations become comparable values ("two point four" → 2.4M when the topic is price). |
| Classify | `src/engine/classify.ts` | Assigns OFFER / CONCESSION / REJECTION / QUESTION / AGREEMENT plus the topic (price, deposit, inspection window, financing contingency, closing date, cap rate, DSCR, ...). |
| Terms | `src/engine/terms.ts` | The term model: value, unit, status (`hard_cap` / `negotiable` / `agreed` / `internal_confidential`), source document and date; boundary checks against walk-away values. |
| Speculative | `src/engine/speculative.ts` | Works on interim transcripts so a cue is ready when the turn ends. Confirmed or cancelled by the final event. Counted as "speculative hits" on the end-of-call screen. |
| Gate | `src/engine/gating.ts` | Decides tier: **1 RED FLAG** (contradiction, walk-away crossed, or the user is about to disclose an `internal_confidential` figure), **2 FACT CARD** (question about a known term), **3 TALKING POINT** (only on Help Now). Anything else stays blank. Enforces one visible cue, TTL and word limit. |
| Ledger | `src/engine/ledger.ts` | Append-only list of typed assertions with verbatim text and `mm:ss` offsets. |
| Session | `src/engine/session.ts` | State machine: idle → pre-flight → live → ended. Owns latency counters (median time-to-cue, unsolicited cues per 30 min, red flags, fact cards, speculative hits). |
| Memorandum | `src/engine/memorandum.ts` | Builds the Deal Memorandum from ledger + vault: agreed terms with timestamps, open issues, and a ledger audit of any agreement outside pre-call boundaries. |
| Vault | `src/engine/store/vault.ts` | Structured terms, ledger, memoranda and settings on Capacitor Preferences; API keys and the companion token in the platform secure store (`capacitor-secure-storage-plugin`: iOS Keychain / Android Keystore). Export (keys redacted) and delete-all live here. |

## Help Now (advisor)

```
Help Now ──▶ advisor/templates.ts  (deterministic talking point from the vault)
        └──▶ advisor/llm.ts        (optional: Gemini 2.5 Flash or Groq Llama 3.3 70B, user's key)
                    │
                    ▼
             advisor/guard.ts      every number in the output must exist in the vault
                                   or in the last 30 s of transcript; otherwise the
                                   template answer is used instead
```

The LLM path is off unless the user configures a key in Settings. The guard is
the reason the factual hallucination rate target is 0.0%: an invented figure
never reaches the screen.

## Companion mode

`src/engine/companion/protocol.ts` defines and validates the JSON frames;
`src/engine/companion/link.ts` owns the WebSocket, reconnect with exponential
backoff (500 ms → 10 s) and the pong/dismiss/freeze/help replies. In this mode
the phone runs no STT and no gate; it renders cues published by a desktop
daemon. See `COMPANION_PROTOCOL.md`.

## Compliance

`src/engine/compliance/consent.ts` holds the jurisdiction table (one-party vs
all-party), the disclosure script and the calendar disclaimer. The pre-flight
step cannot be skipped in Live or Companion mode. See `COMPLIANCE.md`.

## Billing

`src/engine/billing/plans.ts` lists plans and product ids,
`entitlements.ts` maps RevenueCat entitlements (`dealmaker`, `principal`) and
the consumable 5-hour pack to quotas, and `provider.ts` wraps
`@revenuecat/purchases-capacitor`. With no `VITE_RC_*` key at build time the
paywall renders plans and shows "Purchases not configured".

## Native layer

Capacitor plugins used: `@capacitor/preferences`, `capacitor-secure-storage-plugin`, `haptics`, `status-bar`,
`splash-screen`, `app`, `share`, `@capacitor-community/keep-awake` (screen stays
on during a call) and `@revenuecat/purchases-capacitor`. Thin wrappers live in
`src/native/` so the engine and UI can run in a plain browser for tests and
Playwright screenshots.

Platform permissions:

- iOS: `NSMicrophoneUsageDescription`, `NSLocalNetworkUsageDescription`,
  ATS `NSAllowsLocalNetworking` (Companion mode).
- Android: `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`, `INTERNET`; network
  security config allows cleartext only for Companion LAN mode.

## Testing

- `npm test` — Vitest. Includes the Phase-2 Accuracy Test: 20 adversarial
  lines, 100% detected, and zero cards on small talk.
- `npm run e2e` — Playwright (Chromium) drives the web bundle through
  onboarding, demo call and memo.
- `npm run e2e:screenshots` — writes iPhone 6.7" (1290×2796) PNGs to
  `fastlane/screenshots/en-US/` and Android phone PNGs to
  `fastlane/metadata/android/en-US/images/phoneScreenshots/`.
