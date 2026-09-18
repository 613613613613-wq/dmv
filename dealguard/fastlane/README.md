# fastlane — Deal Guard

Lanes for TestFlight, App Store, Play internal testing and Play production.
Store metadata lives here too, in `deliver` (iOS) and `supply` (Android)
layout.

```
fastlane/
├── Appfile                 identifiers and team ids (from env)
├── Fastfile                lanes
├── Gemfile                 fastlane + cocoapods
├── README.md
├── metadata/
│   ├── ios/                deliver layout: en-US/*.txt, copyright, category, review_information/
│   └── android/            supply layout: en-US/*.txt, changelogs/, images/phoneScreenshots/
└── screenshots/en-US/      iPhone 6.7" PNGs written by `npm run e2e:screenshots`
```

## Setup

```bash
cd dealguard
gem install bundler
bundle install --gemfile fastlane/Gemfile
```

All lanes run from `dealguard/` with `bundle exec fastlane <platform> <lane>`.
Each lane first runs `npm ci && npm run check` (typecheck, unit tests, web
build) and `npx cap sync <platform>` so the native project always contains the
current bundle.

## Environment

Put these in CI secrets or in `fastlane/.env` (gitignored). Never commit them.

| Variable | Used by | Description |
|---|---|---|
| `ASC_KEY_ID` | ios | App Store Connect API key id |
| `ASC_ISSUER_ID` | ios | App Store Connect issuer id |
| `ASC_KEY_CONTENT` | ios | Contents of the `.p8` key, base64 (set `ASC_KEY_BASE64=false` for raw) |
| `APPLE_TEAM_ID`, `ASC_TEAM_ID` | ios | Developer Portal / App Store Connect team ids |
| `MATCH_GIT_URL`, `MATCH_PASSWORD` | ios | fastlane match repo and passphrase |
| `MATCH_GIT_BASIC_AUTHORIZATION` | ios (CI) | base64 `user:token` for the match repo |
| `BUILD_NUMBER` | ios (optional) | Overrides the auto-incremented TestFlight build number |
| `PLAY_JSON_KEY` | android | Contents of the Play service-account JSON |
| `PLAY_JSON_KEY_FILE` | android (alternative) | Path to that JSON file |
| `VITE_RC_IOS_KEY`, `VITE_RC_ANDROID_KEY` | both | RevenueCat public SDK keys, baked into the web bundle by `npm run build` |

Android release signing reads `android/keystore.properties` (gitignored); see
`docs/RELEASE_CHECKLIST.md` for the `keytool` command.

## Lanes

| Command | What it does |
|---|---|
| `bundle exec fastlane ios beta` | check → cap sync → match (readonly) → bump build number → `build_app` (app-store export) → TestFlight |
| `bundle exec fastlane ios release` | check → cap sync → match → `build_app` → `upload_to_app_store` with metadata and screenshots, `submit_for_review: false`. Submit manually in App Store Connect after attaching the IAPs. |
| `bundle exec fastlane android internal` | check → cap sync → `gradle bundleRelease` → Play **internal** track (completed) |
| `bundle exec fastlane android production` | check → cap sync → `gradle bundleRelease` → Play **production** track as a **draft** with metadata, changelog and screenshots. Start the staged rollout in Play Console. |

Metadata-only updates: `bundle exec fastlane deliver --skip_binary_upload
--skip_screenshots` (iOS) or `bundle exec fastlane supply --skip_upload_aab`
(Android) from `dealguard/` with `metadata_path` pointing at the folders above.

## Screenshots

`npm run e2e:screenshots` (Playwright, Chromium) writes:

- iPhone 6.7" (1290×2796): `fastlane/screenshots/en-US/01-home.png`, `02-…`
- Android phone: `fastlane/metadata/android/en-US/images/phoneScreenshots/*.png`

Run it before `ios release` / `android production`. Do not commit generated
PNGs unless the team decides to; they are reproducible.

## First run notes

- `match` needs `fastlane match init` once, then `fastlane match appstore`
  from a machine signed in to the Apple account to create the certificate.
- `supply` needs one manual AAB upload in Play Console before the API accepts
  uploads.
- Metadata character limits: iOS subtitle 30, keywords 100, description 4000,
  promotional text 170; Android title 30, short description 80, full
  description 4000. Lanes fail with a clear error if exceeded.
