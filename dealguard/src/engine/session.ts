import { isCommitmentLanguage } from "./classify";
import { gate } from "./gating";
import { Ledger } from "./ledger";
import { buildMemorandum, memorandumToMarkdown, type Memorandum } from "./memorandum";
import { SpeculativeEngine } from "./speculative";
import type { Advisor } from "./advisor/llm";
import type { SttClient, SttStatus } from "./stt/types";
import type { Cue, Deal, LedgerEntry, Speaker, TranscriptEvent, TranscriptLine } from "./types";

export type SessionEvent =
  | { type: "cue"; cue: Cue }
  | { type: "cue-cleared"; id: string; reason: "dismissed" | "expired" | "replaced" | "ended" }
  | { type: "frozen"; id: string; frozen: boolean }
  | { type: "transcript"; line: TranscriptLine; isFinal: boolean }
  | { type: "ledger"; entry: LedgerEntry }
  | { type: "status"; stream: Speaker; status: SttStatus; detail?: string }
  | { type: "help-pending" }
  | { type: "ended"; memorandum: Memorandum; markdown: string };

export interface SessionMetrics {
  durationMs: number;
  cuesPublished: number;
  tier1: number;
  tier2: number;
  talkingPoints: number;
  /** Tier 1 + Tier 2 cues not requested by the user. */
  unsolicitedCues: number;
  unsolicitedPer30Min: number;
  latenciesMs: number[];
  medianLatencyMs: number | null;
  speculativeHits: number;
  speculativeCancelled: number;
  finalsProcessed: number;
}

export interface SessionDeps {
  deal: Deal;
  stt: SttClient[];
  advisor: Advisor;
  tier1TtlMs?: number;
  tier2TtlMs?: number;
  talkingPointTtlMs?: number;
  speculative?: boolean;
  now?: () => number;
  setTimeoutFn?: typeof setTimeout;
  clearTimeoutFn?: typeof clearTimeout;
  onEvent: (e: SessionEvent) => void;
}

const RECENT_WINDOW_MS = 30_000;
const TURN_FLUSH_MS = 1_000;

/**
 * One live call. Owns the transcript, the ledger, the speculative engine and
 * the single visible cue. Everything is driven by TranscriptEvents so the
 * same class runs against Deepgram, the scripted mock, or tests.
 */
export class CallSession {
  readonly ledger = new Ledger();
  readonly transcript: TranscriptLine[] = [];
  private readonly spec: SpeculativeEngine;
  private readonly now: () => number;
  private readonly setT: typeof setTimeout;
  private readonly clearT: typeof clearTimeout;
  private startedAt = 0;
  private endedAt: number | null = null;
  private current: Cue | null = null;
  private frozen = false;
  private ttlTimer: ReturnType<typeof setTimeout> | null = null;
  private cueSeq = 0;
  private pendingTurn: { speaker: Speaker; text: string; timer: ReturnType<typeof setTimeout> | null; receivedAt: number } | null = null;
  private interim: Partial<Record<Speaker, string>> = {};
  private m = { tier1: 0, tier2: 0, talkingPoints: 0, latencies: [] as number[], finals: 0 };

  constructor(private readonly deps: SessionDeps) {
    this.now = deps.now ?? (() => Date.now());
    // Wrapped so calling through `this.setT` never invokes window.setTimeout with a foreign `this` (Illegal invocation in browsers).
    this.setT = deps.setTimeoutFn ?? (((fn: () => void, ms?: number) => setTimeout(fn, ms)) as typeof setTimeout);
    this.clearT = deps.clearTimeoutFn ?? (((id: ReturnType<typeof setTimeout>) => clearTimeout(id)) as typeof clearTimeout);
    this.spec = new SpeculativeEngine(() => this.deps.deal.terms, this.now);
  }

  get deal(): Deal {
    return this.deps.deal;
  }
  get currentCue(): Cue | null {
    return this.current;
  }
  get isFrozen(): boolean {
    return this.frozen;
  }
  get elapsedMs(): number {
    return (this.endedAt ?? this.now()) - this.startedAt;
  }

  async start(): Promise<void> {
    this.startedAt = this.now();
    for (const client of this.deps.stt) {
      client.onTranscript = (e) => this.handleTranscript(e);
      client.onStatus = (s, d) => this.deps.onEvent({ type: "status", stream: client.stream, status: s, detail: d });
      await client.start();
    }
  }

  // ── Transcript intake ─────────────────────────────────────────────────────

