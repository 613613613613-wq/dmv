import { useEffect, useState, useCallback } from "react";
import type { Attempt, MockTestResult, SRSCard, UserData } from "../types";
import { DEFAULT_USER_DATA } from "../types";
import { newCard, qualityFromAnswer, updateSRS } from "./srs";

const STORAGE_KEY = "dmvprep.fl.userdata.v1";

function load(): UserData {
  if (typeof window === "undefined") return DEFAULT_USER_DATA;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_USER_DATA;
    const parsed = JSON.parse(raw) as Partial<UserData>;
    return { ...DEFAULT_USER_DATA, ...parsed };
  } catch {
    return DEFAULT_USER_DATA;
  }
}

function save(data: UserData) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    publish({ ...currentData, mockResults: [result, ...currentData.mockResults].slice(0, 50) });
  }, []);

  const setLanguage = useCallback((lang: string) => {
    publish({ ...currentData, language: lang });
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
    setPaywallUnlocked,
    resetAll,
  };
}

export function getSRSCard(data: UserData, questionId: string): SRSCard {
  return data.srsCards[questionId] ?? newCard(questionId);
}
