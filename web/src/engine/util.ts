export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatRelativeDate(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  const day = 24 * 60 * 60 * 1000;
  if (diff < 60_000) return "just now";
  if (diff < 60 * 60_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < day) return `${Math.floor(diff / (60 * 60_000))}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;
  return new Date(ts).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function loc(localized: unknown, lang: string): string {
  if (localized == null) return "";
  if (typeof localized === "string") return localized;
  if (typeof localized === "object") {
    const obj = localized as Record<string, unknown>;
    const pick = obj[lang] ?? obj["en"] ?? Object.values(obj)[0];
    return typeof pick === "string" ? pick : "";
  }
  return "";
}
