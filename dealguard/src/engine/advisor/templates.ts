import { clampHeadline, sourceLine } from "../gating";
import { extractMoney, extractDays, extractPercent } from "../normalize";
import { humanFieldName, matchTerms } from "../terms";
import type { Cue, Deal, LedgerEntry, TranscriptLine } from "../types";

export type CueDraft = Omit<Cue, "id" | "createdAt">;

export interface AdviceContext {
  deal: Deal;
  /** Last ~30 s of transcript, oldest first. */
  recentLines: TranscriptLine[];
  ledger: LedgerEntry[];
}

/**
 * Deterministic "Help Now" fallback. Zero LLM, zero invented figures: every
 * number comes from the vault or the transcript.
 */
export function deterministicTalkingPoint(ctx: AdviceContext): CueDraft {
  const { deal, recentLines } = ctx;
  const recentText = recentLines.map((l) => l.text).join(" ");
  const lastCp = [...recentLines].reverse().find((l) => l.speaker === "COUNTERPARTY");

  // 1. Anchor on the most specific term they touched recently.
  const matches = matchTerms(recentText, deal.terms);
  const anchor = matches.find((m) => m.term.status !== "internal_confidential") ?? matches[0];
  if (anchor) {
    const t = anchor.term;
    const human = humanFieldName(t).toLowerCase();
    if (t.status === "internal_confidential") {
      return {
        tier: 3,
        kind: "TALKING_POINT",
        headline: clampHeadline(`Deflect on ${human}. Ask what their underwriting assumes instead.`),
        source: sourceLine(t),
        topic: t.fieldName,
        termId: t.termId,
      };
    }
    if (t.status === "hard_cap") {
      return {
        tier: 3,
        kind: "TALKING_POINT",
        headline: clampHeadline(`Hold ${human} at ${t.fieldValue}. Trade elsewhere, not here.`),
        source: sourceLine(t),
        topic: t.fieldName,
        termId: t.termId,
      };
    }
    return {
      tier: 3,
      kind: "TALKING_POINT",
      headline: clampHeadline(`Anchor on ${human}: ${t.fieldValue}. Ask what moves for them.`),
      source: sourceLine(t),
      topic: t.fieldName,
      termId: t.termId,
    };
  }

  // 2. They quoted a figure with no term attached: ask for the basis.
  if (lastCp) {
    const fig = extractMoney(lastCp.text)[0] ?? extractDays(lastCp.text)[0] ?? extractPercent(lastCp.text)[0];
    if (fig) {
      return {
        tier: 3,
        kind: "TALKING_POINT",
        headline: clampHeadline(`Ask what the ${fig.raw} is based on before responding.`),
        source: "From the last 30 seconds",
        topic: "general",
      };
    }
  }

  // 3. Nothing specific: a neutral, always-safe move.
  return {
    tier: 3,
    kind: "TALKING_POINT",
    headline: "Restate your priority, then ask what matters most to them.",
    source: "Deal Guard playbook",
    topic: "general",
  };
}
