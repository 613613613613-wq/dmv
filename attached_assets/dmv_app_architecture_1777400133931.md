# DMV Permit Prep App — Technical Architecture

> One iOS engine, 51 content packs, shipped as separate App Store SKUs.
> Privacy-first. Offline-first. Audit-ready.

---

## 1. Product principles (non-negotiable)

| # | Principle | What it means in code |
|---|---|---|
| 1 | **Privacy is the wedge** | No analytics SDKs. No third-party SDKs *at all* in v1 except StoreKit. No accounts. Local-only data. |
| 2 | **Offline-first** | Full functionality with airplane mode on. No network calls during exam taking. |
| 3 | **State-accurate** | Real agency name (DPS not DMV in TX, MVA in MD, RMV in MA). Real fines. Real laws. |
| 4 | **Buy once** | StoreKit one-time purchase only. Optional IAPs for Pro features, never subscriptions. |
| 5 | **Native iOS** | SwiftUI + Swift. No React Native, no Flutter. Native = trust + performance + Apple Watch + accessibility. |
| 6 | **Separate SKU per state** | Each state = its own bundle ID, App Store listing, ASO, screenshots. Same engine binary internally. |

---

## 2. High-level architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  iOS App (Swift / SwiftUI)                                      │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  TestEngine  │  │  SRSEngine   │  │  AudioNarrator     │    │
│  │  (practice/  │  │  (SM-2 algo) │  │  (AVSpeech)        │    │
│  │   mock test) │  │              │  │                    │    │
│  └──────────────┘  └──────────────┘  └────────────────────┘    │
│         │                   │                   │              │
│         ▼                   ▼                   ▼              │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Content Pack Loader (reads bundled JSON for this state) │  │
│  └──────────────────────────────────────────────────────────┘  │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Local SQLite (user progress, bookmarks, wrong-answers)  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  StoreKit 2 (purchases, restore, IAP)                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

