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

Steps to review (conversation coach, the primary flow):

a. On Home tap **"Try the demo"** next to *Conversations*. The screen stays
   black until the scripted other person speaks; then it shows what they
   said and a suggested reply. Tap **"End meeting"** for the memorandum.
b. Tap **"New conversation"** to see the plain-language setup (goal, who,
   tone, optional facts) — no purchase or key needed for the demo mode.

Steps to review (deal dossier mode):

1. Launch the app. Onboarding: tap **Continue**, optionally enter a name and
   pick a state, tap **Continue**, tick the acknowledgement, tap **"Start
   with a sample deal"**. The fictional sample deal is loaded automatically.
2. On Home, tap **"Pre-flight & start"** on the sample deal.
3. Pre-flight step 1: keep **Demo** selected, tap **Continue**. Step 2: tick
   "These terms match the latest documents", tap **Continue**. Step 3: tap
   **"Start demo call"** (the consent checkbox is optional for Demo).
4. The black Glance HUD screen stays blank until something matters. Within
   about 10 seconds you will see a **RED FLAG** (a scripted counterparty line
   contradicts the sample deal's recorded price) and then **FACT CARD**s when
   the script asks about known terms. Each cue has a short headline and a
   source line. Tap the screen to dismiss a cue; press and hold to freeze it.
5. Tap **"Help Now"** to see an on-demand talking point (generated from
   built-in templates; no LLM key is configured).
6. Tap **"End meeting"**. The Deal Memorandum appears: agreed terms with
   timestamps, open issues, a boundary audit and call statistics.
7. Optional: Settings → Privacy shows the policy; Settings → "Export my data"
   and "Delete all data" work offline.

Permissions:

- The **microphone permission is requested only when the user starts a Live
  session** (pre-flight step 1 → "Live — this phone listens"), which also
  requires the user to enter their own Deepgram API key in Settings. Demo
  mode never requests it.
- Local network access (iOS) is requested only in Companion mode when the user
  connects to their own desktop daemon on Wi-Fi.

Purchases: subscriptions (Dealmaker, Principal) and a consumable 5-hour pack
are optional and sold through in-app purchase. The Trial plan is free. No
feature needed for review is behind a purchase. Plans → "Restore purchases"
restores an existing subscription.

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
