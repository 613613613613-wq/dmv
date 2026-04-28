import { useEffect, useState } from "react";
import type { ContentPack, LessonPack, VehicleClass } from "../types";

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

export function useContentPack(vehicleClass: VehicleClass | null) {
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleClass) {
      setPack(null);
      return;
    }
    let cancelled = false;
    setPack(null);
    setError(null);
    fetch(PACK_URLS[vehicleClass])
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setPack(json as ContentPack);
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
  const [lessons, setLessons] = useState<LessonPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!vehicleClass) {
      setLessons(null);
      return;
    }
    let cancelled = false;
    setLessons(null);
    setError(null);
    fetch(LESSON_URLS[vehicleClass])
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setLessons(json as LessonPack);
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

export function categoryName(pack: { categories: { id: string; name: string }[] }, id: string): string {
  return pack.categories.find((c) => c.id === id)?.name ?? id;
}
