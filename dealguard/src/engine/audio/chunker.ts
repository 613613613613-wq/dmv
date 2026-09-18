/**
 * Audio plumbing that mirrors the desktop daemon spec on the phone:
 *   • Linear 16-bit PCM, 16 000 Hz, mono
 *   • 800-sample (50 ms) frames
 *   • bounded queue: 100 frames max (5 s). Beyond 20 frames of backlog, the
 *     oldest NON-speech frames are dropped first and an overflow event logged.
 *
 * Pure functions + a small class so this is unit-testable without a browser.
 */

export const TARGET_SAMPLE_RATE = 16_000;
export const FRAME_SAMPLES = 800; // 50 ms @ 16 kHz
export const QUEUE_MAX_FRAMES = 100;
export const QUEUE_BACKLOG_THRESHOLD = 20;

/** Linear-interpolation downsampler. Good enough for speech to STT. */
export function resampleTo16k(input: Float32Array, inputRate: number): Float32Array {
  if (inputRate === TARGET_SAMPLE_RATE) return input;
  const ratio = inputRate / TARGET_SAMPLE_RATE;
  const outLen = Math.floor(input.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const pos = i * ratio;
    const i0 = Math.floor(pos);
    const i1 = Math.min(i0 + 1, input.length - 1);
    const frac = pos - i0;
    out[i] = input[i0] * (1 - frac) + input[i1] * frac;
  }
  return out;
}

export function floatToPcm16(input: Float32Array): Int16Array {
  const out = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/** RMS energy of a frame, 0..1. */
export function rms(frame: Int16Array): number {
  if (!frame.length) return 0;
  let acc = 0;
  for (let i = 0; i < frame.length; i++) {
    const v = frame[i] / 0x8000;
    acc += v * v;
  }
  return Math.sqrt(acc / frame.length);
}

export interface Frame {
  pcm: Int16Array;
  /** true when RMS is above the speech threshold */
  speech: boolean;
  seq: number;
}

export interface OverflowEvent {
  droppedNonSpeech: number;
  droppedSpeech: number;
  queueLength: number;
  at: number;
}

/**
 * Accumulates arbitrary-length PCM into exact 800-sample frames and keeps a
 * bounded, backlog-aware queue.
 */
export class FrameQueue {
  private pending: Int16Array = new Int16Array(0);
  private queue: Frame[] = [];
  private seq = 0;
  public overflows: OverflowEvent[] = [];
  public framesIn = 0;
  public framesOut = 0;

  constructor(
    private readonly speechThreshold = 0.01,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get length(): number {
    return this.queue.length;
  }

  /** Push PCM16 samples; emits complete frames into the queue. */
  push(pcm: Int16Array): number {
    const merged = new Int16Array(this.pending.length + pcm.length);
    merged.set(this.pending, 0);
    merged.set(pcm, this.pending.length);
    let offset = 0;
    let emitted = 0;
    while (merged.length - offset >= FRAME_SAMPLES) {
      const slice = merged.subarray(offset, offset + FRAME_SAMPLES);
      const frame: Frame = { pcm: new Int16Array(slice), speech: rms(slice) >= this.speechThreshold, seq: this.seq++ };
      this.enqueue(frame);
      offset += FRAME_SAMPLES;
      emitted++;
    }
    this.pending = merged.subarray(offset).slice();
    return emitted;
  }

  private enqueue(frame: Frame): void {
    this.queue.push(frame);
    this.framesIn++;
    if (this.queue.length > QUEUE_BACKLOG_THRESHOLD) this.shed();
  }

  /** Drop oldest non-speech frames while we're backlogged; if still over the hard max, drop oldest speech too. */
  private shed(): void {
    let droppedNonSpeech = 0;
    let droppedSpeech = 0;
    for (let i = 0; i < this.queue.length && this.queue.length > QUEUE_BACKLOG_THRESHOLD; ) {
      if (!this.queue[i].speech) {
        this.queue.splice(i, 1);
        droppedNonSpeech++;
      } else i++;
    }
    while (this.queue.length > QUEUE_MAX_FRAMES) {
      this.queue.shift();
      droppedSpeech++;
    }
    if (droppedNonSpeech || droppedSpeech) {
      this.overflows.push({ droppedNonSpeech, droppedSpeech, queueLength: this.queue.length, at: this.now() });
    }
  }

  /** Take up to n frames for sending. */
  drain(n = Infinity): Frame[] {
    const out = this.queue.splice(0, Math.min(n, this.queue.length));
    this.framesOut += out.length;
    return out;
  }

  clear(): void {
    this.queue = [];
    this.pending = new Int16Array(0);
  }
}
