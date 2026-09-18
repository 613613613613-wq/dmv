import { Preferences } from "@capacitor/preferences";
import { MemoryStorage, WebStorage, type StorageAdapter } from "../engine/store/vault";
import { isNative } from "./platform";

/** App-sandbox key/value store (UserDefaults / SharedPreferences) on device, localStorage on the web. */
export class CapacitorStorage implements StorageAdapter {
  async get(key: string) {
    return (await Preferences.get({ key })).value;
  }
  async set(key: string, value: string) {
    await Preferences.set({ key, value });
  }
  async remove(key: string) {
    await Preferences.remove({ key });
  }
  async keys() {
    return (await Preferences.keys()).keys;
  }
}

export function makeStorage(): StorageAdapter {
  if (isNative()) return new CapacitorStorage();
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.getItem("__probe__");
      return new WebStorage(localStorage);
    }
  } catch {
    /* private mode etc. */
  }
  return new MemoryStorage();
}
