import type { SRSCard } from "../types";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Modified SM-2 spaced repetition.
 * Quality 0–5 maps to recall confidence (0 = blackout, 5 = perfect).
 * Failure (q < 3) resets the schedule; success widens the interval by ease factor.
 */
export function updateSRS(card: SRSCard, quality: number, now: number = Date.now()): SRSCard {
  if (quality < 0 || quality > 5) throw new Error("SRS quality must be 0..5");
  const c: SRSCard = { ...card };
  if (quality < 3) {
    c.repetition = 0;
    c.intervalDays = 1.0;
  } else {
    c.repetition += 1;
    const q = quality;
    const delta = 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02);
    c.easeFactor = Math.max(1.3, c.easeFactor + delta);
    if (c.repetition === 1) c.intervalDays = 1.0;
    else if (c.repetition === 2) c.intervalDays = 6.0;
    else c.intervalDays = c.intervalDays * c.easeFactor;
  }
  c.dueDate = now + c.intervalDays * DAY_MS;
  return c;
}

export function newCard(questionId: string): SRSCard {
  return {
    questionId,
    repetition: 0,
    easeFactor: 2.5,
    intervalDays: 0,
    dueDate: 0,
  };
}

/** Map a correctness boolean into an SM-2 quality grade. We don't ask the user
 *  for a confidence rating in the UI — correct = 4 (good recall), wrong = 1 (failure). */
export function qualityFromAnswer(correct: boolean): number {
  return correct ? 4 : 1;
}

export function dueCards(cards: Record<string, SRSCard>, now: number = Date.now()): SRSCard[] {
  return Object.values(cards).filter((c) => c.dueDate > 0 && c.dueDate <= now);
}
