import manifest from "../data/lesson-video-manifest.json";

const set = new Set<string>(manifest.videos ?? []);

export function hasLessonVideo(lessonId: string): boolean {
  return set.has(lessonId);
}

export function lessonVideoUrl(lessonId: string): string {
  return `/lesson-videos/${lessonId}.mp4`;
}
