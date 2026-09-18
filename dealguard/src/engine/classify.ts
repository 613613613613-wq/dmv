import type { AssertionType, Speaker, UtteranceKind } from "./types";

const QUESTION_STARTS =
  /^(?:so\s+|and\s+|but\s+|ok(?:ay)?,?\s+|well,?\s+)?(what|what's|whats|where|when|why|how|which|who|can|could|would|will|do|does|did|is|are|was|were|have|has|should|shall|may|might|remind me|any chance|are we|is it|is that)\b/i;

const QUESTION_TAILS = /\b(right|correct|yes|no|isn't it|is that right|is that correct|wasn't it|didn't we|don't we|do we)\s*\?*\s*$/i;

/** Words that make a sentence a commitment / position rather than idle talk. */
const ASSERTION_MARKERS =
  /\b(want|wants|wanted|would like|we'd|i'd|expect|insist|ask|asking|request|looking for|prefer|agree|agreed|agreement|accept|accepted|offer|offering|propose|proposing|counter|need|needs|require|required|must|will|won't|can't|cannot|can do|could do|able to|willing|commit|committed|deal|terms?|price|deposit|contingency|closing|close|days?|weeks?|percent|rate|cap|fee|discount|credit|extend|extension|waive|walk|final|firm|non[-\s]?negotiable|last week|last time|last call|as discussed|you said|we said|we settled|settled|understood|confirm|confirmed|record|minimum|maximum|at least|no more than|up to|top|bottom|budget|number|figure|amount|earnest|escrow|dscr|ltv|loan|financing|inspection|due diligence|diligence|survey|environmental|title|zoning)\b/i;

const CHATTER =
  /^(?:(?:hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you|thanks so much|great|awesome|cool|perfect|sounds good|sure|yeah|yep|okay|ok|alright|got it|no problem|no worries|nice|how are you|how's it going|hope you're well|how was your weekend|how's the weather|talk soon|bye|see you|take care|appreciate it|let me pull that up|one second|one sec|hold on|bear with me|can you hear me|you're on mute|i'm on mute|sorry about that)[\s,.!?]*)+$/i;

const CONCESSION =
  /\b(fine|okay|ok|alright|all right)\b.*\b(we can|we'll|we will|i can|i'll|let's do|that works|we could live with|we can live with|accept|go with)\b|\b(we can go up to|we can come down to|we can move to|we could move to|we'll come down|we'll go up|we'll meet you|split the difference|we can stretch to|i can stretch to|we'll give you|we can give you|we can concede|willing to|we could accept|we can accept|we'll accept|we can live with|we'd be okay with|we're okay with|we're ok with|we could do|we can do|i can do|i could do|throw in|we'll waive|we can waive|we'll extend|we can extend)\b/i;

const REJECTION =
  /\b(no way|not acceptable|unacceptable|can't do|cannot do|can't accept|cannot accept|won't work|doesn't work|does not work|not going to work|won't go|won't move|we're firm|we are firm|firm at|non[-\s]?negotiable|non[-\s]?starter|dealbreaker|deal[-\s]breaker|walk away|walk|pass|reject|rejected|decline|declined|not happening|off the table|no more than|not a penny|not one dollar|not a day|that's too|too high|too low|too long|too short|out of the question|hard no|absolutely not)\b/i;

const AGREEMENT =
  /^(?:okay,?\s+|ok,?\s+|sure,?\s+|alright,?\s+)?deal\b|\b(i promise|you have my word|i'll (?:book|handle|take care|send|do it|call|make sure|sort|arrange)|i will (?:book|handle|take care|send|do it|call|make sure|sort|arrange)|we have a deal|it's a deal|that's a deal|agreed|we agree|deal\.?$|done deal|let's shake on it|you have a deal|we're aligned|we are aligned|confirmed|i confirm|we confirm|i accept|we accept|accepted)\b/i;

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function isQuestion(text: string): boolean {
  const t = normalizeText(text);
  if (!t) return false;
  if (t.endsWith("?")) return true;
  if (QUESTION_STARTS.test(t)) return true;
  if (QUESTION_TAILS.test(t) && /\b(agreed|said|was|is|are|deposit|price|days|window|contingency|closing)\b/i.test(t)) return true;
  return false;
}

export function isChatter(text: string): boolean {
  const t = normalizeText(text).toLowerCase();
  if (!t) return true;
  if (CHATTER.test(t)) return true;
  // Short phrases with no assertion markers and no digits are chatter.
  const words = t.split(" ").length;
  if (words <= 6 && !ASSERTION_MARKERS.test(t) && !/\d/.test(t)) return true;
  return false;
}

/** True when the sentence carries a position, commitment or demand — the ledger records these. */
export function isCommitmentLanguage(text: string): boolean {
  const t = normalizeText(text);
  return ASSERTION_MARKERS.test(t) || /\$|\d/.test(t);
}

export function classifyUtterance(text: string): UtteranceKind {
  const t = normalizeText(text);
  if (isChatter(t)) return "chatter";
  if (isQuestion(t)) return "question";
  return "assertion";
}

/**
 * Ledger assertion type. Order matters: an explicit rejection beats a generic
 * offer even when both markers appear ("we can't do 12, but we can do 12.5"
 * is classed as an OFFER because the concession phrase wins over "can't do"
 * only when it appears later in the sentence).
 */
export function classifyAssertion(text: string, speaker: Speaker): AssertionType {
  const t = normalizeText(text);
  if (isQuestion(t)) return "QUESTION";

  const rej = t.search(REJECTION);
  const con = t.search(CONCESSION);
  const agr = t.search(AGREEMENT);

  if (agr >= 0 && !/\b(we agreed|you agreed|as agreed|agreed to|agreed on|last)\b/i.test(t)) {
    // "agreed" describing a past event is a recollection, not a fresh agreement.
    if (rej < 0) return "AGREEMENT";
  }
  if (rej >= 0 && con >= 0) return con > rej ? "CONCESSION" : "REJECTION";
  if (rej >= 0) return "REJECTION";
  if (con >= 0) return "CONCESSION";
  void speaker;
  return "OFFER";
}
