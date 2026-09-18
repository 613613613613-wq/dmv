import type { Cue, CueKind, Tier } from "../types";

/**
 * Wire protocol between the desktop Audio Router Daemon (zero-flicker
 * broadcaster on ws://<lan-ip>:8765) and the phone Glance HUD.
 * See docs/COMPANION_PROTOCOL.md. All messages are JSON text frames.
 */

export const COMPANION_DEFAULT_PORT = 8765;
export const PROTOCOL_VERSION = 1;

export type HudMessage =
  | { type: "hello"; name: string; version: number }
  | { type: "cue"; id: string; tier: Tier; kind: CueKind; headline: string; source: string; topic: string; ttlMs?: number }
  | { type: "clear"; id?: string }
  | { type: "status"; self: "open" | "closed" | "error"; counterparty: "open" | "closed" | "error" }
  | { type: "ping"; t: number };

export type HudClientMessage = { type: "hello"; device: string; version: number } | { type: "pong"; t: number } | { type: "dismiss"; id: string } | { type: "freeze"; id: string; frozen: boolean } | { type: "help" };

const KINDS: CueKind[] = ["RED_FLAG", "FACT_CARD", "TALKING_POINT", "CONFIDENTIAL"];

/** Strict parser: anything malformed is dropped, never rendered. */
export function parseHudMessage(raw: string): HudMessage | null {
  let m: unknown;
  try {
    m = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!m || typeof m !== "object") return null;
  const o = m as Record<string, unknown>;
  switch (o.type) {
    case "hello":
      return typeof o.name === "string" && typeof o.version === "number" ? { type: "hello", name: o.name, version: o.version } : null;
    case "cue": {
      if (typeof o.id !== "string" || typeof o.headline !== "string" || typeof o.source !== "string") return null;
      const tier = o.tier === 1 || o.tier === 2 || o.tier === 3 ? (o.tier as Tier) : null;
      if (!tier) return null;
      const kind = KINDS.includes(o.kind as CueKind) ? (o.kind as CueKind) : null;
      if (!kind) return null;
      return {
        type: "cue",
        id: o.id,
        tier,
        kind,
        headline: o.headline.slice(0, 160),
        source: o.source.slice(0, 120),
        topic: typeof o.topic === "string" ? o.topic : "general",
        ttlMs: typeof o.ttlMs === "number" ? o.ttlMs : undefined,
      };
    }
    case "clear":
      return { type: "clear", id: typeof o.id === "string" ? o.id : undefined };
    case "status": {
      const ok = (v: unknown): v is "open" | "closed" | "error" => v === "open" || v === "closed" || v === "error";
      return ok(o.self) && ok(o.counterparty) ? { type: "status", self: o.self, counterparty: o.counterparty } : null;
    }
    case "ping":
      return typeof o.t === "number" ? { type: "ping", t: o.t } : null;
    default:
      return null;
  }
}

export function hudCueToCue(m: Extract<HudMessage, { type: "cue" }>, now = Date.now()): Cue {
  return { id: m.id, tier: m.tier, kind: m.kind, headline: m.headline, source: m.source, topic: m.topic, createdAt: now };
}

/** Zero-flicker: re-render only when the visible content actually changed. */
export class CueDedupe {
  private lastKey: string | null = null;

  changed(cue: Cue | null): boolean {
    const key = cue ? `${cue.tier}|${cue.kind}|${cue.headline}|${cue.source}` : "";
    if (key === this.lastKey) return false;
    this.lastKey = key;
    return true;
  }

  reset(): void {
    this.lastKey = null;
  }
}

const HOST_RE = /^(?:(?:\d{1,3}\.){3}\d{1,3}|[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*)$/i;

export function validateHost(host: string): string | null {
  const h = host.trim().replace(/^wss?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  return HOST_RE.test(h) ? h : null;
}

export function buildCompanionUrl(host: string, port = COMPANION_DEFAULT_PORT, token?: string): string | null {
  const h = validateHost(host);
  if (!h) return null;
  const q = token ? `?token=${encodeURIComponent(token)}` : "";
  return `ws://${h}:${port}/hud${q}`;
}

export function backoffMs(attempt: number): number {
  return Math.min(10_000, 500 * 2 ** Math.min(attempt, 5));
}
