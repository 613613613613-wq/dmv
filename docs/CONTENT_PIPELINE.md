# Content Pipeline

Every state's question bank is **sourced from the official handbook**, not scraped from competitors. This is the content moat: most permit-prep apps fail here, and one negative App Store review citing a wrong answer kills the listing.

The `ContentPacks/florida.json` shipped in this repo is **15 sample questions** — enough to validate the engine end-to-end, not enough to ship.

## Per-state workflow

1. **Source the handbook.** Download the current-year PDF directly from the state's agency website (FLHSMV, TX DPS, CA DMV, MD MVA, MA RMV, etc.). Save the PDF and the version number to `ContentPacks/_sources/<state>-handbook-<version>.pdf`.
2. **Extract testable content.** Every paragraph that states a rule, a fine, a sign meaning, or a requirement is a candidate. Tag with the section title and page number.
3. **Map to categories.** Use the `categories` array in the state's content pack JSON. Florida's example: `signs`, `row`, `rules`, `alcohol`, `parking`, `fines`, `moveOver`, `license`, `safety`. Weights should reflect the real exam's category breakdown.
4. **Write questions in a structured doc** (Notion or Google Sheets). Required fields per question:
   - `id` (e.g., `FL-Q-0142`)
   - Stem (clear, single-correct, no compound questions)
   - 4 choices — one correct, three plausible distractors. Distractors must be wrong but reasonable.
   - Correct answer + explanation that teaches the rule
   - **Handbook section + page number** — non-negotiable for shipping
   - Difficulty (1–3)
   - Tags (e.g., `common-mistake`, `trips-up-teens`)
5. **Native-speaker translation pass** for each supported language. Google Translate is not acceptable. Hire on Upwork ($30–60/hr) and pay for a second native speaker to review.
6. **Accuracy review** — pay 3+ recent test-takers in that state ($50 each via PayPal) to flag anything that diverges from their actual exam experience.
7. **Export to JSON** matching the `ContentPack` schema in `Sources/DMVEngine/Models/ContentPack.swift`.

## Volume targets per state

| Tier | States | Questions | Languages |
|---|---|---|---|
| Tier 1 | FL, TX, CA, NY | 350–450 | EN + state primary (ES for FL/TX/CA/NY; +HT for FL) |
| Tier 2 | next 16 | 250–350 | EN + 1 |
| Tier 3 | remaining 31 | 200–300 | EN |

## Time and cost per state (Tier 1)

- 80–120 hours total: handbook reading, drafting, translation oversight, review.
- ~$1,500 if outsourced to a writer at $30/hr.
- +$400–$800 for ES + HT translation (Florida).
- +$150 for 3 paid Floridian reviewers.
- **Total cash to fully populate Florida pack: ~$2,000–$2,500.**

## Schema reference

The JSON the engine consumes is documented in `Sources/DMVEngine/Models/`. See `florida.json` for a working example. Strict validation lives in `Tests/DMVEngineTests/ContentPackLoaderTests.swift::testBundledFloridaPackLoads` — every shipped pack must pass this test (verifies that `correct` matches a real choice ID, no missing translations, etc.).

## What NOT to do

- ❌ Scrape competitors. Their questions are copyrighted and many are wrong.
- ❌ Use ChatGPT to generate questions wholesale. The handbook is the source of truth; a model can help draft phrasing, but every question must trace to a handbook section.
- ❌ Ship without the 3-reviewer accuracy pass. The cost is $150 per state. The cost of a 1-star review citing "this question has the wrong answer" is much higher.
- ❌ Fabricate handbook page numbers. If a question can't be tied to a specific section, leave `handbookRef` null and don't ship it.
