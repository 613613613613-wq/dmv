#!/usr/bin/env node
// Generates one ~20-second narrated teaching video per lesson via OpenAI Sora 2 Pro.
// Reads lesson prompts from scripts/lesson-video-prompts.json and saves MP4s to
// web/public/lesson-videos/<lessonId>.mp4. Re-runs are safe: existing files are
// skipped. Manifest at web/src/data/lesson-video-manifest.json is updated atomically.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PROMPTS_FILE = path.join(__dirname, "lesson-video-prompts.json");
const OUT_DIR = path.join(ROOT, "web/public/lesson-videos");
const MANIFEST_FILE = path.join(ROOT, "web/src/data/lesson-video-manifest.json");

const MODEL = process.env.SORA_MODEL || "sora-2-pro";
const SECONDS = process.env.SORA_SECONDS || "20"; // 4, 8, 12, 16, 20 supported on sora-2-pro
const SIZE = process.env.SORA_SIZE || "1280x720"; // 16:9 720p
const POLL_INTERVAL_MS = 15_000;
const MAX_POLL_ATTEMPTS = 80; // up to ~20 min per video
const MAX_RETRIES = 4;
const RETRY_BACKOFF_S = [30, 60, 180, 360];

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY is required");
  process.exit(1);
}

const API = "https://api.openai.com/v1";
const HEADERS = {
  Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
  "Content-Type": "application/json",
};

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  } catch {
    return { videos: [] };
  }
}

function saveManifest(m) {
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  const tmp = MANIFEST_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(m, null, 2) + "\n");
  fs.renameSync(tmp, MANIFEST_FILE);
}

function addToManifest(id) {
  const m = loadManifest();
  if (!m.videos.includes(id)) {
    m.videos.push(id);
    m.videos.sort();
    saveManifest(m);
  }
}

async function createVideo(prompt) {
  const r = await fetch(`${API}/videos`, {
    method: "POST",
    headers: HEADERS,
    body: JSON.stringify({ model: MODEL, prompt, seconds: SECONDS, size: SIZE }),
  });
  if (!r.ok) throw new Error(`create ${r.status}: ${(await r.text()).slice(0, 400)}`);
  return r.json();
}

async function getVideo(id) {
  const r = await fetch(`${API}/videos/${id}`, { headers: HEADERS });
  if (!r.ok) throw new Error(`get ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return r.json();
}

async function downloadVideo(id, dest) {
  const r = await fetch(`${API}/videos/${id}/content`, { headers: HEADERS });
  if (!r.ok) throw new Error(`download ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const buf = Buffer.from(await r.arrayBuffer());
  if (buf.length < 10_000) throw new Error(`download too small: ${buf.length} bytes`);
  const tmp = dest + ".tmp";
  fs.writeFileSync(tmp, buf);
  fs.renameSync(tmp, dest);
  return buf.length;
}

async function pollUntilDone(id, label) {
  for (let i = 0; i < MAX_POLL_ATTEMPTS; i++) {
    const v = await getVideo(id);
    console.log(`[${label}] ${v.status} (${v.progress ?? 0}%)`);
    if (v.status === "completed") return v;
    if (v.status === "failed") {
      const msg = v.error?.message ?? "unknown";
      throw new Error(`generation failed: ${msg}`);
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
  throw new Error("polling timed out");
}

async function generateOne(lessonId, prompt) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[${lessonId}] submitting (attempt ${attempt})…`);
      const job = await createVideo(prompt);
      console.log(`[${lessonId}] job id ${job.id}`);
      await pollUntilDone(job.id, lessonId);
      const dest = path.join(OUT_DIR, `${lessonId}.mp4`);
      const size = await downloadVideo(job.id, dest);
      console.log(`[${lessonId}] saved ${(size / 1024 / 1024).toFixed(2)} MB`);
      return;
    } catch (err) {
      console.warn(`[${lessonId}] attempt ${attempt} failed: ${err?.message ?? err}`);
      if (attempt === MAX_RETRIES) throw err;
      const wait = RETRY_BACKOFF_S[attempt - 1];
      console.log(`[${lessonId}] backing off ${wait}s…`);
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const data = JSON.parse(fs.readFileSync(PROMPTS_FILE, "utf8"));
  const lessons = data.lessons ?? {};
  const ids = Object.keys(lessons);
  console.log(`Lessons to generate: ${ids.length} · model=${MODEL} · seconds=${SECONDS} · size=${SIZE}`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const id of ids) {
    const dest = path.join(OUT_DIR, `${id}.mp4`);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 10_000) {
      console.log(`[${id}] already exists, skipping`);
      addToManifest(id);
      skipped++;
      continue;
    }
    try {
      await generateOne(id, lessons[id]);
      addToManifest(id);
      generated++;
    } catch (err) {
      failed++;
      console.error(`[${id}] giving up: ${err?.message ?? err}`);
    }
  }
  console.log(
    `=== Done · generated=${generated} · skipped=${skipped} · failed=${failed} · total=${ids.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
