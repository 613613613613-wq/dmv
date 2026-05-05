import type { ContentPack, MockTestResult, Question } from "../types";
import { shuffle } from "./util";

export interface MockTest {
  questions: Question[];
  passingScore: number;
  timeLimitMinutes: number | null;
  officialName: { en: string; es: string };
  /** Total questions the real exam has (used for proportional pass-mark scaling). */
  officialQuestionCount: number;
}

/**
 * Stratified sampling: respect each category's weight in the real exam.
 * Uses Hamilton's largest-remainder method so we always hit the target
 * exactly, without truncation bias against later categories.
 */
export function generateMockTest(pack: ContentPack): MockTest {
  const target = pack.exam.questionCount;
  const buckets = pack.categories.map((cat) => {
    const pool = pack.questions.filter((q) => q.category === cat.id);
    const ideal = target * cat.weight;
    return {
      pool: shuffle(pool),
      ideal,
      base: Math.floor(ideal),
      remainder: ideal - Math.floor(ideal),
    };
  });

  // Cap each bucket by what's actually available, then distribute
  // any leftover slots by largest fractional remainder.
  const quotas = buckets.map((b) => Math.min(b.base, b.pool.length));
  let assigned = quotas.reduce((a, b) => a + b, 0);
  const order = buckets
    .map((b, i) => ({ i, remainder: b.remainder, room: b.pool.length - quotas[i] }))
    .sort((a, b) => b.remainder - a.remainder);
  for (const o of order) {
    if (assigned >= target) break;
    if (o.room > 0) {
      quotas[o.i] += 1;
      assigned += 1;
    }
  }
  // If still short (under-sized bank), top up by spreading from any bucket with room.
  if (assigned < target) {
    for (let i = 0; i < buckets.length && assigned < target; i++) {
      const room = buckets[i].pool.length - quotas[i];
      if (room > 0) {
        const take = Math.min(room, target - assigned);
        quotas[i] += take;
        assigned += take;
      }
    }
  }

  let picks: Question[] = [];
  buckets.forEach((b, i) => {
    picks.push(...b.pool.slice(0, quotas[i]));
  });

  // Demo fallback: if the pack has zero categorized matches, just use everything.
  if (picks.length === 0) picks = shuffle(pack.questions);

  return {
    questions: shuffle(picks),
    passingScore: pack.exam.passingScore,
    timeLimitMinutes: pack.exam.timeLimitMinutes,
    officialName: pack.exam.officialName,
    officialQuestionCount: pack.exam.questionCount,
  };
}

export function scoreMockTest(
  test: MockTest,
  answers: Record<string, string>,
  durationSeconds: number,
): MockTestResult {
  let correct = 0;
  for (const q of test.questions) {
    if (answers[q.id] === q.correct) correct += 1;
  }
  const total = test.questions.length;
  // Scale the official pass mark by the actual bank size, so an under-sized
  // demo pack (e.g. 15 questions vs. an official 50-question exam) still has
  // an achievable threshold that mirrors the real ratio.
  const ratio = test.passingScore / Math.max(test.officialQuestionCount, 1);
  const scaledThreshold = Math.min(total, Math.max(1, Math.ceil(total * ratio)));
  return {
    id: `mock-${Date.now()}`,
    score: correct,
    total,
    passed: correct >= scaledThreshold,
    durationSeconds,
    timestamp: Date.now(),
  };
}
