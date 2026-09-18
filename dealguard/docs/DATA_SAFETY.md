# Data safety declarations

Exact answers for Apple's App Privacy questionnaire, Google Play's Data Safety
form, the iOS privacy manifest and Android permission rationale. Keep this
file in sync with `PRIVACY_POLICY.md` whenever a data flow changes.

Ground truth for all answers:

- No accounts, no analytics, no ads, no tracking, no server of ours.
- Audio is captured only in Live mode and streamed to Deepgram using the
  user's own key; never stored.
- Only structured deal terms, ledger, memoranda and settings persist, on-device.
- Purchases go through Apple / Google and RevenueCat.

## Apple — App Privacy (App Store Connect → App Privacy)

**Do you or your third-party partners collect data from this app?** → Yes
(purchases are collected by Apple/RevenueCat).

Then declare exactly one data type:

| Data type | Collected | Linked to user | Used for tracking | Purposes |
|---|---|---|---|---|
| Purchases → Purchase History | Yes | No | No | App Functionality |

Everything else → **Not collected**. Specifically confirm "not collected" for:
Contact Info, Health & Fitness, Financial Info (payment info is handled by
Apple and never seen by the app), Location, Sensitive Info, Contacts, User
Content (Audio Data — see note), Browsing History, Search History,
Identifiers, Usage Data, Diagnostics, Other Data.

**Audio note.** Apple's definition of "collect" is transmitting data off the
device in a way that allows access for longer than servicing the request.
Live-mode audio is sent to Deepgram, a service chosen and keyed by the user,
solely to service the transcription request in real time and is not retained
by us. It is therefore declared as **not collected**. If Apple Review asks,
answer: "Audio is processed ephemerally by a speech-to-text provider under the
user's own account; the developer never receives it."

**Privacy Policy URL:** https://dealguard.app/privacy

**Tracking:** No. The app does not use the ATT framework and must not include
any SDK that does.

### Age rating

Apple age-rating questionnaire: answer **None/No** to all content categories
(violence, sexual content, profanity, gambling, horror, drugs, medical,
contests). Unrestricted web access: No. Then set the rating to **17+** because
the app is a professional business tool not intended for minors.

### PrivacyInfo.xcprivacy (`ios/App/App/PrivacyInfo.xcprivacy`)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>NSPrivacyTracking</key>
  <false/>
  <key>NSPrivacyTrackingDomains</key>
  <array/>
  <key>NSPrivacyCollectedDataTypes</key>
  <array>
    <dict>
      <key>NSPrivacyCollectedDataType</key>
      <string>NSPrivacyCollectedDataTypePurchaseHistory</string>
      <key>NSPrivacyCollectedDataTypeLinked</key>
      <false/>
      <key>NSPrivacyCollectedDataTypeTracking</key>
      <false/>
      <key>NSPrivacyCollectedDataTypePurposes</key>
      <array>
        <string>NSPrivacyCollectedDataTypePurposeAppFunctionality</string>
      </array>
    </dict>
  </array>
  <key>NSPrivacyAccessedAPITypes</key>
  <array>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

Reasons:

| API category | Reason | Why |
|---|---|---|
| UserDefaults | **CA92.1** | Capacitor Preferences stores the vault, ledger, memoranda and settings in the app's own UserDefaults; accessed only by the app. |
| File timestamp | C617.1 | **Not needed** unless a plugin reads file modification dates. None of the plugins in use (Preferences, Haptics, StatusBar, SplashScreen, App, Share, KeepAwake, RevenueCat) require it in their default configuration. Add only if Xcode's privacy report flags it. |
| System boot time / Disk space / Active keyboards | — | Not used. |

RevenueCat ships its own privacy manifest inside its SDK; do not duplicate its
entries.

### Info.plist purpose strings

