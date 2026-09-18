# Reviewer notes

Paste the block below into App Store Connect → App Review Information →
**Notes** and into Play Console → App content → **App access** (choose "All or
some functionality is restricted" is NOT needed; choose "All functionality is
available without special access" and add the instructions in the notes
field where offered). Keep it in sync with `fastlane/metadata/ios/review_information/notes.txt`.

---

Deal Guard is a negotiation assistant for business professionals. There is
**no login and no account**. Everything can be reviewed in **Demo mode**,
which uses a built-in, fictional scripted negotiation ("Harbor Point
Industrial (Sample)") and needs no microphone, no network and no API keys.

Steps to review:

1. Launch the app. Onboarding explains the three modes. Tap Continue.
2. Accept the consent step (jurisdiction picker + reminder). Any jurisdiction
   works for Demo.
3. On Home, tap **"Start demo call"**.
4. The black Glance HUD screen stays blank until something matters. Within
   about 20 seconds you will see a **RED FLAG** (a scripted counterparty line
   contradicts the sample deal's recorded price) and then **FACT CARD**s when
   the script asks about known terms. Each cue has a short headline and a
   source line.
5. Tap **"Help Now"** to see an on-demand talking point (generated from
   built-in templates; no LLM key is configured).
6. Tap **"End meeting"**. The Deal Memorandum appears: agreed terms with
   timestamps, open issues, a boundary audit and call statistics.
7. Optional: Settings → Privacy shows the policy; Settings → "Export my data"
   and "Delete all data" work offline.

Permissions:

- The **microphone permission is requested only when the user starts a Live
  session** (Home → "Live (Deepgram)"), which also requires the user to enter
  their own Deepgram API key. Demo mode never requests it.
- Local network access (iOS) is requested only in Companion mode when the user
  connects to their own desktop daemon on Wi-Fi.

Purchases: subscriptions (Dealmaker, Principal) and a consumable 5-hour pack
are optional and sold through in-app purchase. The Trial plan is free. No
feature needed for review is behind a purchase. If the build was made without
RevenueCat keys the paywall shows plans with purchasing disabled and a
"Purchases not configured" note.

Data: audio is never stored; the raw transcript is discarded after the
memorandum is built; deal terms and memoranda are stored only on the device.
The app contains no analytics, ads or tracking. Privacy policy:
https://dealguard.app/privacy.

Recording laws: the app includes a mandatory pre-flight consent step and a
disclosure script for the user to read to other participants before Live
mode transcribes anything.

Contact for review questions: support@dealguard.app.

---

## Play-specific "App access" answer

Select **"All functionality in my app is available without special access"**.
No demo credentials are needed. If the form asks for instructions anyway,
paste steps 1–6 above.

## Apple demo account fields

Leave "Sign-in required" **unchecked**. `demo_user.txt` and
`demo_password.txt` in `fastlane/metadata/ios/review_information/` are
intentionally empty.
