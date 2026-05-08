import { useEffect, useState, useCallback } from "react";
import type { Attempt, MockTestResult, Profile, SRSCard, UserData, VehicleClass, Lang } from "../types";
import { DEFAULT_USER_DATA } from "../types";
import { newCard, qualityFromAnswer, updateSRS } from "./srs";

const STORAGE_KEY = "dmvprep.fl.userdata.v2";
const LEGACY_KEY = "dmvprep.fl.userdata.v1";

function load(): UserData {
  if (typeof window === "undefined") return DEFAULT_USER_DATA;
  try {
    const raw =
      window.localStorage.getItem(STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_KEY);
    if (!raw) return DEFAULT_USER_DATA;
    const parsed = JSON.parse(raw) as Partial<UserData>;
    return {
      ...DEFAULT_USER_DATA,
      ...parsed,
      profile: { ...DEFAULT_USER_DATA.profile, ...(parsed.profile ?? {}) },
    };
  } catch {
    return DEFAULT_USER_DATA;
  }
}

function save(data: UserData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  // First v2 write also retires the v1 key so a later manual clear of v2 doesn't
  // resurrect stale legacy state on next load.
  window.localStorage.removeItem(LEGACY_KEY);
}

type Listener = (d: UserData) => void;
const listeners = new Set<Listener>();
let currentData: UserData = load();

function publish(next: UserData) {
  currentData = next;
  save(next);
  for (const l of listeners) l(next);
}

export function useUserData() {
  const [data, setData] = useState<UserData>(currentData);
  useEffect(() => {
    listeners.add(setData);
    return () => {
      listeners.delete(setData);
    };
  }, []);

  const recordAttempt = useCallback(
    (questionId: string, correct: boolean, timeSpentSeconds: number) => {
      const attempt: Attempt = {
        questionId,
        correct,
        timeSpentSeconds,
        timestamp: Date.now(),
      };
      const existing = currentData.srsCards[questionId] ?? newCard(questionId);
      const updated = updateSRS(existing, qualityFromAnswer(correct));
      publish({
        ...currentData,
        attempts: [...currentData.attempts, attempt],
        srsCards: { ...currentData.srsCards, [questionId]: updated },
        xp: currentData.xp + (correct ? 10 : 2),
      });
    },
    [],
  );

  const toggleBookmark = useCallback((questionId: string) => {
    const has = currentData.bookmarks.includes(questionId);
    const next = has
      ? currentData.bookmarks.filter((id) => id !== questionId)
      : [...currentData.bookmarks, questionId];
    publish({ ...currentData, bookmarks: next });
  }, []);

  const recordMockResult = useCallback((result: MockTestResult) => {
    const xpBonus = result.passed ? 100 : 25;
    publish({
      ...currentData,
      xp: currentData.xp + xpBonus,
      mockResults: [result, ...currentData.mockResults].slice(0, 50),
    });
  }, []);

  const setLanguage = useCallback((lang: Lang) => {
    publish({
      ...currentData,
      language: lang,
      profile: { ...currentData.profile, language: lang },
    });
  }, []);

  const setVehicleClass = useCallback((vc: VehicleClass) => {
    publish({
      ...currentData,
      profile: { ...currentData.profile, vehicleClass: vc },
    });
  }, []);

  const setProfile = useCallback((p: Profile) => {
    publish({ ...currentData, profile: p, language: p.language });
  }, []);

  const completeLesson = useCallback((lessonId: string, xpReward: number) => {
    if (currentData.lessonsCompleted.includes(lessonId)) {
      // Re-completion still grants a small bonus.
      publish({ ...currentData, xp: currentData.xp + Math.round(xpReward / 4) });
      return;
    }
    publish({
      ...currentData,
      xp: currentData.xp + xpReward,
      lessonsCompleted: [...currentData.lessonsCompleted, lessonId],
    });
  }, []);

  const recordSignRush = useCallback((score: number) => {
    publish({
      ...currentData,
      xp: currentData.xp + score * 5,
      bestSignRush: Math.max(currentData.bestSignRush, score),
    });
  }, []);

  const setPaywallUnlocked = useCallback((unlocked: boolean) => {
    publish({ ...currentData, paywallUnlocked: unlocked });
  }, []);

  const resetAll = useCallback(() => {
    publish({ ...DEFAULT_USER_DATA });
  }, []);

  return {
    data,
    recordAttempt,
    toggleBookmark,
    recordMockResult,
    setLanguage,
    setVehicleClass,
    setProfile,
    completeLesson,
    recordSignRush,
    setPaywallUnlocked,
    resetAll,
  };
}

export function getSRSCard(data: UserData, questionId: string): SRSCard {
  return data.srsCards[questionId] ?? newCard(questionId);
}

/** Level curve: every level needs 100 more XP than the previous (level 1 = 0..100, 2 = 100..300, etc). */
export function levelInfo(xp: number): { level: number; into: number; needed: number; progress: number } {
  let level = 1;
  let needed = 100;
  let into = xp;
  while (into >= needed) {
    into -= needed;
    level += 1;
    needed += 50;
  }
  return { level, into, needed, progress: into / needed };
}
