#!/usr/bin/env node
/**
 * Renders resources/icon.svg and resources/splash.svg to the PNGs that
 * `npx @capacitor/assets generate` expects. Run via `npm run assets`.
 */
import sharp from "sharp";
import { readFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const res = join(dirname(fileURLToPath(import.meta.url)), "..", "resources");
mkdirSync(res, { recursive: true });
const icon = readFileSync(join(res, "icon.svg"));
const splash = readFileSync(join(res, "splash.svg"));

await sharp(icon).resize(1024, 1024).png().toFile(join(res, "icon-only.png"));
await sharp(icon).resize(1024, 1024).png().toFile(join(res, "icon-foreground.png"));
await sharp({ create: { width: 1024, height: 1024, channels: 4, background: "#07090d" } }).png().toFile(join(res, "icon-background.png"));
await sharp(splash).resize(2732, 2732).png().toFile(join(res, "splash.png"));
await sharp(splash).resize(2732, 2732).png().toFile(join(res, "splash-dark.png"));
// Google Play listing assets: 512×512 hi-res icon and 1024×500 feature graphic (no alpha).
const play = join(res, "..", "fastlane", "metadata", "android", "en-US", "images");
mkdirSync(play, { recursive: true });
await sharp(icon).resize(512, 512).flatten({ background: "#07090d" }).png().toFile(join(play, "icon.png"));
const feature = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="#07090d"/>
  <g transform="translate(96 110) scale(0.27)">
    <path d="M512 150 L800 262 V520 C800 700 672 830 512 878 C352 830 224 700 224 520 V262 Z" fill="none" stroke="#e6e9ef" stroke-width="44" stroke-linejoin="round"/>
    <rect x="330" y="486" width="364" height="60" rx="30" fill="#ff3b4a"/>
  </g>
  <text x="330" y="235" font-family="Inter, DejaVu Sans, Helvetica, Arial, sans-serif" font-size="84" font-weight="800" fill="#e6e9ef" letter-spacing="-2">Deal Guard</text>
  <text x="332" y="300" font-family="Inter, DejaVu Sans, Helvetica, Arial, sans-serif" font-size="34" font-weight="500" fill="#98a2b5">Never concede what you already agreed.</text>
</svg>`);
await sharp(feature).flatten({ background: "#07090d" }).png().toFile(join(play, "featureGraphic.png"));
console.log("rendered icon + splash PNGs into", res, "and Play listing images into", play);
