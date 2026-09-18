import type { DealTerm } from "./types";

/**
 * Spoken aliases for well-known deal fields. Field names are snake_case; the
 * dictionary maps them to phrases people actually say. Users can add more on
 * each term via `aliases`.
 */
export const FIELD_ALIASES: Record<string, string[]> = {
  purchase_price: ["purchase price", "price", "the number", "asking", "offer price", "sale price", "top line", "headline price", "the figure", "valuation"],
  walk_away_price: ["walk away", "walk-away", "ceiling", "our max", "our cap", "max price", "top number", "the most"],
  target_price: ["target price", "target", "where we want to be"],
  earnest_deposit: ["earnest", "earnest money", "deposit", "emd", "good faith deposit", "escrow deposit", "initial deposit"],
  inspection_window: ["inspection", "inspection period", "inspection window", "due diligence", "dd period", "diligence period", "study period", "feasibility", "feasibility period", "review period"],
  financing_contingency: ["financing contingency", "financing", "loan contingency", "financing period", "loan approval period", "mortgage contingency"],
  zoning_contingency: ["zoning", "zoning contingency", "entitlement", "entitlements", "approvals period", "permitting"],
  closing_date: ["closing", "close", "closing date", "close of escrow", "coe", "settlement", "settlement date"],
  closing_extension: ["extension", "closing extension", "extend closing", "extension fee"],
  cap_rate: ["cap rate", "cap", "going in cap", "going-in cap", "yield"],
  dscr: ["dscr", "debt service coverage", "coverage ratio", "coverage"],
  ltv: ["ltv", "loan to value", "loan-to-value", "leverage"],
  interest_rate: ["interest rate", "rate", "coupon", "pricing on the loan", "spread"],
  loan_amount: ["loan amount", "loan", "proceeds", "debt"],
  seller_credit: ["seller credit", "credit", "concession", "repair credit", "closing credit"],
  noi: ["noi", "net operating income", "operating income"],
  rent_roll: ["rent roll", "in-place rent", "rents"],
  exclusions: ["exclusions", "excluded", "carve out", "carve-out", "not included"],
  broker_fee: ["broker fee", "commission", "brokerage", "fee"],
  term_sheet_expiry: ["expires", "expiration", "term sheet expiry", "deadline"],
  break_fee: ["break fee", "termination fee", "kill fee", "breakup fee"],
  escrow_holdback: ["holdback", "escrow holdback", "retention"],
  assumption_fee: ["assumption fee", "loan assumption"],
};

function humanizeField(fieldName: string): string {
  return fieldName.replace(/_/g, " ").trim();
}

export function aliasesFor(term: DealTerm): string[] {
  const set = new Set<string>();
  set.add(humanizeField(term.fieldName).toLowerCase());
  for (const a of FIELD_ALIASES[term.fieldName] ?? []) set.add(a.toLowerCase());
  for (const a of term.aliases ?? []) if (a.trim()) set.add(a.trim().toLowerCase());
  return [...set];
}

export function humanFieldName(term: DealTerm): string {
  const h = humanizeField(term.fieldName);
  return h.charAt(0).toUpperCase() + h.slice(1);
}

export interface TermMatch {
  term: DealTerm;
  alias: string;
  /** Longer aliases are more specific → higher score. */
  score: number;
  index: number;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find every term mentioned in the text, most specific first. */
export function matchTerms(text: string, terms: DealTerm[]): TermMatch[] {
  const t = ` ${text.toLowerCase().replace(/[^\w$%.'-]+/g, " ")} `;
  const matches: TermMatch[] = [];
  for (const term of terms) {
    let best: TermMatch | null = null;
    for (const alias of aliasesFor(term)) {
      const re = new RegExp(`(?<![\\w-])${escapeRe(alias)}(?![\\w-])`, "i");
      const m = re.exec(t);
      if (!m) continue;
      const score = alias.split(" ").length * 10 + alias.length;
      if (!best || score > best.score) best = { term, alias, score, index: m.index };
    }
    if (best) matches.push(best);
  }
  // Generic aliases ("price") lose to specific ones ("walk away price") when both hit.
  matches.sort((a, b) => b.score - a.score || a.index - b.index);
  return dedupeGenericOverlaps(matches);
}

/**
 * If "purchase price" and "walk away price" both matched only because the
 * generic word "price" appears, keep the specific match. A term keeps its
 * match when its alias is not a substring of a higher-ranked alias.
 */
function dedupeGenericOverlaps(matches: TermMatch[]): TermMatch[] {
  const out: TermMatch[] = [];
  for (const m of matches) {
    const swallowed = out.some((o) => o.alias !== m.alias && o.alias.includes(m.alias) && Math.abs(o.index - m.index) < o.alias.length + 2);
    if (!swallowed) out.push(m);
  }
  return out;
}

/** All alias phrases across a deal — used for STT keyword biasing. */
export function keywordBiasList(terms: DealTerm[], extra: string[] = []): string[] {
  const set = new Set<string>();
  for (const term of terms) for (const a of aliasesFor(term)) if (a.length >= 3) set.add(a);
  for (const e of extra) if (e.trim()) set.add(e.trim());
  return [...set].slice(0, 100);
}
