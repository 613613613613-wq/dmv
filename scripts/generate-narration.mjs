#!/usr/bin/env node
// Generates real AI-voice narration audio for every lesson intro/concept step
// using Google Gemini 2.5 Flash TTS. Saves WAV files into web/public/narration/
// and writes a manifest at web/src/data/narration-manifest.json.
//
// Re-runs are safe: existing files matching the current text hash are skipped,
// so you can stop and resume without paying twice.

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { GoogleGenAI } from "@google/genai";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "web/public/content");
const OUT_DIR = path.join(ROOT, "web/public/narration");
const MANIFEST_FILE = path.join(ROOT, "web/src/data/narration-manifest.json");

const MODEL = process.env.TTS_MODEL || "gemini-2.5-flash-preview-tts";
// Voices: Kore, Charon, Puck, Fenrir, Aoede, Leda, Orus, Zephyr, etc.
// Kore = warm female (good for instructional EN/ES).
const VOICE_EN = process.env.TTS_VOICE_EN || "Kore";
const VOICE_ES = process.env.TTS_VOICE_ES || "Aoede";
const MAX_RETRIES = 5;
const RETRY_BACKOFF_S = [10, 30, 60, 120, 240];

if (!process.env.GEMINI_API_KEY) {
  console.error("GEMINI_API_KEY is required");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

function hash(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

function loadManifest() {
  try {
    return JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
  } catch {
    return { clips: {} };
  }
}

function saveManifest(m) {
  fs.mkdirSync(path.dirname(MANIFEST_FILE), { recursive: true });
  const tmp = MANIFEST_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(m, null, 2) + "\n");
  fs.renameSync(tmp, MANIFEST_FILE);
}

function loc(field, lang) {
  if (!field) return "";
  if (typeof field === "string") return field;
  return field[lang] ?? field.en ?? "";
}

function buildClips() {
  const clips = [];
  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.startsWith("lessons-") && f.endsWith(".json"));
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(path.join(CONTENT_DIR, file), "utf8"));
    for (const lesson of data.lessons ?? []) {
      lesson.steps.forEach((step, idx) => {
        if (step.kind !== "intro" && step.kind !== "concept") return;
        if (!step.body) return;
        for (const lang of ["en", "es"]) {
          const title = step.title ? loc(step.title, lang) : loc(lesson.title, lang);
          const body = loc(step.body, lang);
          const text = title ? `${title}. ${body}` : body;
          const key = `${lesson.id}__step${idx}__${lang}`;
          clips.push({ key, lang, text, hash: hash(text) });
        }
      });
    }
  }
  return clips;
}

// Gemini TTS returns raw PCM L16 24kHz mono. Wrap with a 44-byte WAV header.
function pcmToWav(pcm, sampleRate = 24000) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcm.length;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write("RIFF", 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write("WAVE", 8);
  buf.write("fmt ", 12);
  buf.writeUInt32LE(16, 16); // PCM chunk size
  buf.writeUInt16LE(1, 20); // PCM format
  buf.writeUInt16LE(numChannels, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(byteRate, 28);
  buf.writeUInt16LE(blockAlign, 32);
  buf.writeUInt16LE(bitsPerSample, 34);
  buf.write("data", 36);
  buf.writeUInt32LE(dataSize, 40);
  pcm.copy(buf, 44);
  return buf;
}

// Parse "audio/L16;codec=pcm;rate=24000" -> 24000
function rateFromMime(mime) {
  if (!mime) return 24000;
  const m = mime.match(/rate=(\d+)/i);
  return m ? parseInt(m[1], 10) : 24000;
}

async function ttsOnce(text, lang) {
  const voice = lang === "es" ? VOICE_ES : VOICE_EN;
  // Gentle styling cue helps the model read clearly and not too fast.
  const styled =
    lang === "es"
      ? `Lee con voz cálida, clara e instructiva, ritmo pausado: ${text}`
      : `Read in a warm, clear, instructional voice at a calm pace: ${text}`;
  const res = await ai.models.generateContent({
    model: MODEL,
    contents: [{ parts: [{ text: styled }] }],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
      },
    },
  });
  const part = res?.candidates?.[0]?.content?.parts?.find(
    (p) => p?.inlineData?.data
  );
  if (!part) throw new Error("no audio in response: " + JSON.stringify(res).slice(0, 500));
  const pcm = Buffer.from(part.inlineData.data, "base64");
  const rate = rateFromMime(part.inlineData.mimeType);
  return pcmToWav(pcm, rate);
}

async function ttsWithRetry(text, lang, label) {
  let lastErr;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`[${label}] generating (attempt ${attempt})…`);
      return await ttsOnce(text, lang);
    } catch (err) {
      lastErr = err;
      console.warn(`[${label}] attempt ${attempt} failed: ${err?.message ?? err}`);
      if (attempt === MAX_RETRIES) break;
      const wait = RETRY_BACKOFF_S[attempt - 1];
      console.log(`[${label}] backing off ${wait}s…`);
      await new Promise((r) => setTimeout(r, wait * 1000));
    }
  }
  throw lastErr;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = loadManifest();
  const clips = buildClips();
  console.log(`Total clips needed: ${clips.length}`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;
  for (const clip of clips) {
    const filename = `${clip.key}.wav`;
    const filepath = path.join(OUT_DIR, filename);
    const existing = manifest.clips[clip.key];
    const fileExists = fs.existsSync(filepath);
    if (existing && existing.hash === clip.hash && fileExists) {
      skipped++;
      continue;
    }
    try {
      const wav = await ttsWithRetry(clip.text, clip.lang, clip.key);
      const tmp = filepath + ".tmp";
      fs.writeFileSync(tmp, wav);
      fs.renameSync(tmp, filepath);
      manifest.clips[clip.key] = { hash: clip.hash, lang: clip.lang };
      saveManifest(manifest);
      generated++;
      console.log(`[${clip.key}] saved (${(wav.length / 1024).toFixed(1)} KB)`);
    } catch (err) {
      failed++;
      console.error(`[${clip.key}] giving up: ${err?.message ?? err}`);
    }
  }
  console.log(
    `=== Done · generated=${generated} · skipped=${skipped} · failed=${failed} · total=${clips.length}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
