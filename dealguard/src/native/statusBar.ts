import { StatusBar, Style } from "@capacitor/status-bar";
import { SplashScreen } from "@capacitor/splash-screen";
import { isNative, platform } from "./platform";

export async function setupChrome(): Promise<void> {
  if (!isNative()) return;
  try {
    await StatusBar.setStyle({ style: Style.Dark });
    if (platform() === "android") await StatusBar.setBackgroundColor({ color: "#07090d" });
  } catch {
    /* ignore */
  }
  try {
    await SplashScreen.hide();
  } catch {
    /* ignore */
  }
}

/** Live HUD: hide the status bar so the black screen is truly black. */
export async function immersive(on: boolean): Promise<void> {
  if (!isNative()) return;
  try {
    if (on) await StatusBar.hide();
    else await StatusBar.show();
  } catch {
    /* ignore */
  }
}
