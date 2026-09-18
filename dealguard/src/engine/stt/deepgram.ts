import type { Speaker, TranscriptEvent } from "../types";
import type { Frame } from "../audio/chunker";
import type { SttClient, SttOptions, SttStatus } from "./types";

/**
 * Deepgram streaming client (browser WebSocket). Auth uses the
 * `token` subprotocol because browsers cannot set Authorization headers.
 *
 * Two of these run at once on the desktop (self + counterparty). On the phone
 * in standalone mode one runs with diarize=true and the SpeakerMap decides
 * which diarized speaker index is the user.
 */

export const DEEPGRAM_WS = "wss://api.deepgram.com/v1/listen";

export function buildDeepgramUrl(opts: SttOptions = {}): string {
  const p = new URLSearchParams();
  p.set("model", opts.model ?? "nova-3");
  p.set("language", opts.language ?? "en-US");
  p.set("encoding", "linear16");
  p.set("sample_rate", String(opts.sampleRate ?? 16_000));
  p.set("channels", "1");
  p.set("interim_results", "true");
  p.set("smart_format", "true");
  p.set("punctuate", "true");
  p.set("endpointing", String(opts.endpointingMs ?? 300));
  p.set("utterance_end_ms", "1000");
  p.set("vad_events", "true");
  if (opts.diarize) p.set("diarize", "true");
  for (const k of (opts.keywords ?? []).slice(0, 100)) p.append("keyterm", k);
  return `${DEEPGRAM_WS}?${p.toString()}`;
}

export interface DeepgramWord {
  word: string;
  punctuated_word?: string;
  speaker?: number;
  confidence?: number;
}

export interface DeepgramResult {
  type?: string;
  is_final?: boolean;
  speech_final?: boolean;
  channel?: { alternatives?: Array<{ transcript?: string; confidence?: number; words?: DeepgramWord[] }> };
}

export interface ParsedResult {
  transcript: string;
  isFinal: boolean;
  speechFinal: boolean;
  confidence: number;
  /** Dominant diarized speaker index, if diarization is on. */
  speakerIndex?: number;
}

/** Parse one Deepgram "Results" message. Returns null for metadata/utterance-end/etc. */
export function parseDeepgramMessage(raw: string): ParsedResult | null {
  let msg: DeepgramResult;
  try {
    msg = JSON.parse(raw);
  } catch {
    return null;
  }
  if (msg.type && msg.type !== "Results") return null;
  const alt = msg.channel?.alternatives?.[0];
  const transcript = (alt?.transcript ?? "").trim();
  if (!transcript) return null;
  let speakerIndex: number | undefined;
  const words = alt?.words ?? [];
  if (words.some((w) => typeof w.speaker === "number")) {
    const counts = new Map<number, number>();
    for (const w of words) if (typeof w.speaker === "number") counts.set(w.speaker, (counts.get(w.speaker) ?? 0) + 1);
    speakerIndex = [...counts.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }
  return {
    transcript,
    isFinal: !!msg.is_final,
    speechFinal: !!msg.speech_final,
    confidence: alt?.confidence ?? 0,
    speakerIndex,
  };
}

/**
 * Maps diarized speaker indices to USER / COUNTERPARTY. The pre-flight
 * calibration ("say your name") assigns the first index heard to USER.
 */
export class SpeakerMap {
  private userIndex: number | null = null;

  /**
   * @param userIndex known index for the user, or null
   * @param autoCalibrate when true, the first diarized index seen becomes the user
   */
  constructor(
    userIndex: number | null = null,
    private readonly autoCalibrate = false,
  ) {
    this.userIndex = userIndex;
  }

  get calibrated(): boolean {
    return this.userIndex !== null;
  }

  calibrate(index: number): void {
    this.userIndex = index;
  }

  resolve(index: number | undefined, fallback: Speaker): Speaker {
    if (index === undefined) return fallback;
    if (this.userIndex === null) {
      if (!this.autoCalibrate) return fallback;
      this.userIndex = index;
    }
    return index === this.userIndex ? "USER" : "COUNTERPARTY";
  }
}

export interface DeepgramClientDeps {
  apiKey: string;
  stream: Speaker;
  options?: SttOptions;
  speakerMap?: SpeakerMap;
  /** Injected for tests. */
  socketFactory?: (url: string, protocols: string[]) => WebSocket;
  now?: () => number;
}

export class DeepgramClient implements SttClient {
  readonly stream: Speaker;
  status: SttStatus = "idle";
  onTranscript: ((e: TranscriptEvent) => void) | null = null;
  onStatus: ((s: SttStatus, detail?: string) => void) | null = null;

  private ws: WebSocket | null = null;
  private keepAlive: ReturnType<typeof setInterval> | null = null;
  private readonly now: () => number;
  private closing = false;
  private lastInterim = "";

  constructor(private readonly deps: DeepgramClientDeps) {
    this.stream = deps.stream;
    this.now = deps.now ?? (() => Date.now());
  }

  private setStatus(s: SttStatus, detail?: string): void {
    this.status = s;
    this.onStatus?.(s, detail);
  }

  async start(): Promise<void> {
    if (this.ws) return;
    this.closing = false;
    const url = buildDeepgramUrl(this.deps.options);
    this.setStatus("connecting");
    const factory = this.deps.socketFactory ?? ((u, p) => new WebSocket(u, p));
    const ws = factory(url, ["token", this.deps.apiKey]);
    ws.binaryType = "arraybuffer";
    this.ws = ws;

    await new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("Deepgram connection timed out")), 10_000);
      ws.onopen = () => {
        clearTimeout(timer);
        this.setStatus("open");
        this.keepAlive = setInterval(() => {
          if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "KeepAlive" }));
        }, 5_000);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(timer);
        this.setStatus("error", "socket error");
        reject(new Error("Deepgram socket error — check the API key and network"));
      };
    });

    ws.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      const parsed = parseDeepgramMessage(ev.data);
      if (!parsed) return;
      if (!parsed.isFinal && parsed.transcript === this.lastInterim) return; // zero-flicker: identical interim
      this.lastInterim = parsed.isFinal ? "" : parsed.transcript;
      const speaker = this.deps.speakerMap ? this.deps.speakerMap.resolve(parsed.speakerIndex, this.stream) : this.stream;
      this.onTranscript?.({
        speaker,
        text: parsed.transcript,
        isFinal: parsed.isFinal,
        endOfTurn: parsed.speechFinal,
        receivedAt: this.now(),
        confidence: parsed.confidence,
      });
    };
    ws.onclose = (ev: CloseEvent) => {
      if (this.keepAlive) clearInterval(this.keepAlive);
      this.keepAlive = null;
      this.ws = null;
      this.setStatus(this.closing ? "closed" : "error", this.closing ? undefined : `closed (${ev.code})`);
    };
  }

  sendFrames(frames: Frame[]): void {
    const ws = this.ws;
    if (!ws || ws.readyState !== ws.OPEN) return;
    for (const f of frames) ws.send(f.pcm.buffer);
  }

  async stop(): Promise<void> {
    this.closing = true;
    const ws = this.ws;
    if (!ws) {
      this.setStatus("closed");
      return;
    }
    try {
      if (ws.readyState === ws.OPEN) ws.send(JSON.stringify({ type: "CloseStream" }));
      ws.close();
    } catch {
      /* ignore */
    }
  }
}
