import { gate } from "./gating";
import { matchTerms } from "./terms";
import type { Cue, DealTerm, GateDecision, Speaker } from "./types";

/**
 * Speculative retrieval: when interim (unfinalized) text names a tracked
 * entity, build the candidate cue immediately. On end-of-turn, publish the
 * candidate if the finalized thought still lands on that topic; otherwise
 * cancel silently. The candidate's `preparedAt` lets us measure how much of
 * the work happened while the speaker was still talking.
 */

export interface Candidate {
  termId: string;
  topic: string;
  speaker: Speaker;
  preparedAt: number;
  interimText: string;
}

export interface Published {
  decision: GateDecision;
  cue: Omit<Cue, "id" | "createdAt">;
  speculative: boolean;
  latencyMs: number;
}

export class SpeculativeEngine {
  private candidate: Candidate | null = null;
  private cancelled = 0;
  private hits = 0;

  constructor(
    private readonly terms: () => DealTerm[],
    private readonly now: () => number = () => Date.now(),
  ) {}

  get stats() {
    return { cancelled: this.cancelled, hits: this.hits };
  }

  peekCandidate(): Candidate | null {
    return this.candidate;
  }

  /** Called on every interim transcript. Cheap: only runs alias matching. */
  onInterim(text: string, speaker: Speaker): Candidate | null {
    const matches = matchTerms(text, this.terms());
    if (!matches.length) return this.candidate;
    const top = matches[0].term;
    if (this.candidate && this.candidate.termId === top.termId && this.candidate.speaker === speaker) {
      this.candidate.interimText = text;
      return this.candidate;
    }
    this.candidate = { termId: top.termId, topic: top.fieldName, speaker, preparedAt: this.now(), interimText: text };
    return this.candidate;
  }

  /** Called on a finalized sentence. Returns what (if anything) to publish. */
  onFinal(text: string, speaker: Speaker, endOfTurnAt: number): Published | null {
    const decision = gate({ text, speaker, terms: this.terms() });
    const cand = this.candidate;
    this.candidate = null;

    if (!decision.cue) {
      if (cand) this.cancelled++;
      return null;
    }
    const speculative = !!cand && cand.termId === decision.term?.termId && cand.speaker === speaker;
    if (cand && !speculative) this.cancelled++;
    if (speculative) this.hits++;
    return {
      decision,
      cue: { ...decision.cue, speculative },
      speculative,
      latencyMs: Math.max(0, this.now() - endOfTurnAt),
    };
  }

  reset(): void {
    this.candidate = null;
  }
}
