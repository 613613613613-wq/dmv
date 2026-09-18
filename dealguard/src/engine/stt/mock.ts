import type { Speaker, TranscriptEvent } from "../types";
import type { Frame } from "../audio/chunker";
import type { SttClient, SttStatus } from "./types";

/**
 * Scripted transcript source for the in-app demo, e2e tests and App Store
 * review. Emits interim → final events with realistic timing and does not
 * need a microphone or an API key.
 */

export interface ScriptLine {
  speaker: Speaker;
  text: string;
  /** ms pause before this line starts */
  gapMs?: number;
}

export interface MockSttOptions {
  /** ms between interim chunks; default 180 */
  interimEveryMs?: number;
  /** Multiply all timings (0.1 = 10× faster, for tests). */
  speed?: number;
  loop?: boolean;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
  now?: () => number;
}

export const DEMO_SCRIPT: ScriptLine[] = [
  { speaker: "COUNTERPARTY", text: "Good morning, thanks for making time today.", gapMs: 600 },
  { speaker: "USER", text: "Of course, good to see you both.", gapMs: 900 },
  { speaker: "COUNTERPARTY", text: "So, picking up from last week, we agreed to twelve million on the price.", gapMs: 1400 },
  { speaker: "USER", text: "Let me check that against the draft.", gapMs: 1500 },
  { speaker: "COUNTERPARTY", text: "And on inspection we can only give you ten days, that's firm.", gapMs: 1800 },
  { speaker: "USER", text: "What was the deposit again?", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "To get this done we would need you at fifteen million.", gapMs: 2000 },
  { speaker: "USER", text: "Okay, we can go up to fourteen point six.", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "What cap rate are you underwriting to?", gapMs: 1800 },
  { speaker: "USER", text: "We are not going to share our cap rate assumption.", gapMs: 1500 },
  { speaker: "COUNTERPARTY", text: "Fine, we can live with twenty one days of inspection.", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "Let's circle back with the attorneys on the rooftop lease language.", gapMs: 1500 },
  { speaker: "USER", text: "Agreed. We'll send the redline tonight.", gapMs: 1200 },
];

export class MockSttClient implements SttClient {
  readonly stream: Speaker = "COUNTERPARTY";
  status: SttStatus = "idle";
  onTranscript: ((e: TranscriptEvent) => void) | null = null;
  onStatus: ((s: SttStatus, detail?: string) => void) | null = null;

  private timer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private readonly setT: typeof setTimeout;
  private readonly clearT: typeof clearTimeout;
  private readonly now: () => number;

  constructor(
    private readonly script: ScriptLine[] = DEMO_SCRIPT,
    private readonly opts: MockSttOptions = {},
  ) {
    this.setT = opts.setTimeoutFn ?? (((fn: () => void, ms?: number) => setTimeout(fn, ms)) as typeof setTimeout);
    this.clearT = opts.clearTimeoutFn ?? (((id: ReturnType<typeof setTimeout>) => clearTimeout(id)) as typeof clearTimeout);
    this.now = opts.now ?? (() => Date.now());
  }

  private scale(ms: number): number {
    return Math.max(0, ms * (this.opts.speed ?? 1));
  }

  async start(): Promise<void> {
    this.stopped = false;
    this.status = "open";
    this.onStatus?.("open");
    this.playLine(0);
  }

  private playLine(i: number): void {
    if (this.stopped) return;
    if (i >= this.script.length) {
      if (this.opts.loop) return this.playLine(0);
      this.status = "closed";
      this.onStatus?.("closed", "script finished");
      return;
    }
    const line = this.script[i];
    const words = line.text.split(" ");
    const every = this.scale(this.opts.interimEveryMs ?? 180);
    const gap = this.scale(line.gapMs ?? 1000);
    let w = 0;
    const tick = () => {
      if (this.stopped) return;
      w = Math.min(words.length, w + 2);
      const partial = words.slice(0, w).join(" ");
      const done = w >= words.length;
      this.onTranscript?.({
        speaker: line.speaker,
        text: partial,
        isFinal: done,
        endOfTurn: done,
        receivedAt: this.now(),
        confidence: 0.98,
      });
      if (done) this.timer = this.setT(() => this.playLine(i + 1), gap);
      else this.timer = this.setT(tick, every);
    };
    this.timer = this.setT(tick, gap);
  }

  sendFrames(_frames: Frame[]): void {
    /* the script does not listen */
  }

  async stop(): Promise<void> {
    this.stopped = true;
    if (this.timer) this.clearT(this.timer);
    this.timer = null;
    this.status = "closed";
    this.onStatus?.("closed");
  }
}
