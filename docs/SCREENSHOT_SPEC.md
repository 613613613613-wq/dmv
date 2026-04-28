# App Store Screenshot Spec — Florida

Apple shows your first 3 screenshots in search results. The competitive analysis (`docs/COMPETITIVE_ANALYSIS.md`) recommends leading with **privacy + buy-once**, then **state-accuracy**, then proof of execution. This spec follows that.

## Required sizes

| Device family | Resolution | Required? |
|---|---|---|
| iPhone 6.9" (iPhone 16 Pro Max et al.) | 1290 × 2796 | Required (the "key" set Apple uses for older devices too) |
| iPhone 6.5" (legacy) | 1242 × 2688 | Optional in 2026 — Apple auto-scales 6.9" |
| iPad Pro 13" | 2048 × 2732 | Required if you ship to iPad |

Provide 5 screenshots per locale (en-US, es-MX). Localized screenshots, not auto-translated overlays.

## Screenshot 1 — The wedge

**Headline (top):** *"Your kid's study habits aren't for sale."*
**Subhead:** *"No tracking. No accounts. Yours forever."*
**Visual (bottom 70%):** the home screen with the streak badge visible, navigation labels readable.
**Why this first:** the only thing no major competitor can match. Parents read it; teens see it as proof.

## Screenshot 2 — The buy-once promise

**Headline:** *"$6.99 once. Never again."*
**Subhead:** *"Costs less than two weeks of Zutobi."*
**Visual:** a styled receipt-like card showing "Florida Permit Test 2026 — $6.99 — One-time purchase" next to a crossed-out "$7.99/wk subscription".
**Why second:** the second part of the structural wedge. Anchors the price clearly so the reader doesn't worry about what it really costs after the trial.

## Screenshot 3 — State accuracy

**Headline:** *"Florida-accurate. Real FLHSMV laws."*
**Subhead:** *"Every wrong answer cites the handbook page."*
**Visual:** the question review screen with a wrong answer flagged red, the explanation text, and the handbook citation block highlighted.
**Why third:** the credibility claim. "Real FLHSMV" not "DMV" signals we did the work. Handbook citation is the falsifiable promise.

## Screenshot 4 — Mock test fidelity

**Headline:** *"Practice the exact exam."*
**Subhead:** *"50 questions. 80% to pass. Just like the real Class E."*
**Visual:** the mock test running screen — progress bar near the top showing "Question 27 of 50", a question rendered in the middle, the Submit button greyed out at the bottom-right.
**Why fourth:** addresses the most common competitor complaint — "the questions don't match the real exam."

## Screenshot 5 — Accessibility / multilingual

**Headline:** *"Studies in Spanish. Tests in English."*
**Subhead:** *"VoiceOver, Dynamic Type, dyslexia-friendly font included."*
**Visual:** split — left half shows a question rendered in Spanish, right half shows the same question with VoiceOver focus rings drawn on each choice, and a small caption "Compatible with iOS accessibility."
**Why fifth:** captures the Spanish-speaking Florida market and parent-perceived quality (accessibility = serious app).

## Visual style

- **Typography:** SF Pro Rounded for headlines; SF Pro for body text. Headline: 64–72pt. Subhead: 32–40pt.
- **Colors:** match the app icon's gradient on screenshot backgrounds (Florida sunset orange → coral). Device frame in the standard Apple "midnight" or "natural titanium" look — not the actual user's device color.
- **Frames:** use Apple's official Marketing Resources device frames (download from Apple's Marketing Resources site). Do not use 3rd-party frame mockups.
- **Status bar:** iOS standard, time = 9:41, full battery, full signal, Wi-Fi on. Apple's standard convention.
- **Whitespace:** at least 30% headline area at the top, then the device. Don't fill every pixel.

## Generating screenshots

Once Xcode is installed and the app builds:

1. Open `DMVPrep.xcodeproj`, pick the Florida scheme, run on iPhone 16 Pro Max simulator.
2. Pre-populate the simulator with realistic state by triggering ~20 attempts so the streak counter shows a number.
3. Use `xcrun simctl io booted screenshot screenshot1.png` to capture.
4. Composite the headline + device frame in Figma or fastlane's `frameit` tool.
5. Drop final outputs in `fastlane/screenshots/florida/en-US/` and `fastlane/screenshots/florida/es-MX/`.

Fastlane's `snapshot` can automate steps 1–3 once UI tests are written. For V1 it is faster to do this manually.

## Per-state adaptation

For each new state:
- Replace "FLHSMV" → the state's actual agency name (TX → "TX DPS"; MD → "MVA"; MA → "RMV"). This is the whole point.
- Replace "Class E" → the actual exam name in that state.
- Replace question count + passing percent.
- Replace the gradient color to match the state's icon variant.
- Re-shoot screenshots with the state's content pack loaded.
