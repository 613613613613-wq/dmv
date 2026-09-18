# Pilot benchmarks and acceptance gates

Deal Guard is judged on whether it helps a dealmaker without pulling their
attention off the conversation. Four metrics from the product plan define
"works"; four phase gates define "ready".

## Benchmark matrix

| Metric | Target | Fail condition | Measured by |
|---|---|---|---|
| Median time-to-useful-cue | ≤ 250 ms after the end of the counterparty's turn | > 600 ms median | In-app: `session.ts` records `cueShownAt − turnFinalAt` per cue; median shown on the end-of-call screen as "median latency". |
| Factual hallucination rate | 0.0% | Any invented metric (a number not in the vault or the last 30 s of transcript) | In-app: `advisor/guard.ts` rejects and counts guard failures; pilot: reviewer checks every cue and talking point against the vault. |
| False-interruption rate | < 2 unprompted cues per 30-minute call | Screen "constantly flashing" (≥ 2 per 30 min, or user reports distraction) | In-app: count of tier-1/2 cues not preceded by a Help Now press, normalized to 30 min; shown as "unsolicited cues / 30 min". |
| Cognitive disruption score | User reports feeling "in control and focused" | User stops listening to read the screen | Post-call survey (5-point scale, see protocol); observer notes eye-on-screen episodes > 2 s. |

The end-of-call screen shows: median latency, unsolicited cues per 30 min,
speculative hits (cues prepared on interim text and confirmed by the final),
red flags, fact cards. Screenshot it after each pilot call and paste the values
into the protocol table below.

### How each in-app number is computed

- **Turn end** = the STT `final` event for a counterparty segment (Live) or
  the scripted line's end (Demo).
- **Cue shown** = the HUD render commit of a cue triggered by that turn.
- **Median latency** = median over all cues in the session. Demo mode
  measures engine + render only; Live mode additionally includes Deepgram
  round trip, which is why the fail threshold (600 ms) is far above target.
- **Unsolicited cue** = any tier-1 or tier-2 cue. Tier-3 talking points are
  always solicited and excluded.
- **Speculative hit** = a cue prepared by `speculative.ts` on an interim
  transcript that the final transcript confirmed unchanged. A speculative
  miss (cancelled cue) is not shown to the user and does not count as an
  interruption unless it reached the screen.

## Phase gates

| Phase | Gate | Pass criterion | Status |
|---|---|---|---|
| 1 | **Interruption Test** | On a 30-minute recorded negotiation containing no boundary violations, the HUD shows 0 red flags and < 2 fact cards that were not direct questions about a vaulted term. Demo script and a 30-min small-talk transcript both produce zero cards. | Covered by `tests/gating.test.ts` (small-talk corpus → 0 cues) |
| 2 | **Accuracy Test** | 20 adversarial lines (misquoted prices, shifted dates, wrong deposit percentages, DSCR/cap rate swaps, disguised confidential disclosures) → 20/20 detected with the correct tier and topic; 0 cues on the control lines. | Passing: 118 unit tests incl. the 20-line adversarial suite |
| 3 | **Peripheral Vision Test** | With the phone flat on a desk at arm's length, a user reading a document notices a red flag within 2 s in ≥ 9 of 10 trials and can read the ≤ 12-word headline in one glance (< 1.5 s eye dwell). Haptic fires on tier 1. | Manual, on device, 3 users |
| 4 | **Live Pilot** | 20 real or role-played calls (protocol below). All four matrix metrics met on aggregate; no factual hallucination in any call; ≥ 80% of participants rate control/focus ≥ 4/5. | Pending |

Gates are cumulative: Phase 4 does not start until 1–3 pass on the release
candidate build.

## Live Pilot protocol (20 scenarios)

Setup for each scenario:

1. Load the dossier with the scenario's terms; set walk-away values and mark
   at least one term `internal_confidential`.
2. Run pre-flight (jurisdiction, disclosure read aloud, speaker calibration).
3. Counterparty (role-player) follows a script with the listed number of
   planted violations; unplanned deviations are noted.
