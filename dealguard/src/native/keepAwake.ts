import { KeepAwake } from "@capacitor-community/keep-awake";
import { isNative } from "./platform";

let wakeLock: { release(): Promise<void> } | null = null;

export async function keepAwake(on: boolean): Promise<void> {
  if (isNative()) {
    try {
      if (on) await KeepAwake.keepAwake();
      else await KeepAwake.allowSleep();
    } catch {
      /* unsupported */
    }
    return;
  }
  try {
    const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<{ release(): Promise<void> }> } };
    if (on && nav.wakeLock && !wakeLock) wakeLock = await nav.wakeLock.request("screen");
    if (!on && wakeLock) {
      await wakeLock.release();
      wakeLock = null;
    }
  } catch {
    /* ignore */
  }
}
