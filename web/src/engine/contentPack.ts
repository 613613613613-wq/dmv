import { useEffect, useState } from "react";
import type { ContentPack } from "../types";

export function useContentPack(url = "/content/florida.json") {
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(url)
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
  }, [url]);

  return { pack, error };
}

export function categoryName(pack: ContentPack, id: string): string {
  return pack.categories.find((c) => c.id === id)?.name ?? id;
}