NO NETWORK CALLS during normal use. Optional CloudKit sync is opt-in only.
```

---

## 3. Content pack structure

Each state ships as a **JSON bundle** baked into the app's resources.
The same engine reads `florida.json`, `texas.json`, etc. — you build one, you ship 51.

### `state.json` (top-level metadata)

```json
{
  "code": "FL",
  "name": "Florida",
  "agency": {
    "name": "FLHSMV",
    "fullName": "Florida Department of Highway Safety and Motor Vehicles",
    "url": "https://www.flhsmv.gov"
  },
  "exam": {
    "officialName": "Class E Knowledge Exam",
    "questionCount": 50,
    "passingScore": 40,
    "passingPercent": 80,
    "timeLimitMinutes": null,
    "sectionFormat": "single",
    "retakeRule": "After 48 hours; same-day retake also allowed",
    "feeRetake": 11.74
  },
  "languages": {
    "ui": ["en", "es", "ht"],
    "test": ["en"],
    "note": "FL switched to English-only testing on Feb 6, 2026. We provide Spanish/Creole STUDY mode only."
  },
  "categories": [
    { "id": "signs",       "name": "Road Signs",        "weight": 0.25 },
    { "id": "row",         "name": "Right of Way",      "weight": 0.15 },
    { "id": "rules",       "name": "Rules of the Road", "weight": 0.20 },
    { "id": "alcohol",     "name": "Alcohol & DUI",     "weight": 0.10 },
    { "id": "parking",     "name": "Parking",           "weight": 0.05 },
    { "id": "fines",       "name": "Fines & Penalties", "weight": 0.05 },
    { "id": "moveOver",    "name": "Move-Over Law",     "weight": 0.05 },
    { "id": "license",     "name": "License Types & GDL", "weight": 0.05 },
    { "id": "safety",      "name": "Safe Driving",      "weight": 0.10 }
  ],
  "handbook": {
    "url": "https://www.flhsmv.gov/safety-center/driver-license-handbook/",
    "version": "2026.04",
    "lastReviewed": "2026-04-15"
  },
  "specialNotes": [
    "TLSAE 4-hour course required for adults 18+ first-time applicants.",
    "DETS 6-hour course required for under-18 since Aug 1, 2025.",
    "Permit holder must drive with licensed driver 21+ in front passenger seat."
  ]
}
```

### `questions.json` (question bank)

```json
[
  {
    "id": "FL-Q-0001",
    "category": "signs",
    "difficulty": 2,
    "stem": {
      "en": "What does a flashing red traffic signal mean?",
      "es": "¿Qué significa una señal roja parpadeante?",
      "ht": "Kisa yon siyal trafik wouj k ap klote vle di?"
    },
    "choices": [
      { "id": "a", "text": { "en": "Slow down and proceed with caution", "es": "...", "ht": "..." } },
      { "id": "b", "text": { "en": "Stop completely, then proceed when safe", "es": "...", "ht": "..." } },
      { "id": "c", "text": { "en": "Stop only if other vehicles are present", "es": "...", "ht": "..." } },
      { "id": "d", "text": { "en": "The signal is broken; treat as green", "es": "...", "ht": "..." } }
    ],
    "correct": "b",
    "explanation": {
      "en": "A flashing red signal is treated exactly like a stop sign. You must come to a complete stop, then proceed when safe.",
      "es": "...",
      "ht": "..."
    },
    "handbookRef": {
      "section": "Chapter 4: Traffic Controls",
      "page": 28,
      "url": "https://www.flhsmv.gov/.../handbook.pdf#page=28"
    },
    "tags": ["signals", "stop", "common-mistake"]
  }
]
```

### Question bank size targets per state

| Tier | Questions | Categories | Languages |
|---|---|---|---|
| Tier 1 (FL/TX/CA/NY) | 350–450 | 10–12 | 2–9 |
| Tier 2 (next 16) | 250–350 | 8–10 | 2–4 |
| Tier 3 (remaining 31) | 200–300 | 8 | 1–2 |

---

## 4. Test Engine logic

### Practice mode

```swift
// Pull a question from the bank, weighted by:
//   - User's wrong-answer history (bias toward weak categories)
//   - SRS due-date (questions in review window first)
//   - Random sampling within remaining
func nextPracticeQuestion(state: ContentPack, userProgress: Progress) -> Question {
    let weakCategories = userProgress.bottomCategories(count: 3)
    let dueForReview = srsEngine.dueQuestions(now: Date())

    // Priority 1: SRS due cards
    if let q = dueForReview.randomElement() { return q }
    // Priority 2: weak-category random pick
    if let weak = weakCategories.randomElement(),
       let q = state.questions(in: weak).randomElement(notIn: userProgress.recentlySeen) {
        return q
    }
    // Priority 3: pure random
    return state.questions.randomElement(notIn: userProgress.recentlySeen)!
}
```

### Mock test mode

```swift
// Mock test = exact replica of state's real exam format.
func generateMockTest(state: ContentPack) -> MockTest {
    var picks: [Question] = []
    // Stratified sampling: respect each category's weight in the real exam
    for category in state.exam.categories {
        let target = Int(round(Double(state.exam.questionCount) * category.weight))
        let pool = state.questions.filter { $0.category == category.id }
        picks.append(contentsOf: pool.shuffled().prefix(target))
    }
    // Shuffle final order
    return MockTest(
        questions: picks.shuffled(),
        passingScore: state.exam.passingScore,
        timeLimit: state.exam.timeLimitMinutes
    )
}
```

### SRS algorithm (modified SM-2)

```swift
// After user answers, update SRS interval.
// Quality grade 0-5: 0=blackout, 5=perfect recall.
func updateSRS(card: SRSCard, quality: Int) -> SRSCard {
    var c = card
    if quality < 3 {
        // Failed — reset
        c.repetition = 0
        c.interval = 1.0  // days
    } else {
        c.repetition += 1
        c.easeFactor = max(1.3, c.easeFactor + (0.1 - (5 - Double(quality)) * (0.08 + (5 - Double(quality)) * 0.02)))
        switch c.repetition {
            case 1: c.interval = 1.0
            case 2: c.interval = 6.0
            default: c.interval = c.interval * c.easeFactor
        }
    }
    c.dueDate = Date().addingTimeInterval(c.interval * 86_400)
    return c
}
```

---

## 5. Local data layer

### SQLite tables (via GRDB.swift)

```sql
-- User progress (stays on device, never syncs unless user opts into iCloud)
CREATE TABLE attempts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question_id TEXT NOT NULL,
    correct INTEGER NOT NULL,         -- 0 or 1
    timeSpentSeconds REAL NOT NULL,
    timestamp INTEGER NOT NULL
);

CREATE TABLE srs_cards (
    question_id TEXT PRIMARY KEY,
    repetition INTEGER NOT NULL DEFAULT 0,
    ease_factor REAL NOT NULL DEFAULT 2.5,
    interval_days REAL NOT NULL DEFAULT 0,
    due_date INTEGER NOT NULL          -- Unix timestamp
);

CREATE TABLE bookmarks (
    question_id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL
);

CREATE TABLE mock_test_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    score INTEGER NOT NULL,
    total INTEGER NOT NULL,
    passed INTEGER NOT NULL,
    timestamp INTEGER NOT NULL,
    duration_seconds INTEGER NOT NULL
);

