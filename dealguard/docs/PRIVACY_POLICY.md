# Deal Guard Privacy Policy

**Effective:** 18 September 2026 (Deal Guard 1.0.0).
**Last reviewed:** 2026-09-18.

This policy explains what Deal Guard (the "app") does with information when
you use it. The short version: the app runs on your device, we operate no
server, we have no accounts, and we do not collect your data. The same text is
shown inside the app under Settings → Privacy and is published at
https://dealguard.app/privacy.

## 1. Who we are

Deal Guard is published by Deal Guard ("we", "us"). Contact:
support@dealguard.app.

## 2. What the app does

Deal Guard is a negotiation assistant. You enter your own deal terms before a
call. During the call the app can transcribe speech and show you short cues
when something said contradicts your record, crosses a boundary you set, or
asks about a term you recorded. After the call it produces a Deal Memorandum.

## 3. Data that stays on your device

The following is stored only on your phone, in the app's private storage
(the app sandbox), and never sent to us:

- Deal terms you enter (prices, deposits, dates, ratios, their status, source
  document names and dates).
- The ledger: typed assertions (offer, concession, rejection, question,
  agreement) with the verbatim words that triggered them and a time offset.
- Session memoranda.
- Settings.
- Any API keys or companion token you enter. These are kept in the
  platform's secure credential store (iOS Keychain, marked "this device
  only", or Android Keystore-encrypted storage), so they are excluded from
  device backups and never appear in the data export.

You can export all of it (Settings → "Export my data") or erase all of it
(Settings → "Delete all data"). Deleting the app also deletes it.

## 4. Data that is never stored

- **Audio.** Microphone audio exists only in memory while a Live-mode call is
  running. It is streamed to the transcription service you configured and
  discarded immediately. We never write audio to disk.
- **Raw transcript.** The word-for-word transcript is held in memory during the
  call and discarded when the memorandum is built. Only the structured ledger
  entries described above are kept.

## 5. Data we do not collect

We do not collect, receive or have access to any of the above. Specifically:

- No account, login, email or name is required or requested.
- No analytics or crash-reporting SDK is included.
- No advertising SDK, no advertising identifier, no tracking.
- No location, contacts, photos, calendar or other device data.
- We do not operate a server that receives data from the app.

## 6. Network connections the app can make

The app connects to the internet only in the following cases:

| Connection | When | What is sent |
|---|---|---|
| Deepgram (speech to text) | Only in **Live mode**, and only after you enter your own Deepgram API key | Microphone audio during the call, for transcription |
| Google Gemini or Groq (optional language model) | Only if you enter your own Gemini or Groq API key and press "Help Now" | Short text snippets: relevant deal terms and the last seconds of transcript, to draft a talking point |
| RevenueCat, Apple App Store, Google Play | When you view the paywall or buy or restore a plan | Purchase receipt and an anonymous app-generated identifier |
| Your own computer (Companion mode) | Only if you connect the phone to a desktop daemon on your local network | Cue display messages over your LAN; nothing leaves your network |

Demo mode makes no network connections at all.

When you use your own API keys, you are the customer of that provider and its
terms and privacy policy govern how it handles the data. We recommend reading
them before enabling Live mode or Help Now.

## 7. Third-party processors

| Provider | Purpose | Data | Trigger | Policy |
|---|---|---|---|---|
| Deepgram, Inc. | Streaming speech recognition (model nova-3) | Audio during a Live-mode call | You enable Live mode with your own key | https://deepgram.com/privacy |
| Google (Gemini API) | Optional talking-point drafting | Text snippets: deal terms and recent transcript | You configure a Gemini key | https://policies.google.com/privacy |
| Groq, Inc. | Optional talking-point drafting | Text snippets: deal terms and recent transcript | You configure a Groq key | https://groq.com/privacy-policy |
| RevenueCat, Inc. | Subscription management | Purchase receipts, anonymous app user id, device platform | You open the paywall or purchase | https://www.revenuecat.com/privacy |
| Apple Inc. / Google LLC | Payment processing for in-app purchases | Handled entirely by the store under your Apple ID / Google account | You purchase | Apple and Google privacy policies |

We have no other processors. We do not sell or share personal information.

## 8. Purchases

Subscriptions and the 5-hour pack are sold through Apple's App Store and
Google Play. We never see your payment details. RevenueCat validates receipts
and tells the app which plan is active. Purchase history is retained by Apple,
Google and RevenueCat under their policies for as long as required for
billing, refunds and fraud prevention.

## 9. Recording other people

Deal Guard can transcribe conversations. Laws on recording and transcribing
calls vary by place and many require the consent of every participant. The
app includes a consent step, a disclosure script and a jurisdiction guide, but
**you are responsible for obtaining any consent the law requires** before
using Live mode. See the Terms of Service and the in-app Compliance guide.

## 10. Children

Deal Guard is a professional tool intended for adults. It is not directed to
anyone under 18 and we do not knowingly collect information from anyone under
18. Because the app collects no personal data, there is nothing for us to
delete; if you believe a minor has used the app, uninstalling it removes all
local data.

## 11. Security

Data on the device is protected by the operating system's app sandbox and your
device passcode or biometrics. Connections to Deepgram, Gemini, Groq and
RevenueCat use TLS. Companion mode uses an unencrypted WebSocket on your local
network by design (it never leaves your LAN); do not use it on networks you do
not trust.

## 12. Your rights

Because everything lives on your device, you exercise your rights directly:
view and export via "Export my data", erase via "Delete all data" or by
uninstalling. If you are in the EU/EEA, UK, California or another jurisdiction
with privacy rights and have a question about this policy, email
support@dealguard.app. We have no data about you to access, correct or delete
on our side.

## 13. Changes

We will update this policy when the app's data flows change and update the
"Last reviewed" date. Material changes are called out in the release notes.

## 14. Contact

support@dealguard.app · https://dealguard.app
