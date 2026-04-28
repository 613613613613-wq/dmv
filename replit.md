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
