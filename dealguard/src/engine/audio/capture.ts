import { floatToPcm16, FrameQueue, StreamingResampler, type Frame } from "./chunker";

/**
 * Browser / WebView microphone capture. Runs on the audio thread via an
 * AudioWorklet where available (iOS 14.5+, Android Chrome WebView), falling
 * back to ScriptProcessorNode. Frames are pulled by the STT client at its own
 * pace through the FrameQueue so a slow network never blocks capture.
 *
 * Zero-persistence: PCM lives only in this object's memory and in the STT
 * socket's send buffer. Nothing here ever touches storage.
 */

const WORKLET_SOURCE = `
class PcmTap extends AudioWorkletProcessor {
  process(inputs) {
    const ch = inputs[0] && inputs[0][0];
    if (ch) this.port.postMessage(ch.slice());
    return true;
  }
}
registerProcessor("pcm-tap", PcmTap);
`;

export interface CaptureStats {
  framesIn: number;
  framesOut: number;
  overflows: number;
  level: number;
  sampleRate: number;
  engine: "worklet" | "script-processor" | "none";
}

export type FrameSink = (frames: Frame[]) => void;

export class MicCapture {
  private ctx: AudioContext | null = null;
  private stream: MediaStream | null = null;
  private node: AudioNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private level = 0;
  private engine: CaptureStats["engine"] = "none";
  private generation = 0;
  private starting: Promise<void> | null = null;
  readonly queue = new FrameQueue();

  constructor(private readonly sink: FrameSink) {}

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia && typeof AudioContext !== "undefined";
  }

  start(): Promise<void> {
    if (this.starting) return this.starting;
    this.starting = this.doStart().finally(() => {
      this.starting = null;
    });
    return this.starting;
  }

  /** stop() may be called while start() is still awaiting permission; every await re-checks the generation. */
  private async doStart(): Promise<void> {
    if (this.ctx) return;
    const gen = ++this.generation;
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      video: false,
    });
    if (gen !== this.generation) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }
    this.stream = stream;
    this.ctx = new AudioContext({ sampleRate: 48_000 });
    await this.ctx.resume();
    if (gen !== this.generation) return; // stop() already released everything
    const source = this.ctx.createMediaStreamSource(this.stream);
    const resampler = new StreamingResampler(this.ctx.sampleRate);

    const onChunk = (chunk: Float32Array) => {
      const pcm = floatToPcm16(resampler.process(chunk));
      let peak = 0;
      for (let i = 0; i < chunk.length; i += 8) peak = Math.max(peak, Math.abs(chunk[i]));
      this.level = this.level * 0.7 + peak * 0.3;
      this.queue.push(pcm);
    };

    if (this.ctx.audioWorklet) {
      try {
        const blob = new Blob([WORKLET_SOURCE], { type: "application/javascript" });
        const url = URL.createObjectURL(blob);
        await this.ctx.audioWorklet.addModule(url);
        URL.revokeObjectURL(url);
        if (gen !== this.generation) return;
        const worklet = new AudioWorkletNode(this.ctx, "pcm-tap", { numberOfInputs: 1, numberOfOutputs: 0 });
        worklet.port.onmessage = (e: MessageEvent<Float32Array>) => onChunk(e.data);
        source.connect(worklet);
        this.node = worklet;
        this.engine = "worklet";
      } catch {
        this.node = null;
      }
    }
    if (!this.node) {
      const sp = this.ctx.createScriptProcessor(2048, 1, 1);
      sp.onaudioprocess = (e) => onChunk(e.inputBuffer.getChannelData(0));
      source.connect(sp);
      // ScriptProcessor needs a destination to run in some WebViews; keep it silent.
      const mute = this.ctx.createGain();
      mute.gain.value = 0;
      sp.connect(mute).connect(this.ctx.destination);
      this.node = sp;
      this.engine = "script-processor";
    }

    // Flush every 50 ms so STT sees a steady stream regardless of buffer sizes.
    this.timer = setInterval(() => {
      const frames = this.queue.drain();
      if (frames.length) this.sink(frames);
    }, 50);
  }

  stats(): CaptureStats {
    return {
      framesIn: this.queue.framesIn,
      framesOut: this.queue.framesOut,
      overflows: this.queue.overflows.length,
      level: this.level,
      sampleRate: this.ctx?.sampleRate ?? 0,
      engine: this.engine,
    };
  }

  async stop(): Promise<void> {
    this.generation++; // cancels any in-flight start()
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.node?.disconnect();
    this.node = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.ctx) await this.ctx.close().catch(() => undefined);
    this.ctx = null;
    this.queue.clear();
    this.engine = "none";
  }
}
