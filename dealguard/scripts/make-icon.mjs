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
console.log("rendered icon + splash PNGs into", res);
