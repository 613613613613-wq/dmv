import { describe, expect, it } from "vitest";
import { CompanionLink } from "../src/engine/companion/link";
import { backoffMs, buildCompanionUrl, CueDedupe, parseHudMessage, validateHost } from "../src/engine/companion/protocol";
import type { Cue } from "../src/engine/types";

describe("protocol parsing", () => {
  it("accepts well-formed cues and rejects malformed ones", () => {
    const ok = parseHudMessage(JSON.stringify({ type: "cue", id: "c1", tier: 1, kind: "RED_FLAG", headline: "Hold.", source: "PSA · 2026-08-15", topic: "price" }));
    expect(ok?.type).toBe("cue");
    expect(parseHudMessage(JSON.stringify({ type: "cue", id: "c1", tier: 9, kind: "RED_FLAG", headline: "x", source: "y" }))).toBeNull();
    expect(parseHudMessage(JSON.stringify({ type: "cue", id: "c1", tier: 1, kind: "EVIL", headline: "x", source: "y" }))).toBeNull();
    expect(parseHudMessage("{")).toBeNull();
    expect(parseHudMessage(JSON.stringify({ type: "status", self: "open", counterparty: "closed" }))).toEqual({ type: "status", self: "open", counterparty: "closed" });
    expect(parseHudMessage(JSON.stringify({ type: "ping", t: 5 }))).toEqual({ type: "ping", t: 5 });
    expect(parseHudMessage(JSON.stringify({ type: "clear" }))).toEqual({ type: "clear", id: undefined });
  });
  it("truncates oversized headlines", () => {
    const m = parseHudMessage(JSON.stringify({ type: "cue", id: "c", tier: 2, kind: "FACT_CARD", headline: "x".repeat(500), source: "s" }));
    expect(m && m.type === "cue" && m.headline.length).toBe(160);
  });
});

describe("host + url", () => {
  it("validates LAN hosts and builds the ws URL", () => {
    expect(validateHost("192.168.1.20")).toBe("192.168.1.20");
    expect(validateHost("ws://192.168.1.20:8765/")).toBe("192.168.1.20");
    expect(validateHost("my-mac.local")).toBe("my-mac.local");
    expect(validateHost("bad host!")).toBeNull();
    expect(buildCompanionUrl("192.168.1.20")).toBe("ws://192.168.1.20:8765/hud");
    expect(buildCompanionUrl("192.168.1.20", 9000, "t k")).toBe("ws://192.168.1.20:9000/hud?token=t%20k");
    expect(buildCompanionUrl("")).toBeNull();
  });
  it("backs off exponentially with a ceiling", () => {
    expect(backoffMs(0)).toBe(500);
    expect(backoffMs(3)).toBe(4000);
    expect(backoffMs(10)).toBe(10_000);
  });
});

describe("CueDedupe (zero flicker)", () => {
  it("only reports a change when visible content differs", () => {
    const d = new CueDedupe();
    const a: Cue = { id: "1", tier: 1, kind: "RED_FLAG", headline: "Hold.", source: "s", topic: "t", createdAt: 0 };
    expect(d.changed(a)).toBe(true);
    expect(d.changed({ ...a, id: "2", createdAt: 5 })).toBe(false);
    expect(d.changed({ ...a, headline: "Hold!" })).toBe(true);
    expect(d.changed(null)).toBe(true);
    expect(d.changed(null)).toBe(false);
  });
});

class FakeSocket {
  static last: FakeSocket | null = null;
  readonly OPEN = 1;
  readyState = 0;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: unknown }) => void) | null = null;
  onerror: (() => void) | null = null;
  onclose: (() => void) | null = null;
  constructor(public url: string) {
    FakeSocket.last = this;
  }
  send(d: string) {
    this.sent.push(d);
  }
  close() {
    this.readyState = 3;
    this.onclose?.();
  }
  open() {
    this.readyState = 1;
    this.onopen?.();
  }
}

describe("CompanionLink", () => {
  it("connects, says hello, forwards cues, answers pings and reconnects", () => {
    const timers: Array<() => void> = [];
    const link = new CompanionLink({
      host: "192.168.0.5",
      socketFactory: (u) => new FakeSocket(u) as unknown as WebSocket,
      setTimeoutFn: ((fn: () => void) => {
        timers.push(fn);
        return 0 as unknown as ReturnType<typeof setTimeout>;
      }) as unknown as typeof setTimeout,
      now: () => 42,
    });
    const cues: Cue[] = [];
    link.onCue = (c) => cues.push(c);
    link.connect();
    const s1 = FakeSocket.last!;
    expect(s1.url).toBe("ws://192.168.0.5:8765/hud");
    s1.open();
    expect(link.status).toBe("open");
    expect(JSON.parse(s1.sent[0]).type).toBe("hello");

    s1.onmessage?.({ data: JSON.stringify({ type: "cue", id: "c1", tier: 1, kind: "RED_FLAG", headline: "Hold.", source: "PSA · 2026-08-15", topic: "price" }) });
    expect(cues[0].headline).toBe("Hold.");
    expect(cues[0].createdAt).toBe(42);

    s1.onmessage?.({ data: JSON.stringify({ type: "ping", t: 7 }) });
    expect(JSON.parse(s1.sent.at(-1)!)).toEqual({ type: "pong", t: 7 });

    link.dismiss("c1");
    expect(JSON.parse(s1.sent.at(-1)!)).toEqual({ type: "dismiss", id: "c1" });

    // Unexpected drop → reconnect scheduled.
    s1.onclose?.();
    expect(link.status).toBe("reconnecting");
    expect(timers.length).toBe(1);
    timers[0]();
    expect(FakeSocket.last).not.toBe(s1);

    link.close();
    expect(link.status).toBe("closed");
  });

  it("refuses an invalid host", () => {
    const link = new CompanionLink({ host: "not a host", socketFactory: () => new FakeSocket("") as unknown as WebSocket });
    link.connect();
    expect(link.status).toBe("error");
  });
});
