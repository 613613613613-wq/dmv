import { Haptics, ImpactStyle, NotificationType } from "@capacitor/haptics";
import { isNative } from "./platform";

export async function hapticTap(): Promise<void> {
  if (!isNative()) return;
  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* no haptics engine */
  }
}

export async function hapticCue(tier: 1 | 2 | 3): Promise<void> {
  if (!isNative()) {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(tier === 1 ? [40, 60, 40] : 20);
    return;
  }
  try {
    if (tier === 1) await Haptics.notification({ type: NotificationType.Warning });
    else if (tier === 2) await Haptics.impact({ style: ImpactStyle.Medium });
    else await Haptics.impact({ style: ImpactStyle.Light });
  } catch {
    /* ignore */
  }
}
