import { useEffect, useState } from "react";
import type { ContentPack, LessonPack, VehicleClass } from "../types";
import { loc } from "./util";

const PACK_URLS: Record<VehicleClass, string> = {
  car: "/content/florida-car.json",
  motorcycle: "/content/florida-motorcycle.json",
  cdl: "/content/florida-cdl.json",
};

const LESSON_URLS: Record<VehicleClass, string> = {
  car: "/content/lessons-car.json",
  motorcycle: "/content/lessons-motorcycle.json",
  cdl: "/content/lessons-cdl.json",
};

// Module-level caches keyed by VehicleClass. Once a pack/lesson set has been
// fetched, every later route navigation gets it synchronously — no more
// "flash of skeleton" between pages just because the component re-mounted.
const packCache: Partial<Record<VehicleClass, ContentPack>> = {};
const packInflight: Partial<Record<VehicleClass, Promise<ContentPack>>> = {};
const lessonCache: Partial<Record<VehicleClass, LessonPack>> = {};
const lessonInflight: Partial<Record<VehicleClass, Promise<LessonPack>>> = {};

function fetchPack(vc: VehicleClass): Promise<ContentPack> {
  const existing = packInflight[vc];
  if (existing) return existing;
  const p = fetch(PACK_URLS[vc])
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<ContentPack>;
    })
    .then((json) => {
      packCache[vc] = json;
      delete packInflight[vc];
      return json;
    })
    .catch((e) => {
      delete packInflight[vc];
      throw e;
    });
  packInflight[vc] = p;
  return p;
}

function fetchLessons(vc: VehicleClass): Promise<LessonPack> {
  const existing = lessonInflight[vc];
  if (existing) return existing;
  const p = fetch(LESSON_URLS[vc])
    .then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<LessonPack>;
    })
    .then((json) => {
      lessonCache[vc] = json;
      delete lessonInflight[vc];
      return json;
    })
    .catch((e) => {
      delete lessonInflight[vc];
      throw e;
    });
  lessonInflight[vc] = p;
  return p;
}

/** Eagerly warm both caches for the active class — call once at app boot. */
export function prefetchClassContent(vc: VehicleClass): void {
  if (!packCache[vc] && !packInflight[vc]) void fetchPack(vc).catch(() => {});
  if (!lessonCache[vc] && !lessonInflight[vc]) void fetchLessons(vc).catch(() => {});
}

export function useContentPack(vehicleClass: VehicleClass | null) {
  // Initialize state *synchronously* from the cache so cached navigations
  // don't render a `null` (skeleton) frame at all.
  const cached = vehicleClass ? packCache[vehicleClass] ?? null : null;
  const [pack, setPack] = useState<ContentPack | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleClass) {
      setPack(null);
      return;
    }
    const hit = packCache[vehicleClass];
    if (hit) {
      setPack(hit);
      setError(null);
      return;
    }
    // Cache miss on a class switch — clear stale prior-class data so the UI
    // doesn't briefly render Car content while Motorcycle is loading.
    setPack(null);
    let cancelled = false;
    setError(null);
    fetchPack(vehicleClass)
      .then((json) => {
        if (!cancelled) setPack(json);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleClass]);

  return { pack, error };
}

export function useLessonPack(vehicleClass: VehicleClass | null) {
  const cached = vehicleClass ? lessonCache[vehicleClass] ?? null : null;
  const [lessons, setLessons] = useState<LessonPack | null>(cached);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleClass) {
      setLessons(null);
      return;
    }
    const hit = lessonCache[vehicleClass];
    if (hit) {
      setLessons(hit);
      setError(null);
      return;
    }
    setLessons(null);
    let cancelled = false;
    setError(null);
    fetchLessons(vehicleClass)
      .then((json) => {
        if (!cancelled) setLessons(json);
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message);
      });
    return () => {
      cancelled = true;
    };
  }, [vehicleClass]);

  return { lessons, error };
}

export function categoryName(
  pack: { categories: { id: string; name: { en: string; es: string } }[] },
  id: string,
  lang: "en" | "es" = "en",
): string {
  const cat = pack.categories.find((c) => c.id === id);
  if (!cat) return id;
  return loc(cat.name, lang) || id;
}
