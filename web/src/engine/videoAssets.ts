import videoManifest from "../data/video-manifest.json";

const generatedVideos = new Set<string>(videoManifest.videos);

const sceneToFilename = (s: string) => s.replace(/[:/\\]/g, "-") + ".mp4";

export function hasGeneratedVideo(scene: string): boolean {
  return generatedVideos.has(scene);
}

export function sceneVideoUrl(scene: string): string {
  return `/videos/${sceneToFilename(scene)}`;
}
