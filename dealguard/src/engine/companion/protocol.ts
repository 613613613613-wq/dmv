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

export type HudClientMessage = { type: "hello"; device: string; version: number; token?: string } | { type: "pong"; t: number } | { type: "dismiss"; id: string } | { type: "freeze"; id: string; frozen: boolean } | { type: "help" };

const KINDS: CueKind[] = ["RED_FLAG", "FACT_CARD", "TALKING_POINT", "CONFIDENTIAL", "REPLY", "WAIT"];

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
        id: o.id.slice(0, 64),
        tier,
        kind,
        headline: o.headline.slice(0, 160),
        source: o.source.slice(0, 120),
        topic: typeof o.topic === "string" ? o.topic.slice(0, 64) : "general",
        ttlMs: typeof o.ttlMs === "number" && Number.isFinite(o.ttlMs) ? Math.min(120_000, Math.max(1_000, o.ttlMs)) : undefined,
      };
    }
    case "clear":
      return { type: "clear", id: typeof o.id === "string" ? o.id.slice(0, 64) : undefined };
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

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const LOCAL_NAME_RE = /^(localhost|[a-z0-9]([a-z0-9-]*[a-z0-9])?\.local)$/i;

/**
 * Companion mode speaks plain ws:// (the desktop daemon lives on the same
 * Wi-Fi), so only private / link-local addresses and mDNS `.local` names are
 * accepted. A public host is rejected outright — the phone never opens a
 * cleartext socket to the internet.
 */
export function isPrivateHost(host: string): boolean {
  if (LOCAL_NAME_RE.test(host)) return true;
  const m = IPV4_RE.exec(host);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  if ([m[1], m[2], m[3], m[4]].some((o) => Number(o) > 255)) return false;
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 169 && b === 254) return true; // link-local
  if (a === 127) return true; // loopback (dev)
  return false;
}

export function validateHost(host: string): string | null {
  const h = host.trim().replace(/^wss?:\/\//, "").replace(/\/.*$/, "").replace(/:\d+$/, "");
  return isPrivateHost(h) ? h : null;
}

/** Token is sent inside the `hello` frame, never in the URL (keeps it out of access logs). */
export function buildCompanionUrl(host: string, port = COMPANION_DEFAULT_PORT): string | null {
  const h = validateHost(host);
  if (!h) return null;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;
  return `ws://${h}:${port}/hud`;
}

export function backoffMs(attempt: number): number {
  return Math.min(10_000, 500 * 2 ** Math.min(attempt, 5));
}