  handleTranscript(e: TranscriptEvent): void {
    if (this.endedAt !== null) return;
    const offsetMs = e.receivedAt - this.startedAt;
    if (!e.isFinal) {
      this.interim[e.speaker] = e.text;
      this.deps.onEvent({ type: "transcript", line: { offsetMs, speaker: e.speaker, text: e.text }, isFinal: false });
      if (this.deps.speculative !== false) this.spec.onInterim(e.text, e.speaker);
      return;
    }
    this.interim[e.speaker] = "";
    // Merge consecutive finals from the same speaker until end-of-turn.
    if (this.pendingTurn && this.pendingTurn.speaker !== e.speaker) this.flushTurn();
    if (!this.pendingTurn) this.pendingTurn = { speaker: e.speaker, text: "", timer: null, receivedAt: e.receivedAt };
    const t = this.pendingTurn;
    t.text = `${t.text} ${e.text}`.trim();
    t.receivedAt = e.receivedAt;
    if (t.timer) this.clearT(t.timer);
    t.timer = null;
    if (e.endOfTurn) this.flushTurn();
    else t.timer = this.setT(() => this.flushTurn(), TURN_FLUSH_MS);
  }

  private flushTurn(): void {
    const t = this.pendingTurn;
    if (!t) return;
    if (t.timer) this.clearT(t.timer);
    this.pendingTurn = null;
    if (!t.text) return;
    const offsetMs = t.receivedAt - this.startedAt;
    const line: TranscriptLine = { offsetMs, speaker: t.speaker, text: t.text };
    this.transcript.push(line);
    this.deps.onEvent({ type: "transcript", line, isFinal: true });
    this.m.finals++;

    const published = this.spec.onFinal(t.text, t.speaker, t.receivedAt);
    const decision = published?.decision ?? null;

    // Ledger: anything typed that touches a term or carries commitment language.
    const gateKind = decision?.kind;
    const assertionType = decision?.assertionType;
    if (assertionType && gateKind !== "chatter" && (decision?.term || isCommitmentLanguage(t.text))) {
      const entry = this.ledger.add({
        offsetMs,
        speaker: t.speaker,
        assertionType,
        topic: decision?.term?.fieldName ?? "general",
        verbatimText: t.text,
        value: decision?.value,
        unit: decision?.unit,
        flaggedTermId: decision?.tier === 1 ? decision.term?.termId : undefined,
      });
      this.deps.onEvent({ type: "ledger", entry });
    } else if (!decision) {
      // Speculative engine returned null (no cue) — still classify for the ledger.
      this.recordUntypedIfCommitment(line);
    }

    if (published) {
      this.m.latencies.push(published.latencyMs);
      this.publish({ ...published.cue, latencyMs: published.latencyMs }, published.cue.tier === 1 ? this.deps.tier1TtlMs ?? 20_000 : this.deps.tier2TtlMs ?? 8_000, false);
    }
  }

  private recordUntypedIfCommitment(line: TranscriptLine): void {
    // gate() already ran inside the speculative engine and found no cue;
    // re-run only the cheap classification so the ledger still captures positions.
    if (!isCommitmentLanguage(line.text)) return;
    const d = gate({ text: line.text, speaker: line.speaker, terms: this.deps.deal.terms });
    if (d.kind === "chatter" || !d.assertionType) return;
    const entry = this.ledger.add({
      offsetMs: line.offsetMs,
      speaker: line.speaker,
      assertionType: d.assertionType,
      topic: d.term?.fieldName ?? "general",
      verbatimText: line.text,
      value: d.value,
      unit: d.unit,
    });
    this.deps.onEvent({ type: "ledger", entry });
  }

  // ── Cue lifecycle ─────────────────────────────────────────────────────────

  private publish(draft: Omit<Cue, "id" | "createdAt">, ttlMs: number, solicited: boolean): Cue {
    // A frozen cue holds the screen — except for a Tier 1 red flag, which always wins.
    if (this.frozen && this.current && draft.tier !== 1) return this.current;
    if (this.current) this.deps.onEvent({ type: "cue-cleared", id: this.current.id, reason: "replaced" });
    const cue: Cue = { ...draft, id: `cue-${++this.cueSeq}`, createdAt: this.now() };
    this.current = cue;
    this.frozen = false;
    if (cue.tier === 1) this.m.tier1++;
    else if (cue.tier === 2) this.m.tier2++;
    else this.m.talkingPoints++;
    void solicited;
    this.deps.onEvent({ type: "cue", cue });
    this.armTtl(ttlMs);
    return cue;
  }

