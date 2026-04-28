# Build & Ship

## One-time setup

```sh
brew install xcodegen   # generates DMVPrep.xcodeproj from project.yml
brew install fastlane   # per-state ship lanes (added later)
```

## Generate the Xcode project

```sh
cd dmv
xcodegen
open DMVPrep.xcodeproj
```

This reads `project.yml` and produces `DMVPrep.xcodeproj` with one target per state and the `DMVEngine` Swift package wired in. The `.xcodeproj` is gitignored — regenerate any time you add a state.

## Validate the engine

Two layers, depending on what's installed:

```sh
# Layer 1 — smoke check. Works with command-line Swift only (no Xcode needed).
# Loads the bundled Florida pack, exercises SRS, mock test, content loader.
swift run SmokeCheck

# Layer 2 — full XCTest suite. Requires Xcode (XCTest module).
# Run from Xcode (⌘U on the Florida scheme) or from the command line:
xcodebuild test -scheme Florida -destination 'platform=iOS Simulator,name=iPhone 15'
```

The smoke check is the CI gate for engine correctness; the XCTest suite is the regression net during iOS development. They cover overlapping behavior intentionally — `swift run SmokeCheck` works on any Mac with Swift, the XCTest suite needs Xcode.

## Run the app in the simulator

In Xcode, pick the **Florida** scheme and ⌘R. The bundled `ContentPacks/florida.json` is the active state — the loader reads `STATE_CODE` from `Info.plist` (set per scheme to "FL", "TX", etc.).

## Per-state SKU model

Each state gets its own bundle ID, App Store listing, and ASO. Internally they all share the same engine binary — only `STATE_CODE`, `CFBundleDisplayName`, the bundled JSON pack, and the accent color change.

To add a new state:

1. Add `ContentPacks/<state>.json` (see `docs/CONTENT_PIPELINE.md` for how to source content).
2. Add a target block to `project.yml` mirroring `Florida`:
   ```yml
   Texas:
     template: StateApp
     settings:
       base:
         PRODUCT_BUNDLE_IDENTIFIER: com.shlomo.dmvprep.tx
         DISPLAY_NAME: "Texas Permit Test"
         STATE_CODE: "TX"
   ```
3. Add a matching scheme block.
4. `xcodegen` to regenerate.
5. Add an Apple Developer App ID, App Store Connect listing, and a Fastlane lane.

## ContentPacks pruning per build

Each state's binary should ship only its own pack, not all 51. The simplest approach is a Run Script build phase that copies the active state's pack into the bundle root and skips the rest:

```sh
# Run Script Phase — "Stage active content pack"
PACK="$SRCROOT/ContentPacks/$(echo $STATE_CODE | tr '[:upper:]' '[:lower:]').json"
DEST="$BUILT_PRODUCTS_DIR/$PRODUCT_NAME.app/$(echo $STATE_CODE | tr '[:upper:]' '[:lower:]').json"
cp "$PACK" "$DEST"
```

This is wired into the XcodeGen target template via `preBuildScripts` once we move past the scaffold.

## Releasing

A Fastlane file per-state is added under `fastlane/Fastfile` once the first state is App-Store-ready. Sketch:

```ruby
lane :ship_florida do
  build_app(scheme: "Florida")
  upload_to_app_store(skip_metadata: false, force: true)
end
```

CI: GitHub Actions matrix over states; manual approval gate before `upload_to_app_store`.
