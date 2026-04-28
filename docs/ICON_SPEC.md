# App Icon Spec — Design Brief

The app icon is the single most important piece of branding. It appears in App Store search, on the home screen, and in every screenshot the App Store algorithm shows. We need it to: (a) signal "permit / driving" instantly, (b) feel state-specific without being kitsch, (c) survive heavy compression in App Store search.

## Per-state strategy

Each state ships under its own bundle ID and gets its own icon. The icon system is **one master shape + state accent**, not 51 unique designs:

- **Master shape**: a simplified driver's license card silhouette, slightly tilted, on a clean colored background. Single shape, no glyphs at App Store thumbnail size — must read at 60×60.
- **State accent**: each state's icon uses the state's flag colors as a 2-tone gradient on the background. Florida = a sunset gradient (orange → coral). Texas = a deeper red → navy. California = ocean blue → poppy orange.
- **State letter mark**: the 2-letter state code ("FL", "TX") rendered on the license shape in a clean geometric sans (SF Pro Rounded Bold). Not the state name — too small to read.

This gives every app in the family visual cohesion (same silhouette, same proportions) while making each instantly recognizable as that-state's-app.

## Specs

| Attribute | Spec |
|---|---|
| Master canvas | 1024 × 1024 px, sRGB, no transparency, no rounded corners (Apple rounds them) |
| Format | PNG-24, no alpha |
| Color profile | sRGB IEC61966-2.1 |
| Required sizes | All standard iOS sizes — Xcode generates from 1024 master |
| Safe area | 90% of canvas, leave ~5% padding on all sides for Apple's mask |
| Light/dark/tinted | Provide all three iOS 18+ variants |

## Florida specifics

- **Background gradient**: top-left `#FF7E47` (Florida sunset orange) → bottom-right `#FF4D6D` (coral). Linear, ~135°.
- **Card silhouette**: warm off-white `#FFF6EC`, ~70% canvas width, tilted ~8° clockwise, soft drop shadow `rgba(0,0,0,0.15)` 24px Y-offset, 32px blur.
- **State letter mark**: "FL" in SF Pro Rounded Black, color `#FF4D6D` matching the gradient endpoint, ~25% of card width. Centered on the card.
- **Optional accent**: a thin pale-yellow horizontal stripe on the card to evoke real Florida license layout, but only if it doesn't muddy the thumbnail.

## What to avoid

- ❌ Photorealistic license imagery — looks dated and competes with FLHSMV's actual license design (legal/trademark risk).
- ❌ Cartoon car or steering wheel — that's the entire ASO swamp's icon convention; we want to look unlike them.
- ❌ Drop shadows or gradients on the letter mark — too noisy at 60×60.
- ❌ Multiple colors on the foreground — the icon has *one* foreground color, not three.
- ❌ "FL" + state name together — pick one, the letter mark is enough.
- ❌ Mascots — kills perceived seriousness for parents.

## Designer handoff

Provide:
- Figma file with the master shape as a component, state accent as a swappable variant, exported at 1024×1024 for Florida.
- All iOS-required sizes generated with Apple's automated tool from the 1024 master, dropped into `App/Resources/Assets.xcassets/AppIcon.appiconset/`.
- iOS 18+ light, dark, and tinted variants.
- Source PSD or Figma file checked into `design/icons/florida/` (gitignored if file size requires).

## Cost / vendor

A competent App Store icon designer charges $300–$800 for a single icon. For the per-state model, negotiate a flat fee for the master + a discounted per-state rate (e.g., $400 master + $80/state).

## Reviewing icon candidates

- Look at the icon at **60×60 px** before anything else. If it doesn't read at that size, no amount of polish at 1024 will save it.
- View it in App Store search results next to competitors (Zutobi, DMV Genie, the ASO-swamp Florida apps) — does it stand out, or does it blend in?
- Test in both iOS light mode and dark mode home screens.
- Test in the App Store screenshot strip — does it pair well with the screenshot aesthetic?
