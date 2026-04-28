# Florida DMV Permit Prep

## Overview
A study app for the Florida FLHSMV Class E Knowledge Exam. The original repository is a native iOS Swift/SwiftUI project (under `App/`, `Sources/DMVEngine/`) that cannot be built on Replit's Linux environment. To make the app testable in Replit's preview pane, this repository also contains a parallel **web version** (`web/`) that ports the engine and content pack into a TypeScript + React app.

## Structure
- `App/`, `Sources/DMVEngine/`, `Tests/` — the original Swift package and SwiftUI app shell. **Untouched.** Build it locally on macOS with Xcode.
- `ContentPacks/florida.json` — the canonical Florida content pack (15 sample questions, schema versioned). Source of truth for both apps.
- `web/` — a standalone Vite + React 18 + TypeScript + Tailwind app that runs the full study experience in the browser. Reads `florida.json` from `web/public/content/`.

## Web App
- Stack: Vite 5, React 18, react-router-dom v6, TailwindCSS, no backend.
- Engine port (`web/src/engine/`): SM-2 spaced repetition, weighted mock-test sampler, streak tracking, content-pack loader, localStorage-backed user data store with pub/sub.
- Lessons render scene visuals via `web/src/components/SceneAnimation.tsx`. **Hybrid renderer**: when a real Veo-generated MP4 exists for a scene id, it plays as the visual (looping, muted, autoplay, playsInline), fading in over a brand-color gradient placeholder + spinner once `loadeddata` fires. Otherwise it falls back to the inline framer-motion animation for that scene. The set of available videos lives in `web/src/data/video-manifest.json` and is consulted via the helpers in `web/src/engine/videoAssets.ts` (`hasGeneratedVideo`, `sceneVideoUrl`). `LessonView` also renders a hidden `<video preload="auto">` for the *next* step's MP4 so tapping Continue plays instantly.
- All 55 concept steps across the Car/Motorcycle/CDL packs carry a `scene:` field (e.g. `"speedometer:30"`, `"walkaround:3"`, `"bac:0.08"`). 19 scene kinds: sign-spotlight, speedometer, four-way-stop, t-intersection, left-turn-yield, ped-crosswalk, bac, siren, school-bus, move-over, timeline, gear, bike-control, corner, mc-law, walkaround, air, cdl-disqual, license-revoke. Each fallback animation is bilingual via the in-component TEXT dictionary.

## Video generation pipeline
- `scripts/generate-videos.mjs` reads scene prompts from `scripts/video-prompts.json` (driver-POV / dashcam scenarios) and produces 8-second 16:9 MP4s via Google's Veo API (`@google/genai`). Output: `web/public/videos/<scene-id with `:` → `-`>.mp4`. Manifest at `web/src/data/video-manifest.json` is updated atomically (tmp+rename) after each successful save and is resume-safe (skips files that already exist). Default model is `veo-3.1-generate-preview` (overridable via `VEO_MODEL`); cheaper Lite/Fast tiers exist but share daily caps. Generation retries (6x with 30→600s backoff) are split from download retries (4x) since Veo's first download attempt always returns an empty body.
- Routes: Home dashboard, Practice (adaptive + per-category), Mock Test (intro / full-bleed exam / result), Review (due cards), Bookmarks, Settings.
- All progress data lives in `localStorage` under the key `dmvprep.fl.userdata.v1`. No accounts, no backend, privacy-first.

## Running locally
- The `Start application` workflow runs `cd web && npm run dev` on port 5000.
- Production build: `cd web && npm run build` outputs to `web/dist/`.

## Deployment
- Configured as a Replit **static** deployment. Build: `cd web && npm install && npm run build`. Public dir: `web/dist`.

## Notes
- The bundled Florida pack only contains 15 sample questions; the mock-test scaler proportionally lowers the pass mark when the bank is smaller than `exam.questionCount`. Replace `florida.json` with the full 50+ Q bank when content is finalized.
- iOS-side wiring (in-app purchases, push notifications, App Store / Play Store metadata) is left for the native build pipeline on macOS.