CREATE INDEX idx_attempts_question ON attempts(question_id);
CREATE INDEX idx_srs_due ON srs_cards(due_date);
```

---

## 6. StoreKit 2 — purchase model

```swift
enum Product {
    static let mainApp = "com.shlomo.dmvprep.fl"          // $6.99 base purchase
    static let proUpgrade = "com.shlomo.dmvprep.fl.pro"   // $2.99 IAP — AI tutor, all-language audio
    static let cdlAddon = "com.shlomo.dmvprep.fl.cdl"     // $9.99 IAP — V2
}

@MainActor
class StoreManager: ObservableObject {
    @Published var purchased: Set<String> = []

    func loadPurchases() async {
        for await result in Transaction.currentEntitlements {
            if case .verified(let tx) = result {
                purchased.insert(tx.productID)
            }
        }
    }

    // No subscriptions. No auto-renewing. Buy once, own forever.
}
```

---

## 7. Accessibility (table stakes for "perfect")

| Requirement | Implementation |
|---|---|
| Dynamic Type | Use `.font(.body)` etc., support extra-large sizes |
| VoiceOver | Every interactive element has `.accessibilityLabel(_:)` and `.accessibilityHint(_:)` |
| Color blindness | Don't rely on color alone for correct/incorrect — use ✓/✗ icons too |
| Dyslexia-friendly mode | Settings toggle: switch to OpenDyslexic font, increase letter spacing, off-white background |
| Reduced motion | Honor `@Environment(\.accessibilityReduceMotion)` — no swipe animations |
| Offline | Always — no exception |
| Audio narration | `AVSpeechSynthesizer` with state language. Tap question = read aloud. |

---

## 8. Build & ship pipeline

```
┌─ Engine repo (Xcode workspace) ─────────────────────────────┐
│   /App                  ← Swift source                      │
│   /ContentPacks                                             │
│      /florida.json                                          │
│      /texas.json                                            │
│      /...                                                   │
│   /Localizations                                            │
│      /en.lproj                                              │
│      /es.lproj                                              │
│      /ht.lproj                                              │
│      /...                                                   │
│   /Schemes                                                  │
│      /Florida.xcscheme  ← bundle ID com.shlomo.dmvprep.fl   │
│      /Texas.xcscheme    ← bundle ID com.shlomo.dmvprep.tx   │
└─────────────────────────────────────────────────────────────┘
```

### One repo, multiple targets

- **One Xcode project**, multiple **schemes** — each scheme bakes a different state's content pack at build time.
- `STATE_CODE` build setting drives which JSON the loader reads.
- App display name, icon, accent color all driven per-scheme.
- Build for each state with `xcodebuild -scheme Florida` etc.
- Fastlane handles App Store Connect upload per state.

### Fastfile sketch

```ruby
lane :ship_florida do
  build_app(scheme: "Florida", workspace: "DMVPrep.xcworkspace")
  upload_to_app_store(skip_metadata: false, force: true)
end

lane :ship_texas do
  build_app(scheme: "Texas", workspace: "DMVPrep.xcworkspace")
  upload_to_app_store(skip_metadata: false, force: true)