  private armTtl(ttlMs: number): void {
    if (this.ttlTimer) this.clearT(this.ttlTimer);
    this.ttlTimer = this.setT(() => {
      if (this.frozen || !this.current) return;
      const id = this.current.id;
      this.current = null;
      this.deps.onEvent({ type: "cue-cleared", id, reason: "expired" });
    }, ttlMs);
  }

  /** Spacebar tap / screen tap. */
  dismiss(): void {
    if (!this.current) return;
    const id = this.current.id;
    this.current = null;
    this.frozen = false;
    if (this.ttlTimer) this.clearT(this.ttlTimer);
    this.deps.onEvent({ type: "cue-cleared", id, reason: "dismissed" });
  }

  /** Spacebar hold 1.5 s / long-press. */
  freeze(frozen = true): void {
    if (!this.current) return;
    this.frozen = frozen;
    this.deps.onEvent({ type: "frozen", id: this.current.id, frozen });
    if (!frozen) this.armTtl(this.deps.tier2TtlMs ?? 8_000);
  }

  recentLines(windowMs = RECENT_WINDOW_MS): TranscriptLine[] {
    const cutoff = this.elapsedMs - windowMs;
    const lines = this.transcript.filter((l) => l.offsetMs >= cutoff);
    // Include what is being said right now.
    for (const sp of ["COUNTERPARTY", "USER"] as Speaker[]) {
      const live = this.interim[sp];
      if (live) lines.push({ offsetMs: this.elapsedMs, speaker: sp, text: live });
    }
    return lines;
  }

  /** Cmd+H / "Help Now" button: instant on-demand talking point. */
  async helpNow(): Promise<Cue> {
    this.deps.onEvent({ type: "help-pending" });
    const started = this.now();
    const result = await this.deps.advisor.helpNow({ deal: this.deps.deal, recentLines: this.recentLines(), ledger: [...this.ledger.all()] });
    const latencyMs = this.now() - started;
    const wasFrozen = this.frozen;
    this.frozen = false; // an explicit ask always replaces
    const cue = this.publish({ ...result.cue, latencyMs }, this.deps.talkingPointTtlMs ?? 12_000, true);
    void wasFrozen;
    return cue;
  }

  // ── End ───────────────────────────────────────────────────────────────────

  metrics(): SessionMetrics {
    const lat = [...this.m.latencies].sort((a, b) => a - b);
    const median = lat.length ? lat[Math.floor(lat.length / 2)] : null;
    const unsolicited = this.m.tier1 + this.m.tier2;
    const minutes = Math.max(1, this.elapsedMs / 60_000);
    return {
      durationMs: this.elapsedMs,
      cuesPublished: this.m.tier1 + this.m.tier2 + this.m.talkingPoints,
      tier1: this.m.tier1,
      tier2: this.m.tier2,
      talkingPoints: this.m.talkingPoints,
      unsolicitedCues: unsolicited,
      unsolicitedPer30Min: (unsolicited / minutes) * 30,
      latenciesMs: lat,
      medianLatencyMs: median,
      speculativeHits: this.spec.stats.hits,
      speculativeCancelled: this.spec.stats.cancelled,
      finalsProcessed: this.m.finals,
    };
  }

  async end(): Promise<{ memorandum: Memorandum; markdown: string; metrics: SessionMetrics }> {
    if (this.endedAt !== null) throw new Error("session already ended");
    this.flushTurn();
    this.endedAt = this.now();
    if (this.ttlTimer) this.clearT(this.ttlTimer);
    if (this.current) this.deps.onEvent({ type: "cue-cleared", id: this.current.id, reason: "ended" });
    this.current = null;
    await Promise.all(this.deps.stt.map((c) => c.stop().catch(() => undefined)));
    const memorandum = buildMemorandum({
      deal: this.deps.deal,
      ledger: [...this.ledger.all()],
      transcript: this.transcript,
      durationMs: this.elapsedMs,
      redFlags: this.m.tier1,
      factCards: this.m.tier2,
      now: new Date(this.now()),
    });
    const markdown = memorandumToMarkdown(memorandum);
    this.deps.onEvent({ type: "ended", memorandum, markdown });
    // Zero-persistence: drop the raw transcript from memory once the memo exists.
    this.transcript.length = 0;
    return { memorandum, markdown, metrics: this.metrics() };
  }
}
