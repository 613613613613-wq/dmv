import manifest from "../data/narration-manifest.json";

type Clips = Record<string, { hash: string; lang: string }>;
const clips = (manifest.clips ?? {}) as Clips;

export function narrationKey(lessonId: string, stepIdx: number, lang: "en" | "es") {
  return `${lessonId}__step${stepIdx}__${lang}`;
}

export function hasNarration(lessonId: string, stepIdx: number, lang: "en" | "es") {
  return Object.prototype.hasOwnProperty.call(clips, narrationKey(lessonId, stepIdx, lang));
}

export function narrationUrl(lessonId: string, stepIdx: number, lang: "en" | "es") {
  return `/narration/${narrationKey(lessonId, stepIdx, lang)}.wav`;
}
