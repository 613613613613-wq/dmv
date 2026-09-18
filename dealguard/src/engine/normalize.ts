import type { TermUnit } from "./types";

/**
 * Deterministic value extraction. No ML, no guessing: if a value cannot be
 * parsed unambiguously it is not returned, and the gate stays silent.
 */

const WORD_NUMBERS: Record<string, number> = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70,
  eighty: 80, ninety: 90, hundred: 100,
};

const SCALE: Record<string, number> = {
  k: 1e3, thousand: 1e3, grand: 1e3,
  m: 1e6, mm: 1e6, mil: 1e6, million: 1e6,
  b: 1e9, bn: 1e9, billion: 1e9,
};

export interface ExtractedValue {
  value: number;
  unit: TermUnit;
  raw: string;
}

/** "twelve and a half" → 12.5, "twenty one" → 21, "14" → 14 */
function parseNumberToken(tok: string): number | null {
  const cleaned = tok.replace(/,/g, "").toLowerCase();
  if (/^\d+(\.\d+)?$/.test(cleaned)) return Number(cleaned);
  if (cleaned in WORD_NUMBERS) return WORD_NUMBERS[cleaned];
  return null;
}

/** Turn word numbers ("twelve point five million") into digits so one regex handles both. */
export function digitize(text: string): string {
  let t = text.toLowerCase();
  t = t.replace(/\band a half\b/g, " point 5");
  t = t.replace(/\band a quarter\b/g, " point 25");
  // twenty one / twenty-one → 21
  t = t.replace(
    /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine)\b/g,
    (_m, tens, ones) => String(WORD_NUMBERS[tens] + WORD_NUMBERS[ones]),
  );
  t = t.replace(/\b([a-z]+)\b/g, (m) => {
    const n = parseNumberToken(m);
    return n === null ? m : String(n);
  });
  // "5 100" (five hundred) → 500 ; "a 100" → 100
  t = t.replace(/\b(\d{1,2})\s+100\b/g, (_m, n) => String(Number(n) * 100));
  // "14 point 2 5" → "14.25"
  t = t.replace(/\b(\d+)\s+point((?:\s+\d)+)\b/g, (_m, whole, frac: string) => `${whole}.${frac.replace(/\s+/g, "")}`);
  t = t.replace(/\bpoint((?:\s+\d)+)\b/g, (_m, frac: string) => `0.${frac.replace(/\s+/g, "")}`);
  return t;
}

const MONEY_RE =
  /(?:\$\s*)?(\d[\d,]*(?:\.\d+)?)\s*(million|mil|mm|m|billion|bn|b|thousand|grand|k)?\b(?:\s*(?:dollars|bucks|usd))?/gi;

/** Extract every dollar-like figure. Requires a "$", scale word or "dollars" to count as money. */
export function extractMoney(text: string): ExtractedValue[] {
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  for (const m of d.matchAll(MONEY_RE)) {
    const full = m[0];
    const hasDollar = /\$/.test(full) || /dollars|bucks|usd/.test(full);
    const scale = m[2]?.toLowerCase();
    if (!hasDollar && !scale) continue;
    // Lone "m" is ambiguous ("I'm"); accept only when a "$" or a digit-space precedes it.
    if (scale === "m" && !hasDollar && !/\d\s*m\b/.test(full)) continue;
    const base = Number(m[1].replace(/,/g, ""));
    if (!Number.isFinite(base)) continue;
    const mult = scale ? SCALE[scale] ?? 1 : 1;
    out.push({ value: base * mult, unit: "USD", raw: full.trim() });
  }
  return out;
}

/**
 * "we can go up to fourteen point six" right after "$15 million": a bare
 * number with no unit. Scale it (×1, ×1k, ×1M, ×1B) toward a reference value
 * and accept only if it lands within `band` of that reference.
 */
export function extractScaledBare(text: string, reference: number, band = 0.3): ExtractedValue[] {
  if (!(reference > 0)) return [];
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  const unitAfter = /^\s*(?:%|percent|bps|days?|weeks?|months?|x\b|times|hours?|minutes?|years?|people|units?|buildings?)/i;
  for (const m of d.matchAll(/(?<![\d.$])(\d+(?:\.\d+)?)(?!\.?\d)/g)) {
    const after = d.slice(m.index! + m[0].length);
    if (unitAfter.test(after)) continue;
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n === 0) continue;
    let best: { v: number; err: number } | null = null;
    for (const s of [1, 1e3, 1e6, 1e9]) {
      const v = n * s;
      const err = Math.abs(v - reference) / reference;
      if (!best || err < best.err) best = { v, err };
    }
    if (best && best.err <= band) out.push({ value: best.v, unit: "USD", raw: m[0] });
  }
  return out;
}

