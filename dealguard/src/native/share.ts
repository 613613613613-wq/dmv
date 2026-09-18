import { Share } from "@capacitor/share";
import { isNative } from "./platform";

export async function shareText(title: string, text: string): Promise<"shared" | "copied" | "failed"> {
  try {
    if (isNative()) {
      await Share.share({ title, text, dialogTitle: title });
      return "shared";
    }
    if (typeof navigator !== "undefined" && navigator.share) {
      await navigator.share({ title, text });
      return "shared";
    }
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    try {
      await navigator.clipboard.writeText(text);
      return "copied";
    } catch {
      return "failed";
    }
  }
}
