import { classifyAssertion, classifyUtterance, normalizeText } from "./classify";
import { approxEqual, digitize, extractMoney, extractByUnit, extractScaledBare, formatValue, parseTermValue } from "./normalize";
import { humanFieldName, matchTerms } from "./terms";
import type { Cue, DealTerm, GateDecision, Speaker, TermUnit } from "./types";

/**
 * The 3-tier gating filter.
 *
 *   [Finalized sentence]
 *      │
 *      ▼
 *   assertion or question? ── no ──▶ chatter: log only, screen stays blank
 *      │ yes
 *      ▼
 *   touches a deal term?
 *      ├─ contradicts a boundary / the record ──▶ TIER 1  RED FLAG
 *      ├─ asks about a known fact             ──▶ TIER 2  FACT CARD
 *      └─ no                                  ──▶ standby (wait for Help hotkey)
 *
 * Everything here is deterministic. No value that is not in the vault or in
 * the utterance itself can appear on a cue.
 */

const RECOLLECTION =
  /\b(we agreed|you agreed|we had agreed|had agreed|agreed to|agreed on|agreed at|as agreed|you said|we said|you told|you mentioned|we discussed|as discussed|last week|last time|last call|last month|yesterday|on the record|we settled|settled on|settled at|understood that|my notes|our notes|the record|per the|in the psa|in the loi|in the term sheet|in the draft|in the contract|the psa|the loi|the term sheet|the draft|the contract|the memo|the redline|already agreed|previously|earlier you|earlier we|you committed|we committed|we shook on|you confirmed|we confirmed|remember)\b/i;