const DAYS_RE = /(\d+(?:\.\d+)?)\s*(?:-\s*)?(business|calendar|banking)?\s*(days?|weeks?|months?)\b/gi;

export function extractDays(text: string): ExtractedValue[] {
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  for (const m of d.matchAll(DAYS_RE)) {
    const n = Number(m[1]);
    const unitWord = m[3].toLowerCase();
    let days = n;
    if (unitWord.startsWith("week")) days = n * 7;
    if (unitWord.startsWith("month")) days = n * 30;
    out.push({ value: days, unit: "days", raw: m[0].trim() });
  }
  return out;
}

const PERCENT_RE = /(\d+(?:\.\d+)?)\s*(?:%|\b(?:percent|per cent|pct|bps|basis points)\b)/gi;

export function extractPercent(text: string): ExtractedValue[] {
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  for (const m of d.matchAll(PERCENT_RE)) {
    const isBps = /bps|basis/.test(m[0].toLowerCase());
    const n = Number(m[1]);
    out.push({ value: isBps ? n / 100 : n, unit: "percent", raw: m[0].trim() });
  }
  return out;
}

const RATIO_RE = /(\d+(?:\.\d+)?)\s*(?:x|times)\b/gi;

export function extractRatio(text: string): ExtractedValue[] {
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  for (const m of d.matchAll(RATIO_RE)) {
    out.push({ value: Number(m[1]), unit: "ratio", raw: m[0].trim() });
  }
  // bare decimals like "1.25" near "dscr"/"coverage" are handled by the caller
  return out;
}

export function extractCount(text: string): ExtractedValue[] {
  const d = digitize(text);
  const out: ExtractedValue[] = [];
  for (const m of d.matchAll(/\b(\d+(?:\.\d+)?)\b/g)) {
    out.push({ value: Number(m[1]), unit: "count", raw: m[0] });
  }
  return out;
}

/** Extract values of a given unit from free text. */
export function extractByUnit(text: string, unit: TermUnit): ExtractedValue[] {
  switch (unit) {
    case "USD":
      return extractMoney(text);
    case "days":
      return extractDays(text);
    case "percent":
      return extractPercent(text);
    case "ratio": {
      const r = extractRatio(text);
      if (r.length) return r;
      // "DSCR of 1.25" — accept a bare decimal when the ratio keyword is present.
      if (/dscr|coverage|ratio|multiple/i.test(text)) {
        const d = digitize(text);
        return [...d.matchAll(/\b(\d+\.\d+)\b/g)].map((m) => ({ value: Number(m[1]), unit: "ratio" as const, raw: m[0] }));
      }
      return [];
    }
    case "count":
      return extractCount(text);
    case "text":
      return [];
  }
}

/** Parse the canonical field_value string of a term into a number. */
export function parseTermValue(fieldValue: string, unit: TermUnit): number | null {
  const vals = extractByUnit(fieldValue, unit);
  if (vals.length) return vals[0].value;
  // Fall back to any bare number for units whose regex needs a keyword (e.g. "21" for days)
  const bare = digitize(fieldValue).match(/-?\d+(?:\.\d+)?/);
  if (bare && unit !== "text") return Number(bare[0]);
  return null;
}

export function formatValue(value: number, unit: TermUnit): string {
  switch (unit) {
    case "USD": {
      if (value >= 1e9) return `$${trimZeros((value / 1e9).toFixed(2))}B`;
      if (value >= 1e6) return `$${trimZeros((value / 1e6).toFixed(2))}M`;
      if (value >= 1e3) return `$${Math.round(value).toLocaleString("en-US")}`;
      return `$${trimZeros(value.toFixed(2))}`;
    }
    case "days":
      return `${trimZeros(value.toFixed(1))} day${value === 1 ? "" : "s"}`;
    case "percent":
      return `${trimZeros(value.toFixed(2))}%`;
    case "ratio":
      return `${trimZeros(value.toFixed(2))}x`;
    case "count":
      return trimZeros(value.toFixed(2));
    case "text":
      return String(value);
  }
}

function trimZeros(s: string): string {
  return s.includes(".") ? s.replace(/\.?0+$/, "") : s;
}

/** Two values are "the same" when within 0.5% (rounding, "12.5" vs "12,500,000"). */
export function approxEqual(a: number, b: number): boolean {
  if (a === b) return true;
  const tol = Math.max(Math.abs(a), Math.abs(b)) * 0.005;
  return Math.abs(a - b) <= tol;
}
