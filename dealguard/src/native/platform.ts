import { Capacitor } from "@capacitor/core";

export type Platform = "ios" | "android" | "web";

export function platform(): Platform {
  const p = Capacitor.getPlatform();
  return p === "ios" || p === "android" ? p : "web";
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}