| Key | Text |
|---|---|
| `NSMicrophoneUsageDescription` | "Deal Guard uses the microphone only in Live mode to transcribe your negotiation through your own speech-to-text account. Audio is never stored." |
| `NSLocalNetworkUsageDescription` | "Companion mode connects to a Deal Guard desktop daemon on your local network to display cues on this phone." |
| `NSAppTransportSecurity` → `NSAllowsLocalNetworking` | `true` (Companion mode uses ws:// on the LAN; all internet traffic remains HTTPS/WSS). |
| `ITSAppUsesNonExemptEncryption` | `false` |

## Google Play — Data safety form (Play Console → App content → Data safety)

**Does your app collect or share any of the required user data types?** → Yes.

**Is all of the user data collected by your app encrypted in transit?** → Yes.

**Do you provide a way for users to request that their data is deleted?** → Yes
(in-app "Delete all data"; and the app stores nothing server-side, so
uninstalling removes everything). Deletion URL: https://dealguard.app/privacy.

**Does your app collect data through a third-party SDK?** Include RevenueCat.

Data types:

| Category | Data type | Collected | Shared | Ephemeral | Required | Purposes |
|---|---|---|---|---|---|---|
| Financial info | Purchase history | Yes | No* | No | Optional (only if the user purchases) | App functionality |
| Audio files | Voice or sound recordings | Yes (processed) | No** | **Yes** | Optional (Live mode only) | App functionality |

\* RevenueCat acts as a service provider processing on our behalf, which Play
does not count as "sharing".
\*\* Deepgram processes audio at the user's direction with the user's own
account; Play's definition treats data transferred to a service provider or
at the user's explicit direction as not shared. The audio is ephemeral: it is
never written to storage.

Declare **not collected** for: Location, Personal info (name, email, user ids,
address, phone), Messages, Photos and videos, Files and docs, Calendar,
Contacts, App activity, Web browsing, App info and performance (no crash logs,
no diagnostics), Device or other IDs, Health and fitness.

Note on deal terms: the user's deal terms and memoranda never leave the device
and are therefore not "collected" under Play's definition (on-device
processing only).

**Security practices:** data encrypted in transit — Yes; users can request
deletion — Yes; committed to Play Families policy — No (not a children's app);
independent security review — No.

### Play content rating (IARC)

Category: Utility, Productivity, Communication or Other. Answer No to all
violence/sexuality/language/controlled-substance questions. "Does the app
allow users to purchase digital goods?" → Yes. "Does the app share the user's
current location?" → No. "Does the app allow users to interact or exchange
content?" → No. Expected result: Everyone / PEGI 3 by content, but set target
audience to **18 and over** in the Target audience section.

### Play App access

"All functionality in my app is available without special access." Then paste
the Demo-mode instructions from `REVIEWER_NOTES.md`.

## Android permissions rationale

| Permission | Declared | Runtime prompt | Rationale | Where used |
|---|---|---|---|---|
| `android.permission.RECORD_AUDIO` | Yes | Yes, first time the user starts a **Live** session | Capture microphone audio for streaming speech-to-text. Not requested in Demo or Companion mode. | `src/engine/audio/capture.ts` |
| `android.permission.MODIFY_AUDIO_SETTINGS` | Yes | No (normal) | Select the voice-communication audio source and disable echo/AGC processing that degrades 16 kHz transcription. | `src/engine/audio/capture.ts` |
| `android.permission.INTERNET` | Yes | No (normal) | Deepgram WebSocket (Live), optional Gemini/Groq HTTPS (Help Now), RevenueCat HTTPS (purchases), LAN WebSocket (Companion). | `stt/deepgram.ts`, `advisor/llm.ts`, `billing/provider.ts`, `companion/link.ts` |
| `com.android.vending.BILLING` | Added by Play Billing library | No | In-app subscriptions and the 5h pack. | `billing/provider.ts` |
| `WAKE_LOCK` | Added by keep-awake plugin | No | Keep the Glance HUD screen on during a call. | `@capacitor-community/keep-awake` |

Not declared: location, camera, contacts, calendar, storage (export uses the
system share sheet via `@capacitor/share`), foreground service (audio is
captured only while the app is in the foreground), `ACCESS_NETWORK_STATE`
(not required).

### Network security config (`android/app/src/main/res/xml/network_security_config.xml`)

Cleartext is disabled by default; it is permitted only for private LAN ranges
used by Companion mode:

```xml
<network-security-config>
  <base-config cleartextTrafficPermitted="false" />
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="false">localhost</domain>
    <domain includeSubdomains="true">10.0.0.0</domain>
    <domain includeSubdomains="true">192.168.0.0</domain>
    <domain includeSubdomains="true">172.16.0.0</domain>
  </domain-config>
</network-security-config>
```

(Android domain-config matches host names, not CIDR ranges; the phone
connects by IP address, so if the OS rejects an IP-literal rule, fall back to
`cleartextTrafficPermitted="true"` on the base config **only in a Companion
build flavor** and document it in the Data Safety "encrypted in transit"
answer: LAN-only traffic that never leaves the device's network.)

## Summary table for both stores

| Question | Answer |
|---|---|
| Accounts / login | None |
| Analytics / crash SDK | None |
| Advertising / tracking | None |
| Data stored server-side by us | None |
| Data types collected | Purchase history (Apple/Google/RevenueCat) |
| Data processed ephemerally | Audio (Live mode, user's Deepgram key); text snippets (optional Gemini/Groq, user's key) |
| Data on device only | Deal terms, ledger, memoranda, settings, API keys |
| User deletion | In-app "Delete all data"; uninstall |
| Export | In-app "Export my data" |
| Encryption in transit | TLS for all internet traffic; plain ws:// only on LAN in Companion mode |
| Children | Not directed to under 18 |