/** Position / commitment language. Required before an unnamed figure is attributed to a term. */
const POSITION =
  /\b(need you at|we need|we'd need|our number|the number|my number|go up to|come down to|get to|stretch to|can do|could do|we'll do|i'll do|offer|offering|propose|proposing|counter|accept|take it|live with|meet you|settle|land at|landing at|firm at|not a penny|at least|no more than|up to|down to|at \$|at \d|for \$|to \$|is \$|be \$|pay|paying|price|bid|ask|asking|deposit|earnest|credit)\b/i;

export const MAX_HEADLINE_WORDS = 12;

/** Money figures within this band of a USD term are attributed to it when no alias was spoken. */
const IMPLICIT_MAGNITUDE_BAND = 0.3;

export function clampHeadline(s: string, max = MAX_HEADLINE_WORDS): string {
  const words = normalizeText(s).split(" ");
  if (words.length <= max) return words.join(" ");
  return words.slice(0, max).join(" ").replace(/[,;:—-]+$/, "") + "…";
}

export function sourceLine(term: DealTerm): string {
  return `${term.sourceDoc} · ${term.sourceDate}`;
}

type CueDraft = Omit<Cue, "id" | "createdAt">;

function draft(kind: CueDraft["kind"], tier: 1 | 2, headline: string, term: DealTerm): CueDraft {
  return {
    kind,
    tier,
    headline: clampHeadline(headline),
    source: sourceLine(term),
    topic: term.fieldName,
    termId: term.termId,
  };
}

export interface GateInput {
  text: string;
  speaker: Speaker;
  terms: DealTerm[];
}

interface TermEval {
  decision: GateDecision;
  /** 4 = boundary breach, 3 = record contradiction / disclosure, 2 = tier 2, 1 = logged, 0 = nothing */
  severity: number;
}

function breaches(value: number, cap: number, term: DealTerm): boolean {
  switch (term.boundary) {
    case "max":
      return value > cap && !approxEqual(value, cap);
    case "min":
      return value < cap && !approxEqual(value, cap);
    case "exact":
      return !approxEqual(value, cap);
  }
}

/** For negotiable targets: is the counter worse than our target in the boundary direction? */
function worseThanTarget(value: number, target: number, term: DealTerm): boolean {
  return breaches(value, target, term);
}

function pickValue(text: string, unit: TermUnit, termValue: number | null): { value: number; raw: string } | null {
  let vals = extractByUnit(text, unit);
  // "we could do 14.4 for the price": bare figure, scale it toward the record.
  if (!vals.length && unit === "USD" && termValue !== null) vals = extractScaledBare(text, termValue, IMPLICIT_MAGNITUDE_BAND);
  if (!vals.length) return null;
  const differing = termValue === null ? undefined : vals.find((v) => !approxEqual(v.value, termValue));
  const v = differing ?? vals[0];
  return { value: v.value, raw: v.raw };
}

function evaluateTerm(text: string, speaker: Speaker, term: DealTerm, kind: "question" | "assertion", implicit: boolean): TermEval {
  const human = humanFieldName(term);
  const termValue = parseTermValue(term.fieldValue, term.unit);
  const picked = term.unit === "text" ? null : pickValue(text, term.unit, termValue);
  const assertionType = classifyAssertion(text, speaker);
  const recollection = RECOLLECTION.test(text);
  const base: GateDecision = {
    kind,
    assertionType,
    term,
    value: picked?.value,
    unit: picked ? term.unit : undefined,
    tier: null,
    reason: "",
  };
  const same = picked !== null && termValue !== null && approxEqual(picked.value, termValue);
  const differs = picked !== null && termValue !== null && !same;

  // ── The user is about to say something confidential out loud ──
  if (speaker === "USER" && term.status === "internal_confidential") {
    if (same) {
      return {
        severity: 3,
        decision: {
          ...base,
          tier: 1,
          reason: "user disclosed a confidential value",
          cue: draft("CONFIDENTIAL", 1, `Stop — ${human} is confidential. Don't disclose.`, term),
        },
      };
    }
    if (implicit) return { severity: 0, decision: { ...base, reason: "implicit, no disclosure" } };
    return {
      severity: 2,
      decision: {
        ...base,
        tier: 2,
        reason: "user touched a confidential term",
        cue: draft("CONFIDENTIAL", 2, `${human} is internal only — keep it vague.`, term),
      },
    };
  }

  // ── Misremembered record, phrased any way: "We agreed to $12M" / "we settled on $14.1M, remember?" ──
  if (differs && ((term.status === "agreed" && !implicit) || recollection)) {
    const who = speaker === "USER" ? "You" : "They";
    return {
      severity: 3,
      decision: {
        ...base,
        kind: "assertion",
        tier: 1,
        reason: "contradicts the record",
        cue: draft("RED_FLAG", 1, `Record: ${human} is ${term.fieldValue}, not ${formatValue(picked!.value, term.unit)}. ${who} misstated it.`, term),
      },
    };
  }

  // ── Hard boundary crossed ──
  if (differs && term.status === "hard_cap" && breaches(picked!.value, termValue!, term)) {
    const dir = term.boundary === "max" ? "above" : term.boundary === "min" ? "below" : "off";
    const headline =
      speaker === "USER"
        ? `Stop — ${formatValue(picked!.value, term.unit)} is ${dir} your ${human.toLowerCase()} (${term.fieldValue}).`
        : `${formatValue(picked!.value, term.unit)} is ${dir} ${human.toLowerCase()} ${term.fieldValue}. Hold.`;
    return {
      severity: 4,
      decision: { ...base, kind: "assertion", tier: 1, reason: "boundary breached", cue: draft("RED_FLAG", 1, headline, term) },
    };
  }

  // Implicit (magnitude-only) attributions only ever produce Tier 1; anything softer stays silent.
  if (implicit) return { severity: picked ? 1 : 0, decision: { ...base, reason: picked ? "implicit figure inside boundary" : "implicit, no figure" } };

  // ── Questions about a known fact → fact card ──
  if (kind === "question") {
    const confidential = term.status === "internal_confidential" || !term.allowCounterpartyDisclosure;
    const suffix = speaker === "COUNTERPARTY" && confidential ? " — internal, don't share" : "";
    return {
      severity: 2,
      decision: {
        ...base,
        tier: 2,
        reason: "question on a known deal term",
        cue: draft(confidential && speaker === "COUNTERPARTY" ? "CONFIDENTIAL" : "FACT_CARD", 2, `${human}: ${term.fieldValue}${suffix}`, term),
      },
    };
  }

  if (picked && termValue !== null) {
    // Counterparty quoting exactly our confidential figure — worth a glance.
    if (speaker === "COUNTERPARTY" && term.status === "internal_confidential" && same) {
      return {
        severity: 2,
        decision: {
          ...base,
          tier: 2,
          reason: "counterparty quoted a confidential figure",
          cue: draft("CONFIDENTIAL", 2, `They quoted your confidential ${human.toLowerCase()} exactly.`, term),
        },
      };
    }

    // A counter on a negotiable term that is worse than our target: show where we stand.
    if (differs && term.status === "negotiable" && speaker === "COUNTERPARTY" && worseThanTarget(picked.value, termValue, term)) {
      return {
        severity: 2,
        decision: {
          ...base,
          tier: 2,
          reason: "counter on a negotiable term",
          cue: draft("FACT_CARD", 2, `Their ${formatValue(picked.value, term.unit)} vs. target ${human.toLowerCase()} ${term.fieldValue}.`, term),
        },
      };
    }

    return { severity: 1, decision: { ...base, reason: same ? "consistent with record" : "within boundary" } };
  }

  // Recollection without a number: surface the record quietly.
  if (recollection) {
    return {
      severity: 2,
      decision: {
        ...base,
        tier: 2,
        reason: "record referenced without a figure",
        cue: draft("FACT_CARD", 2, `${human}: ${term.fieldValue}`, term),
      },
    };
  }

  return { severity: 1, decision: { ...base, reason: "term mentioned, no figure" } };
}

/**
 * When a dollar figure is spoken without naming the term ("we agreed to $12M"),
 * attribute it to USD terms of similar magnitude. Only Tier 1 outcomes are
 * allowed from this path, so a stray number never produces a card by itself.
 */
function inferMoneyTerms(text: string, terms: DealTerm[], alreadyMatched: Set<string>): DealTerm[] {
  if (!RECOLLECTION.test(text) && !POSITION.test(digitize(text))) return [];
  if (terms.some((t) => alreadyMatched.has(t.termId) && t.unit === "USD")) return [];
  const money = extractMoney(text);
  const out: DealTerm[] = [];
  for (const term of terms) {
    if (term.unit !== "USD" || alreadyMatched.has(term.termId)) continue;
    const tv = parseTermValue(term.fieldValue, term.unit);
    if (tv === null || tv <= 0) continue;
    const candidates = money.length ? money : extractScaledBare(text, tv, IMPLICIT_MAGNITUDE_BAND);
    if (candidates.some((m) => Math.abs(m.value - tv) / tv <= IMPLICIT_MAGNITUDE_BAND)) out.push(term);
  }
  return out;
}

export function gate(input: GateInput): GateDecision {
  const text = normalizeText(input.text);
  const kind = classifyUtterance(text);
  if (kind === "chatter") return { kind, tier: null, reason: "chatter" };

  const matches = matchTerms(text, input.terms);
  const assertionType = classifyAssertion(text, input.speaker);
  const matchedIds = new Set(matches.map((m) => m.term.termId));
  const implicit = inferMoneyTerms(text, input.terms, matchedIds);

  if (!matches.length && !implicit.length) return { kind, assertionType, tier: null, reason: "no deal term touched" };

  let best: TermEval | null = null;
  for (const m of matches) {
    const ev = evaluateTerm(text, input.speaker, m.term, kind, false);
    if (!best || ev.severity > best.severity) best = ev;
  }
  for (const term of implicit) {
    const ev = evaluateTerm(text, input.speaker, term, kind, true);
    if (!best || ev.severity > best.severity) best = ev;
  }
  const d = best!.decision;
  if (!d.cue && !matches.length) return { ...d, term: undefined, value: undefined, unit: undefined, reason: "no deal term touched" };
  return d;
}
