import type { Attempt } from "../types";

/** YYYY-MM-DD in the user's local time zone — DST-safe. */
function localDayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Return the day key for `n` calendar days before `ts` (local time). */
function dayKeyOffsetFromNow(ts: number, daysBack: number): string {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysBack);
  return localDayKey(d.getTime());
}

export function currentStreak(attempts: Attempt[], now: number = Date.now()): number {
  if (attempts.length === 0) return 0;
  const days = new Set(attempts.map((a) => localDayKey(a.timestamp)));
  let offset = 0;
  // If they haven't studied today, the streak is anchored to yesterday.
  if (!days.has(localDayKey(now))) offset = 1;
  let streak = 0;
  while (days.has(dayKeyOffsetFromNow(now, offset))) {
    streak += 1;
    offset += 1;
  }
  return streak;
}

function nextDayKey(key: string): string {
  // Parse YYYY-MM-DD as local noon to dodge any DST edge cases, add 1 day.
  const [y, m, d] = key.split("-").map(Number);
  const next = new Date(y, m - 1, d, 12, 0, 0, 0);
  next.setDate(next.getDate() + 1);
  return localDayKey(next.getTime());
}

export function longestStreak(attempts: Attempt[]): number {
  if (attempts.length === 0) return 0;
  const days = Array.from(new Set(attempts.map((a) => localDayKey(a.timestamp)))).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < days.length; i++) {
    if (nextDayKey(days[i - 1]) === days[i]) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

export function studiedToday(attempts: Attempt[], now: number = Date.now()): boolean {
  const today = localDayKey(now);
  return attempts.some((a) => localDayKey(a.timestamp) === today);
}
