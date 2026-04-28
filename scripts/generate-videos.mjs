#!/usr/bin/env node
// Generates a short Veo video for each lesson scene defined in
// scripts/video-prompts.json and saves the MP4s into web/public/videos/.
// Re-runs are safe: existing files are skipped, so you can stop and resume
// without losing progress or paying twice.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROMPTS_FILE = path.join(__dirname, "video-prompts.json");
const VIDEO_DIR = path.join(ROOT, "web/public/videos");
const MANIFEST_FILE = path.join(ROOT, "web/src/data/video-manifest.json");

// Veo 3.1 Fast (preview) — newer than 3.0, balanced cost/quality.
// Other options for VEO_MODEL override:
//   - veo-3.1-generate-preview      (highest quality, most expensive)
//   - veo-3.1-lite-generate-preview (cheapest, lower fidelity)
//   - veo-3.0-fast-generate-001     (stable non-preview fallback)
// Veo 2 requires separate Google Cloud Platform billing.
const MODEL = process.env.VEO_MODEL || "veo-3.1-fast-generate-preview";
const POLL_INTERVAL_MS = 10_000;
const MAX_POLL_ATTEMPTS = 60; // up to 10 minutes per video
const MAX_RETRIES = 6;
// Backoff schedule (seconds) for transient errors. 429 capacity errors get
// long waits so Vertex AI's serving queue can recover.
const RETRY_BACKOFF_S = [30, 60, 120, 240, 480, 600];

function sceneToFilename(sceneId) {
  return sceneId.replace(/[:/\\]/g, "-") + ".mp4";
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  } catch {
    return { videos: [] };
  }
}

function saveManifest(manifest) {
  // Atomic write: serialize to a temp file in the same directory then rename.
  // Prevents JSON corruption if the process is killed mid-write during a long
  // background run. The app reads this file via Vite import, so corruption
  // would crash the dev server until manually fixed.
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  const tmp = MANIFEST_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2) + "\n");
  fs.renameSync(tmp, MANIFEST_FILE);
}

function addToManifest(sceneId) {
  const m = loadManifest();
  if (!m.videos.includes(sceneId)) {
    m.videos.push(sceneId);
    m.videos.sort();
    saveManifest(m);
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateOne(ai, sceneId, prompt, outPath) {
  console.log(`\n[${sceneId}] kicking off generation…`);
  let op = await ai.models.generateVideos({
    model: MODEL,
    prompt,
    config: {
      aspectRatio: "16:9",
      durationSeconds: 8,
      numberOfVideos: 1,
      personGeneration: "allow_all",
    },
  });

  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    if (op.done) break;
    await sleep(POLL_INTERVAL_MS);
    op = await ai.operations.getVideosOperation({ operation: op });
    process.stdout.write(`  poll ${i + 1}/${MAX_POLL_ATTEMPTS} (done=${op.done})\r`);
  }
  process.stdout.write("\n");
  if (!op.done) throw new Error(`Timed out polling for ${sceneId}`);
  if (op.error) throw new Error(`API error for ${sceneId}: ${JSON.stringify(op.error)}`);

  const video = op.response?.generatedVideos?.[0]?.video;
  if (!video) throw new Error(`No video returned for ${sceneId}: ${JSON.stringify(op.response)}`);

  // Download has its own retry loop separate from generation. Since the video
  // is already paid for and rendered server-side, a failed download should
  // never trigger a new (paid) generation — just re-fetch the same asset.
  const DOWNLOAD_RETRIES = 4;
  for (let dl = 1; dl <= DOWNLOAD_RETRIES; dl++) {
    try {
      await ai.files.download({ file: video, downloadPath: outPath });
      if (!fs.existsSync(outPath) || fs.statSync(outPath).size < 1024) {
        throw new Error(`empty file (got ${fs.existsSync(outPath) ? fs.statSync(outPath).size : 0} bytes)`);
      }
      console.log(`  saved → ${path.relative(ROOT, outPath)} (${(fs.statSync(outPath).size / 1024).toFixed(0)} KB)`);
      return;
    } catch (dlErr) {
      console.error(`  download attempt ${dl}/${DOWNLOAD_RETRIES} failed: ${dlErr?.message || dlErr}`);
      if (dl >= DOWNLOAD_RETRIES) throw new Error(`download failed after ${DOWNLOAD_RETRIES} tries: ${dlErr?.message || dlErr}`);
      await sleep(10_000 * dl);
    }
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error("ERROR: GEMINI_API_KEY is not set. Add it as a Replit Secret and try again.");
    process.exit(1);
  }
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const { prompts } = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8"));
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const entries = Object.entries(prompts);
  console.log(`${entries.length} scenes total · model=${MODEL} · output=${path.relative(ROOT, VIDEO_DIR)}`);

  let done = 0, skipped = 0, failed = 0;
  for (const [sceneId, prompt] of entries) {
    const outPath = path.join(VIDEO_DIR, sceneToFilename(sceneId));
    if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1024) {
      skipped++;
      addToManifest(sceneId);
      console.log(`[${sceneId}] already exists — skip`);
      continue;
    }

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
      attempt++;
      try {
        await generateOne(ai, sceneId, prompt, outPath);
        addToManifest(sceneId);
        done++;
        break;
      } catch (err) {
        const msg = err?.message || String(err);
        console.error(`[${sceneId}] attempt ${attempt} failed:`, msg);
        if (attempt >= MAX_RETRIES) {
          failed++;
          console.error(`[${sceneId}] giving up after ${MAX_RETRIES} attempts`);
        } else {
          const waitS = RETRY_BACKOFF_S[attempt - 1] ?? 600;
          console.log(`[${sceneId}] backing off ${waitS}s before retry…`);
          await sleep(waitS * 1000);
        }
      }
    }
  }

  console.log(`\n=== Done · generated=${done} · skipped=${skipped} · failed=${failed} · total=${entries.length}`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
