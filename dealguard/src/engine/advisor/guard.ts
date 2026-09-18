import { digitize, parseTermValue, approxEqual } from "../normalize";
import type { DealTerm } from "../types";

/**
 * Strict no-hallucination guard for anything an LLM produces.
 * Every numeric token in the candidate text must be traceable to either a
 * vault term or something actually said in the last 30 seconds. Otherwise
 * the text is rejected and the deterministic template is used instead.
 */

const SCALE: Record<string, number> = { k: 1e3, thousand: 1e3, m: 1e6, mm: 1e6, million: 1e6, b: 1e9, bn: 1e9, billion: 1e9 };

/** All numbers in a text, expanded for scale words: "$12.5M" → 12500000 and 12.5 */
export function numericTokens(text: string): number[] {
  const d = digitize(text).replace(/,/g, "");
  const out: number[] = [];
  for (const m of d.matchAll(/(\d+(?:\.\d+)?)\s*(k|thousand|mm|m|million|bn|b|billion)?\b/gi)) {
    const n = Number(m[1]);
    if (!Number.isFinite(n)) continue;
    out.push(n);
    const s = m[2]?.toLowerCase();
    if (s && SCALE[s]) out.push(n * SCALE[s]);
  }
  return out;
}

export interface GuardResult {
  ok: boolean;
  offending: number[];
}

export function allowedNumbers(terms: DealTerm[], context: string[]): number[] {
  const allowed: number[] = [];
  for (const t of terms) {
    const v = parseTermValue(t.fieldValue, t.unit);
    if (v !== null) {
      allowed.push(v);
      // Allow the compact spoken forms too: 14,250,000 → 14.25 (million) / 14250 (k)
      if (t.unit === "USD") allowed.push(v / 1e6, v / 1e3, v / 1e9);
      if (t.unit === "percent") allowed.push(v * 100); // bps
    }
    allowed.push(...numericTokens(t.fieldValue));
  }
  for (const line of context) allowed.push(...numericTokens(line));
  return allowed;
}

/** Trivial numbers that are never a hallucinated deal fact. */
const HARMLESS = new Set([0, 1, 2, 3, 30]); // "one ask", "two options", "30 seconds"

export function guardText(candidate: string, terms: DealTerm[], context: string[]): GuardResult {
  const allowed = allowedNumbers(terms, context);
  const offending: number[] = [];
  for (const n of numericTokens(candidate)) {
    if (HARMLESS.has(n)) continue;
    if (!allowed.some((a) => approxEqual(a, n))) offending.push(n);
  }
  return { ok: offending.length === 0, offending };
}
