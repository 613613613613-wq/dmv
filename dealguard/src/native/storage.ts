import { Preferences } from "@capacitor/preferences";
import { SecureStoragePlugin } from "capacitor-secure-storage-plugin";
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

/**
 * iOS Keychain (kSecAttrAccessibleWhenUnlockedThisDeviceOnly) / Android Keystore-encrypted
 * SharedPreferences for the user's API keys — excluded from device backups.
 */
export class SecureStorage implements StorageAdapter {
  async get(key: string) {
    try {
      return (await SecureStoragePlugin.get({ key })).value ?? null;
    } catch {
      return null; // plugin rejects when the key does not exist
    }
  }
  async set(key: string, value: string) {
    await SecureStoragePlugin.set({ key, value });
  }
  async remove(key: string) {
    try {
      await SecureStoragePlugin.remove({ key });
    } catch {
      /* missing key */
    }
  }
  async keys() {
    return (await SecureStoragePlugin.keys()).value;
  }
}

export function makeSecretStorage(fallback: StorageAdapter): StorageAdapter {
  return isNative() ? new SecureStorage() : fallback;
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
