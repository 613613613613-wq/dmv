import { describe, expect, it } from "vitest";
import { Advisor } from "../src/engine/advisor/llm";
import { makeDemoDeal } from "../src/engine/demoDeal";
import { Ledger } from "../src/engine/ledger";
import { buildMemorandum, memorandumToMarkdown, mmss } from "../src/engine/memorandum";
import { CallSession, type SessionEvent } from "../src/engine/session";
import { SpeculativeEngine } from "../src/engine/speculative";
import { DEMO_SCRIPT } from "../src/engine/stt/mock";
import type { SttClient } from "../src/engine/stt/types";
import type { TranscriptEvent } from "../src/engine/types";

/** Deterministic clock + timer harness. */
function harness() {
  let t = 1_000_000;
  const timers: Array<{ at: number; fn: () => void; id: number }> = [];
  let nextId = 1;
  const setT = ((fn: () => void, ms: number) => {
    const id = nextId++;
    timers.push({ at: t + ms, fn, id });
    return id as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof setTimeout;
  const clearT = ((id: unknown) => {
    const i = timers.findIndex((x) => x.id === (id as number));
    if (i >= 0) timers.splice(i, 1);
  }) as unknown as typeof clearTimeout;
  const advance = (ms: number) => {
    const target = t + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const next = timers[0];
      if (!next || next.at > target) break;
      timers.shift();
      t = next.at;
      next.fn();
    }
    t = target;
  };
  return { now: () => t, setT, clearT, advance };
}

class PushStt implements SttClient {
  readonly stream = "COUNTERPARTY" as const;
  status: "idle" | "connecting" | "open" | "closed" | "error" = "idle";
  onTranscript: ((e: TranscriptEvent) => void) | null = null;
  onStatus: ((s: "idle" | "connecting" | "open" | "closed" | "error", d?: string) => void) | null = null;
  async start() {
    this.status = "open";
    this.onStatus?.("open");
  }
  sendFrames() {}
  async stop() {
    this.status = "closed";
    this.onStatus?.("closed");
  }
}

function makeSession() {
  const h = harness();
  const events: SessionEvent[] = [];
  const stt = new PushStt();
  const session = new CallSession({
    deal: makeDemoDeal(),
    stt: [stt],
    advisor: new Advisor({ provider: "none", apiKey: "" }),
    now: h.now,
    setTimeoutFn: h.setT,
    clearTimeoutFn: h.clearT,
    onEvent: (e) => events.push(e),
  });
  const say = (speaker: "USER" | "COUNTERPARTY", text: string, opts: { interim?: boolean } = {}) => {
    const words = text.split(" ");
    if (opts.interim !== false) {
      for (let i = 2; i < words.length; i += 3) {
        stt.onTranscript?.({ speaker, text: words.slice(0, i).join(" "), isFinal: false, receivedAt: h.now() });
        h.advance(150);
      }
    }
    stt.onTranscript?.({ speaker, text, isFinal: true, endOfTurn: true, receivedAt: h.now() });
  };
  return { h, events, session, stt, say };
}

describe("CallSession", () => {
  it("runs the demo script end to end: red flags, fact cards, ledger, memo", async () => {
    const { h, events, session, say } = makeSession();
    await session.start();
    for (const line of DEMO_SCRIPT) {
      h.advance(line.gapMs ?? 1000);
      say(line.speaker, line.text);
    }
    const cues = events.filter((e) => e.type === "cue").map((e) => (e as Extract<SessionEvent, { type: "cue" }>).cue);
    const headlines = cues.map((c) => `${c.tier}:${c.headline}`);

    // "we agreed to twelve million on the price" → record contradiction
    expect(headlines.some((h) => h.startsWith("1:Record: Purchase price is $14,250,000, not $12M"))).toBe(true);
    // "ten days, that's firm" → below the 21-day hard floor
    expect(headlines.some((h) => h.startsWith("1:10 days is below inspection window 21 calendar days"))).toBe(true);
    // "What was the deposit again?" → fact card
    expect(headlines.some((h) => h.startsWith("2:Earnest deposit: $500,000"))).toBe(true);
    // "we would need you at fifteen million" → above walk-away
    expect(headlines.some((h) => h.startsWith("1:$15M is above walk away price $14,500,000"))).toBe(true);
    // "we can go up to fourteen point six" → user crossing their own walk-away
    expect(headlines.some((h) => h.startsWith("1:Stop — $14.6M is above your walk away price"))).toBe(true);
    // "What cap rate are you underwriting to?" → confidential fact card
    expect(headlines.some((h) => h.includes("Cap rate: 6.25% — internal, don't share"))).toBe(true);
    // Pleasantries produced nothing.
    expect(cues.every((c) => !/Good morning|attorneys/.test(c.headline))).toBe(true);

    // Speculative engine pre-armed on interims for the term-bearing lines.
    const m = session.metrics();
    expect(m.speculativeHits).toBeGreaterThan(0);
    expect(m.medianLatencyMs).toBe(0); // deterministic clock: gating is synchronous at end-of-turn

    const { memorandum, markdown } = await session.end();
    expect(memorandum.ledgerAudit.length).toBe(1);
    expect(memorandum.ledgerAudit[0].text).toMatch(/fourteen point six/);
    expect(memorandum.agreedTerms.some((a) => a.topic === "inspection_window")).toBe(true);
    expect(markdown).toMatch(/^# Deal Memorandum — Harbor Point Industrial \(Sample\)/);
    expect(markdown).toMatch(/⚠️ \[\d\d:\d\d\] \*\*Walk away price\*\*/);
    expect(session.transcript.length).toBe(0); // zero-persistence: transcript dropped after the memo
  });

  it("dismisses on tap, freezes on hold, and lets a Tier 1 override a frozen Tier 2", async () => {
    const { h, events, session, say } = makeSession();
    await session.start();
    say("USER", "What was the deposit again?");
    expect(session.currentCue?.tier).toBe(2);
    session.dismiss();
    expect(session.currentCue).toBeNull();
    expect(events.at(-1)).toMatchObject({ type: "cue-cleared", reason: "dismissed" });

    say("USER", "Remind me where we landed on the closing date?");
    expect(session.currentCue?.tier).toBe(2);
    session.freeze();
    expect(session.isFrozen).toBe(true);
    h.advance(60_000); // TTL would normally have expired
    expect(session.currentCue?.tier).toBe(2);

    say("COUNTERPARTY", "Remind me, what's the earnest money?"); // Tier 2 must not replace a frozen cue
    expect(session.currentCue?.topic).toBe("closing_date");

    say("COUNTERPARTY", "We'll need you at fifteen million."); // Tier 1 overrides
    expect(session.currentCue?.tier).toBe(1);
    expect(session.isFrozen).toBe(false);
  });

  it("auto-clears cues after their TTL", async () => {
    const { h, session, say, events } = makeSession();
    await session.start();
    say("COUNTERPARTY", "We agreed to twelve million on the price.");
    expect(session.currentCue?.tier).toBe(1);
    h.advance(19_000);
    expect(session.currentCue).not.toBeNull();
    h.advance(2_000);
    expect(session.currentCue).toBeNull();
    expect(events.at(-1)).toMatchObject({ type: "cue-cleared", reason: "expired" });
  });

  it("Help Now publishes a grounded talking point immediately", async () => {
    const { session, say } = makeSession();
    await session.start();
    say("COUNTERPARTY", "Let's talk about the deposit for a second.");
    const cue = await session.helpNow();
    expect(cue.kind).toBe("TALKING_POINT");
    expect(cue.headline).toContain("$500,000");
    expect(session.metrics().talkingPoints).toBe(1);
    expect(session.metrics().unsolicitedCues).toBe(0);
  });

  it("merges split finals from one turn and flushes on the 1s timer", async () => {
    const { h, session, stt } = makeSession();
    await session.start();
    stt.onTranscript?.({ speaker: "COUNTERPARTY", text: "We agreed to", isFinal: true, endOfTurn: false, receivedAt: h.now() });
    expect(session.currentCue).toBeNull();
    stt.onTranscript?.({ speaker: "COUNTERPARTY", text: "twelve million on the price.", isFinal: true, endOfTurn: false, receivedAt: h.now() });
    h.advance(1_100);
    expect(session.currentCue?.tier).toBe(1);
    expect(session.transcript.at(-1)?.text).toBe("We agreed to twelve million on the price.");
  });

  it("refuses to end twice", async () => {
    const { session } = makeSession();
    await session.start();
    await session.end();
    await expect(session.end()).rejects.toThrow(/already ended/);
  });
});

describe("SpeculativeEngine", () => {
  it("prepares a candidate on an interim entity and cancels on a pivot", () => {
    let t = 0;
    const eng = new SpeculativeEngine(() => makeDemoDeal().terms, () => t);
    eng.onInterim("regarding the earnest", "COUNTERPARTY");
    expect(eng.peekCandidate()?.topic).toBe("earnest_deposit");
    t = 50;
    // Pivot: the completed thought is about something else with no cue.
    const r = eng.onFinal("regarding the earnest, actually never mind, how's the family", "COUNTERPARTY", 40);
    expect(r).toBeNull();
    expect(eng.stats.cancelled).toBe(1);

    eng.onInterim("what was the earnest", "USER");
    const pub = eng.onFinal("what was the earnest money again?", "USER", 50);
    expect(pub?.speculative).toBe(true);
    expect(pub?.cue.headline).toContain("$500,000");
    expect(eng.stats.hits).toBe(1);
  });
});

describe("Ledger + memorandum", () => {
  it("audits user concessions past hard caps and formats timestamps", () => {
    const deal = makeDemoDeal();
    const ledger = new Ledger();
    ledger.add({ offsetMs: 65_000, speaker: "USER", assertionType: "CONCESSION", topic: "walk_away_price", verbatimText: "we can go to 14.6", value: 14_600_000, unit: "USD", flaggedTermId: "demo-walk-away" });
    ledger.add({ offsetMs: 70_000, speaker: "COUNTERPARTY", assertionType: "REJECTION", topic: "closing_date", verbatimText: "60 days is too long" });
    ledger.add({ offsetMs: 80_000, speaker: "COUNTERPARTY", assertionType: "AGREEMENT", topic: "inspection_window", verbatimText: "fine, 21 days" });
    expect(ledger.audit(deal.terms).length).toBe(1);
    const m = buildMemorandum({ deal, ledger: ledger.toJSON(), transcript: [], durationMs: 90_000, redFlags: 1, factCards: 0, now: new Date("2026-09-01T12:00:00Z") });
    expect(m.agreedTerms.map((a) => a.topic)).toEqual(["walk_away_price", "inspection_window"]);
    expect(m.openIssues.map((o) => o.topic)).toEqual(["closing_date"]);
    expect(m.ledgerAudit[0].at).toBe("01:05");
    expect(mmss(3_601_000)).toBe("60:01");
    const md = memorandumToMarkdown(m);
    expect(md).toContain("## Ledger audit");
    expect(md).toContain("($14.6M)");
    const restored = Ledger.fromJSON(ledger.toJSON());
    expect(restored.all().length).toBe(3);
  });
});
