import type { Speaker, TranscriptEvent } from "../types";
import type { Frame } from "../audio/chunker";

export type SttStatus = "idle" | "connecting" | "open" | "closed" | "error";

export interface SttClient {
  readonly stream: Speaker;
  status: SttStatus;
  onTranscript: ((e: TranscriptEvent) => void) | null;
  onStatus: ((s: SttStatus, detail?: string) => void) | null;
  start(): Promise<void>;
  sendFrames(frames: Frame[]): void;
  stop(): Promise<void>;
}

export interface SttOptions {
  /** Deepgram model: nova-3 (default) or flux-general-en for Flux endpointing. */
  model?: string;
  language?: string;
  keywords?: string[];
  /** ms of silence before a final; ~300 for the counterparty stream. */
  endpointingMs?: number;
  /** enable speaker diarization for single-mic standalone mode. */
  diarize?: boolean;
  sampleRate?: number;
}
