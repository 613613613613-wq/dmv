import { describe, expect, it } from "vitest";
import { floatToPcm16, FRAME_SAMPLES, FrameQueue, QUEUE_BACKLOG_THRESHOLD, QUEUE_MAX_FRAMES, resampleTo16k, rms } from "../src/engine/audio/chunker";

function tone(samples: number, amp = 0.5): Int16Array {
  const f = new Float32Array(samples);
  for (let i = 0; i < samples; i++) f[i] = Math.sin(i / 10) * amp;
  return floatToPcm16(f);
}
const silence = (samples: number) => new Int16Array(samples);

describe("resample / pcm", () => {
  it("downsamples 48k → 16k by 3×", () => {
    const out = resampleTo16k(new Float32Array(4800), 48_000);
    expect(out.length).toBe(1600);
  });
  it("clips floats into int16 range", () => {
    const out = floatToPcm16(new Float32Array([1.5, -1.5, 0]));
    expect(out[0]).toBe(0x7fff);
    expect(out[1]).toBe(-0x8000);
    expect(out[2]).toBe(0);
  });
  it("rms distinguishes speech from silence", () => {
    expect(rms(silence(800))).toBe(0);
    expect(rms(tone(800))).toBeGreaterThan(0.2);
  });
});

describe("FrameQueue", () => {
  it("emits exact 800-sample (50 ms) frames and carries the remainder", () => {
    const q = new FrameQueue();
    expect(q.push(tone(1000))).toBe(1);
    expect(q.push(tone(600))).toBe(1); // 200 + 600 = 800
    expect(q.length).toBe(2);
    expect(q.drain()[0].pcm.length).toBe(FRAME_SAMPLES);
  });

  it("drops oldest non-speech frames once backlog exceeds 20, logging an overflow", () => {
    const q = new FrameQueue(0.01, () => 123);
    for (let i = 0; i < 15; i++) q.push(silence(800));
    for (let i = 0; i < 10; i++) q.push(tone(800));
    expect(q.length).toBeLessThanOrEqual(QUEUE_BACKLOG_THRESHOLD);
    expect(q.overflows.length).toBeGreaterThan(0);
    expect(q.overflows.reduce((a, o) => a + o.droppedNonSpeech, 0)).toBeGreaterThan(0);
    expect(q.overflows[0].at).toBe(123);
    // All speech frames survived.
    expect(q.drain().filter((f) => f.speech).length).toBe(10);
  });

  it("never exceeds the 100-frame (5 s) hard cap even with continuous speech", () => {
    const q = new FrameQueue();
    for (let i = 0; i < 150; i++) q.push(tone(800));
    expect(q.length).toBeLessThanOrEqual(QUEUE_MAX_FRAMES);
    expect(q.overflows.some((o) => o.droppedSpeech > 0)).toBe(true);
  });

  it("survives a simulated 60-minute call without unbounded growth", () => {
    const q = new FrameQueue();
    const frames = 60 * 60 * 20; // 20 frames/s
    for (let i = 0; i < frames; i++) {
      q.push(i % 3 === 0 ? silence(800) : tone(800));
      if (i % 4 === 0) q.drain(3); // network drains slightly slower than capture
    }
    expect(q.length).toBeLessThanOrEqual(QUEUE_MAX_FRAMES);
    expect(q.framesIn).toBe(frames);
  });
});