end
```

---

## 9. Question writing process (the content moat)

This is **where most permit prep apps fail**. They scrape competitors. Don't.

### Workflow per state

1. **Download official handbook PDF** from state DMV/DPS website. Verify it's the current year version.
2. **Extract testable content**: every paragraph that states a rule, fine, requirement, or sign meaning.
3. **Map to categories**: signs, ROW, parking, alcohol, fines, etc.
4. **Write questions in a structured doc** (Notion / Google Doc) with these fields:
   - Question stem (clear, unambiguous, single-correct)
   - 4 choices (one correct, three plausible distractors)
   - Correct answer + explanation
   - Handbook section + page number reference
   - Difficulty (1–3)
   - Tags (e.g., "common-mistake," "trips-up-teens")
5. **Native-speaker translation pass** for each supported language.
6. **Accuracy review** by 3+ recent test-takers in that state. Pay them $50 each via PayPal.
7. **Export to JSON content pack format**.

### Volume target

- **400 questions for Tier 1 states** (FL, TX, CA, NY)
- 250–350 for Tier 2
- 200 for Tier 3

### Time investment per state

- Tier 1: ~80–120 hours of writing + translation + review = ~2–3 weeks of part-time work or 1 week full-time
- Tier 2: ~40–60 hours
- Tier 3: ~25–40 hours

A solid freelance writer at $30/hr can produce a 350-question state pack for ~$1,500.

---

## 10. App Store Optimization (per state)

### App naming convention

- **Title:** `[State] Permit Test 2026 — DMV Practice`
  - e.g., `Florida Permit Test 2026 — DMV Practice`
- **Subtitle:** `[State] DMV practice exam, no ads`

### Keywords (per state, 100 char limit)

Florida example: `florida,fl,permit,license,dmv,driver,test,exam,2026,signs,road,driving,practice,prep,study`

### Screenshots (5 per device size)

1. Hero: "Pass the [State] permit test on your first try"
2. Practice mode in action with state-specific question visible
3. Mock test simulation showing real format ("50 questions, 80% to pass")
4. Privacy badge: "No ads. No tracking. No subscription."
5. Languages supported (varies by state)

### Localized screenshots

For Spanish-supported states, ship Spanish screenshots. CA needs 9 language sets.

---

## 11. V1 feature checklist

Tick before submitting first state to App Store:

- [ ] Practice mode (unlimited Qs)
- [ ] Mock test mode (exact state format)
- [ ] Wrong-answer review with handbook references
- [ ] Category-based practice
- [ ] Audio narration (TTS)
- [ ] Offline (airplane mode tested)
- [ ] No accounts / no cloud / no analytics
- [ ] State-accurate naming (DPS/DMV/DDS/MVA/RMV/etc.)
- [ ] Bilingual study mode (EN + state primary lang minimum)
- [ ] Test-day checklist (what to bring, what to expect)
- [ ] SRS algorithm (SM-2 modified)
- [ ] Daily streak counter
- [ ] Parent/teen mode
- [ ] Printable PDF cheat sheet
- [ ] Multi-language UI (state-dependent)
- [ ] VoiceOver support
- [ ] Dynamic Type support
- [ ] Dyslexia mode
- [ ] StoreKit 2 purchase + restore
- [ ] Privacy policy live

---

## 12. What NOT to build in v1

Resist the urge.

- ❌ User accounts / login
- ❌ Cloud sync (optional CloudKit can come in v1.1, but opt-in only)
- ❌ Push notifications (intrusive, requires backend)
- ❌ Social features / leaderboards
- ❌ AI tutor (V2 — needs LLM backend, breaks privacy promise)
- ❌ Behind-the-wheel road test prep (V2)
- ❌ CDL / Motorcycle (V2)
- ❌ Apple Watch app (V2)
- ❌ Custom backend / server (you don't need one. Don't build one.)
- ❌ Analytics SDK (no Firebase, no Mixpanel, no Amplitude)
- ❌ Crash reporting third-party (Apple's built-in TestFlight crash logs are enough)

---

## 13. Tech stack summary

| Layer | Choice | Why |
|---|---|---|
| Language | Swift 5.10+ | Native iOS performance, accessibility, App Store trust |
| UI | SwiftUI | Modern, less code, better accessibility defaults |
| Local DB | GRDB.swift (SQLite) | Lightweight, fast, no servers |
| IAP | StoreKit 2 | Native, modern API, no third-party SDK |
| Audio | AVFoundation (AVSpeechSynthesizer) | Built-in, no API costs |
| Build | Xcode 16+ with multi-scheme setup | Per-state SKUs share engine |
| CI/CD | Fastlane | Per-state ship lanes |
| Question authoring | Notion or Google Sheets → JSON export | Non-developer can edit content |
| Translations | Native speakers via Upwork ($30–60/hr) | Quality > Google Translate |

---

## 14. Cost to ship Florida v1

| Line item | Estimate |
|---|---|
| Apple Developer account | $99/yr |
| iOS development (1 dev, 4 weeks) | $0 if you / a contracted dev does it; $8K–15K freelance |
| Question writing (400 Qs Florida) | $1,500 freelance writer or 80 hrs your time |
| Spanish + Creole translation | $400–800 |
| Native-speaker translation review | $200 |
| Florida test-taker accuracy review (3 people × $50) | $150 |
| App icon + branding (designer) | $300–800 |
| Apple Search Ads launch budget | $500 |
| TikTok content production | $0 (you / family) |
| Domain + landing page hosting | $30/yr |
| Total cash to launch | **~$3,200–18,500** depending on freelance vs. self-build |

---

## 15. Definition of done — Florida v1

A "perfect" Florida v1 ships when:

1. ✅ 400+ unique questions, all sourced from public domain handbook
2. ✅ Spanish and Creole study mode (study mode only — Florida test is English-only)
3. ✅ Mock test mode mirrors real Class E Knowledge Exam format exactly (50 Qs, 80%, no time limit)
4. ✅ Every wrong answer links to handbook section
5. ✅ Audio narration (English at minimum)
6. ✅ Full VoiceOver + Dynamic Type
7. ✅ Tested in airplane mode end-to-end
8. ✅ Zero analytics SDKs, zero ads, zero accounts
9. ✅ App Store privacy nutrition label says "Data Not Collected"
10. ✅ TestFlight beta with 50+ Floridians, 4.5+ avg rating
11. ✅ App Store screenshots in EN + ES
12. ✅ Landing page live with FAQ
13. ✅ TikTok account active with 5+ videos posted

When all 13 are checked, you ship.
