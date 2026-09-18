export type Tone = "warm" | "calm" | "direct" | "playful";

/**
 * A goal-driven conversation. The user types what the conversation is about
 * and what they want out of it; no structured terms required.
 */
export interface Conversation {
  id: string;
  /** Short label shown on Home, e.g. "Vacation budget with Dana". */
  title: string;
  /** The user's own words: what this is about and what they want. */
  goal: string;
  /** Who they're talking to, e.g. "my wife", "Sam (landlord)". */
  counterpart: string;
  tone: Tone;
  /** Optional free-text facts the coach may rely on, one per line. */
  facts: string[];
  createdAt: string;
  updatedAt: string;
}

export type CoachAction = "say" | "wait";

export interface CoachDecision {
  action: CoachAction;
  /** ≤ 12 words in the user's voice, only when action === "say". */
  say?: string;
  /** ≤ 8 words: why now / why this. */
  why?: string;
  /** The line this reacts to (their last words). */
  reactingTo: string;
  source: "llm" | "heuristic" | "script";
}

export interface CoachContext {
  conversation: Conversation;
  /** Oldest first; last ~90 s. */
  recent: Array<{ speaker: "USER" | "COUNTERPARTY"; text: string }>;
  /** Their finalized turn that just ended. */
  theirLine: string;
  /** Index of this counterparty turn (0-based) — used by the scripted demo coach. */
  turnIndex: number;
}

export interface CoachProvider {
  decide(ctx: CoachContext, signal: AbortSignal): Promise<CoachDecision>;
}
