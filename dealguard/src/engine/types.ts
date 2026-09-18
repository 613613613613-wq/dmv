// ─── Deal ground truth ───────────────────────────────────────────────────────

export type TermCategory = "financial" | "contingency" | "closing" | "entity" | "other";

/**
 * hard_cap             — a walk-away boundary. Crossing it is a Tier 1 red flag.
 * negotiable           — a target we would like but can move on.
 * agreed               — already agreed on the record; a contradicting recollection is a Tier 1 red flag.
 * internal_confidential— must never be spoken aloud by the user.
 */
export type TermStatus = "hard_cap" | "negotiable" | "agreed" | "internal_confidential";

export type TermUnit = "USD" | "days" | "percent" | "ratio" | "count" | "text";

/** For hard caps: which direction breaches the boundary. */
export type Boundary = "max" | "min" | "exact";

export interface DealTerm {
  termId: string;
  projectId: string;
  category: TermCategory;
  /** snake_case machine name, e.g. purchase_price */
  fieldName: string;
  /** Human-readable value exactly as it appears in the source document. */
  fieldValue: string;
  unit: TermUnit;
  status: TermStatus;
  boundary: Boundary;
  sourceDoc: string;
  /** ISO date, e.g. 2026-08-15 */
  sourceDate: string;
  allowCounterpartyDisclosure: boolean;
  /** Extra spoken aliases beyond the built-in dictionary (e.g. "the number"). */
  aliases: string[];
  /** Optional, free-text note shown on fact cards. */
  note?: string;
}

export interface Counterparty {
  name: string;
  role: string;
  notes: string;
}

export interface Deal {
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  /** Our side of the table, drives boundary direction defaults. */
  side: "buyer" | "seller" | "lender" | "borrower" | "other";
  counterparties: Counterparty[];
  terms: DealTerm[];
  /** Extra keyword biasing for STT beyond term aliases. */
  keywords: string[];
  archived: boolean;
}

// ─── Live ledger ─────────────────────────────────────────────────────────────

export type Speaker = "USER" | "COUNTERPARTY";
export type AssertionType = "OFFER" | "CONCESSION" | "REJECTION" | "QUESTION" | "AGREEMENT";

export interface LedgerEntry {
  entryId: number;
  timestamp: string;
  /** ms since session start — used for transcript timestamps in the memo. */
  offsetMs: number;
  speaker: Speaker;
  assertionType: AssertionType;
  topic: string;
  verbatimText: string;
  /** Normalized numeric value if one was extracted, in the term's unit. */
  value?: number;
  unit?: TermUnit;
  /** Set when the entry crossed or contradicted a deal term. */
  flaggedTermId?: string;
}

export interface TranscriptLine {
  offsetMs: number;
  speaker: Speaker;
  text: string;
}

// ─── Cues ────────────────────────────────────────────────────────────────────

export type Tier = 1 | 2 | 3;

/**
 * REPLY / WAIT come from the conversation coach: REPLY is "say this now",
 * WAIT is "let them finish" (rendered small and dim).
 */
export type CueKind = "RED_FLAG" | "FACT_CARD" | "TALKING_POINT" | "CONFIDENTIAL" | "REPLY" | "WAIT";

export interface Cue {
  id: string;
  tier: Tier;
  kind: CueKind;
  /** ≤ 12 words, the thing the user glances at. */
  headline: string;
  /** Exactly one line: "PSA_Draft_v3_Clean.pdf · 2026-08-15" or the coach's "why". */
  source: string;
  /** For coach cues: the line they just said, shown above the suggestion. */
  context?: string;
  topic: string;
  termId?: string;
  createdAt: number;
  /** ms from end-of-turn to cue publish; used for the latency benchmark. */
  latencyMs?: number;
  speculative?: boolean;
}

// ─── STT ─────────────────────────────────────────────────────────────────────

export interface TranscriptEvent {
  /** Which stream this came from. */
  speaker: Speaker;
  text: string;
  isFinal: boolean;
  /** Set on finals when the STT provider reports speech-final / end of turn. */
  endOfTurn?: boolean;
  /** Wall-clock ms when the event was received. */
  receivedAt: number;
  confidence?: number;
}

// ─── Gating result ───────────────────────────────────────────────────────────

export type UtteranceKind = "question" | "assertion" | "chatter";

export interface GateDecision {
  kind: UtteranceKind;
  assertionType?: AssertionType;
  /** Matched term, if any. */
  term?: DealTerm;
  /** Extracted numeric value, if any, in the matched term's unit. */
  value?: number;
  unit?: TermUnit;
  tier: Tier | null;
  cue?: Omit<Cue, "id" | "createdAt">;
  /** Why the decision was made — surfaced in the ledger audit. */
  reason: string;
}