4. Host takes the call with the phone flat on the desk. Observer times
   eye-on-screen episodes.
5. End meeting; record the end-of-call numbers; export the memorandum;
   host completes the survey.

Survey (after each call): "I felt in control and focused" (1–5); "I stopped
listening to read the screen" (never / once / several times / constantly);
"A cue was wrong or invented" (yes / no + which).

### Scenario table

| # | Scenario | Deal type | Counterparty type | Planted red flags | Expected fact cards | Median latency | Unsolicited / 30 min | Red flags caught | Hallucinations | Focus (1–5) | Result |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Price restated $200k high after agreement | CRE acquisition | Aggressive broker | 1 | 2 | | | /1 | | | |
| 2 | Earnest deposit % misquoted | CRE acquisition | Polite, slow | 1 | 1 | | | /1 | | | |
| 3 | Inspection window shortened mid-call | CRE acquisition | Fast talker | 2 | 1 | | | /2 | | | |
| 4 | Closing date pulled forward twice | CRE acquisition | Two counterparties | 2 | 2 | | | /2 | | | |
| 5 | Financing contingency "waived" assumed | CRE acquisition | Lender's counsel | 1 | 1 | | | /1 | | | |
| 6 | Cap rate quoted 50 bps off | CRE disposition | Institutional buyer | 1 | 2 | | | /1 | | | |
| 7 | Host about to reveal walk-away price | CRE acquisition | Friendly | 1 (confidential) | 0 | | | /1 | | | |
| 8 | No violations; heavy small talk | CRE acquisition | Chatty | 0 | 1 | | | /0 | | | |
| 9 | DSCR covenant misstated | Lending / term sheet | Credit officer | 1 | 2 | | | /1 | | | |
| 10 | Rate spread vs agreed | Lending | Relationship banker | 1 | 1 | | | /1 | | | |
| 11 | Amortization term shifted 25→20 yr | Lending | Terse | 1 | 1 | | | /1 | | | |
| 12 | Prepayment penalty reintroduced | Lending | Counsel | 1 | 1 | | | /1 | | | |
| 13 | Host concedes below walk-away | Lending | Pressuring | 1 (boundary audit) | 0 | | | /1 | | | |
| 14 | Valuation cap misquoted | M&A term sheet | Founder | 1 | 2 | | | /1 | | | |
| 15 | Escrow holdback % and period both wrong | M&A term sheet | Buyer's CFO | 2 | 1 | | | /2 | | | |
| 16 | Exclusivity period extended | M&A term sheet | Banker | 1 | 1 | | | /1 | | | |
| 17 | Earn-out threshold misstated | M&A term sheet | Aggressive | 1 | 2 | | | /1 | | | |
| 18 | Non-native English speaker, accent | CRE acquisition | Broker | 1 | 1 | | | /1 | | | |
| 19 | Speakerphone, background noise | Lending | Banker | 1 | 1 | | | /1 | | | |
| 20 | Cross-talk, two people overlapping | M&A term sheet | Founder + counsel | 2 | 1 | | | /2 | | | |

Totals: 24 planted red flags (incl. 1 confidential-disclosure and 1
boundary-audit case), 24 expected fact cards.

### Aggregate pass criteria for Phase 4

- Red flags caught: ≥ 23/24 (≥ 95%); scenario 7 and 13 must both pass.
- Hallucinations: 0 across all 20 calls.
- Median of per-call median latency ≤ 250 ms (Demo/Companion) or ≤ 600 ms
  including Deepgram (Live), with no call above the fail threshold.
- Unsolicited cues per 30 min: mean < 2, and scenario 8 ≤ 1.
- Focus rating ≥ 4/5 in ≥ 16 of 20 calls; no "constantly" on the
  stopped-listening question.
- Memorandum reviewed against the recording by the observer: every agreed
  term and its mm:ss within ±5 s.

## Recording results

Copy this file to `docs/pilot/YYYY-MM-DD-<cohort>.md`, fill the table, attach
the end-of-call screenshots and exported memoranda (redact real counterparties
if the pilot used live deals) and note the build number from Settings → About.
