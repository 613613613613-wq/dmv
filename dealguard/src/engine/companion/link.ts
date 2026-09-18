import { backoffMs, buildCompanionUrl, hudCueToCue, parseHudMessage, PROTOCOL_VERSION, type HudClientMessage, type HudMessage } from "./protocol";
import type { Cue } from "../types";

export type LinkStatus = "idle" | "connecting" | "open" | "reconnecting" | "closed" | "error";

export interface CompanionLinkDeps {
  host: string;
  port?: number;
  token?: string;
  device?: string;
  socketFactory?: (url: string) => WebSocket;
  setTimeoutFn?: typeof setTimeout;
  now?: () => number;
}

/**
 * Phone-side client for the desktop broadcaster. Reconnects with backoff,
 * forwards cues and stream status, and sends dismiss/freeze/help upstream so
 * the desktop notch window and the phone stay in sync.
 */
export class CompanionLink {
  status: LinkStatus = "idle";
  onCue: ((cue: Cue, ttlMs?: number) => void) | null = null;
  onClear: ((id?: string) => void) | null = null;
  onStatus: ((s: LinkStatus, detail?: string) => void) | null = null;
  onStreams: ((self: string, counterparty: string) => void) | null = null;

  private ws: WebSocket | null = null;
  private attempt = 0;
  private closing = false;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly deps: CompanionLinkDeps) {}

  get url(): string | null {
    return buildCompanionUrl(this.deps.host, this.deps.port);
  }

  private set(s: LinkStatus, detail?: string): void {
    this.status = s;
    this.onStatus?.(s, detail);
  }

  connect(): void {
    const url = this.url;
    if (!url) {
      this.set("error", "invalid host");
      return;
    }
    this.closing = false;
    this.set(this.attempt ? "reconnecting" : "connecting");
    const ws = (this.deps.socketFactory ?? ((u) => new WebSocket(u)))(url);
    this.ws = ws;
    ws.onopen = () => {
      this.attempt = 0;
      this.set("open");
      this.send({ type: "hello", device: this.deps.device ?? "phone", version: PROTOCOL_VERSION, token: this.deps.token || undefined });
    };
    ws.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      const m = parseHudMessage(ev.data);
      if (m) this.handle(m);
    };
    ws.onerror = () => this.set("error", "socket error");
    ws.onclose = () => {
      this.ws = null;
      if (this.closing) return this.set("closed");
      const delay = backoffMs(this.attempt++);
      this.set("reconnecting", `retry in ${delay}ms`);
      this.timer = (this.deps.setTimeoutFn ?? setTimeout)(() => this.connect(), delay);
    };
  }

  private handle(m: HudMessage): void {
    switch (m.type) {
      case "cue":
        this.onCue?.(hudCueToCue(m, (this.deps.now ?? Date.now)()), m.ttlMs);
        break;
      case "clear":
        this.onClear?.(m.id);
        break;
      case "status":
        this.onStreams?.(m.self, m.counterparty);
        break;
      case "ping":
        this.send({ type: "pong", t: m.t });
        break;
      case "hello":
        break;
    }
  }

  send(m: HudClientMessage): void {
    if (this.ws && this.ws.readyState === this.ws.OPEN) this.ws.send(JSON.stringify(m));
  }

  dismiss(id: string): void {
    this.send({ type: "dismiss", id });
  }
  freeze(id: string, frozen: boolean): void {
    this.send({ type: "freeze", id, frozen });
  }
  help(): void {
    this.send({ type: "help" });
  }

  close(): void {
    this.closing = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.ws?.close();
    this.ws = null;
    this.set("closed");
  }
}
