import type { ContentPack, Question, SRSCard, UserData, CategoryStats } from "../types";
import { dueCards } from "./srs";

export function categoryStats(pack: ContentPack, data: UserData): CategoryStats[] {
  const qToCat = new Map(pack.questions.map((q) => [q.id, q.category]));
  const totals = new Map<string, { attempts: number; correct: number }>();
  for (const a of data.attempts) {
    const cat = qToCat.get(a.questionId);
    if (!cat) continue;
    const t = totals.get(cat) ?? { attempts: 0, correct: 0 };
    t.attempts += 1;
    if (a.correct) t.correct += 1;
    totals.set(cat, t);
  }
  return pack.categories.map((c) => {
    const t = totals.get(c.id) ?? { attempts: 0, correct: 0 };
    return {
      categoryId: c.id,
      attempts: t.attempts,
      correct: t.correct,
      accuracy: t.attempts === 0 ? 0 : t.correct / t.attempts,
    };
  });
}

export function bottomCategories(pack: ContentPack, data: UserData, n = 3): string[] {
  return categoryStats(pack, data)
    .filter((s) => s.attempts > 0)
    .sort((a, b) => a.accuracy - b.accuracy)
    .slice(0, n)
    .map((s) => s.categoryId);
}

/**
 * Three-tier priority for picking the next practice question:
 *   1. SRS due cards (questions the algorithm thinks are about to be forgotten)
 *   2. Random pick from the user's three weakest categories
 *   3. Pure random from the bank
 *
 * "recentlySeen" is the set of question IDs the user just answered in this session
 * so we don't repeat back-to-back.
 */
export function nextPracticeQuestion(
  pack: ContentPack,
  data: UserData,
  recentlySeen: Set<string>,
  filterCategory?: string,
): Question | null {
  const pool = filterCategory
    ? pack.questions.filter((q) => q.category === filterCategory)
    : pack.questions;
  if (pool.length === 0) return null;

  const candidates = (qs: Question[]) => qs.filter((q) => !recentlySeen.has(q.id));

  // 1. Due SRS cards
  const due = new Set(dueCards(data.srsCards).map((c) => c.questionId));
  if (due.size > 0) {
    const dueQs = candidates(pool.filter((q) => due.has(q.id)));
    if (dueQs.length > 0) return pickRandom(dueQs);
  }

  // 2. Weak-category bias
  if (!filterCategory) {
    const weak = bottomCategories(pack, data, 3);
    for (const cat of shuffle(weak)) {
      const qs = candidates(pool.filter((q) => q.category === cat));
      if (qs.length > 0) return pickRandom(qs);
    }
  }

  // 3. Random
  const remaining = candidates(pool);
  if (remaining.length > 0) return pickRandom(remaining);

  // All seen — wrap around.
  return pickRandom(pool);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
