import type { Deal, LedgerEntry } from "../types";
import type { UsageState } from "../billing/entitlements";
import type { LlmProvider } from "../advisor/llm";
import type { Conversation } from "../coach/types";

/**
 * Persistence. The engine only knows a tiny key/value adapter; the app wires
 * Capacitor Preferences on device (stored inside the app sandbox, protected
 * by iOS Data Protection / Android app-private storage and full-disk
 * encryption) and localStorage on the web.
 *
 * Zero-persistence rule: audio and raw transcript are never written here.
 * Only structured deal terms, the ledger, and the post-meeting memorandum.
 */

export interface StorageAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export class MemoryStorage implements StorageAdapter {
  private m = new Map<string, string>();
  async get(k: string) {
    return this.m.get(k) ?? null;
  }
  async set(k: string, v: string) {
    this.m.set(k, v);
  }
  async remove(k: string) {
    this.m.delete(k);
  }
  async keys() {
    return [...this.m.keys()];
  }
}

export class WebStorage implements StorageAdapter {
  constructor(private readonly ls: Storage) {}
  async get(k: string) {
    return this.ls.getItem(k);
  }
  async set(k: string, v: string) {
    this.ls.setItem(k, v);
  }
  async remove(k: string) {
    this.ls.removeItem(k);
  }
  async keys() {
    const out: string[] = [];
    for (let i = 0; i < this.ls.length; i++) {
      const k = this.ls.key(i);
      if (k) out.push(k);
    }
    return out;
  }
}

export type SttMode = "demo" | "deepgram" | "companion";

export interface AppSettings {
  schemaVersion: 1;
  onboardingDone: boolean;
  userName: string;
  /** Jurisdictions any participant may be in. */
  jurisdictions: string[];
  consentAcknowledgedAt: string | null;
  sttMode: SttMode;
  deepgramApiKey: string;
  llmProvider: LlmProvider;
  llmApiKey: string;
  companionHost: string;
  companionPort: number;
  companionToken: string;
  hapticsEnabled: boolean;
  keepAwake: boolean;
  /** Auto-clear durations, ms. */
  tier1TtlMs: number;
  tier2TtlMs: number;
  /** Speculative retrieval on interim transcripts. */
  speculative: boolean;
}

export const DEFAULT_SETTINGS: AppSettings = {
  schemaVersion: 1,
  onboardingDone: false,
  userName: "",
  jurisdictions: [],
  consentAcknowledgedAt: null,
  sttMode: "demo",
  deepgramApiKey: "",
  llmProvider: "none",
  llmApiKey: "",
  companionHost: "",
  companionPort: 8765,
  companionToken: "",
  hapticsEnabled: true,
  keepAwake: true,
  tier1TtlMs: 20_000,
  tier2TtlMs: 8_000,
  speculative: true,
};

export interface SessionRecord {
  id: string;
  projectId: string;
  dealName: string;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  memorandumMarkdown: string;
  ledger: LedgerEntry[];
  stats: { redFlags: number; factCards: number; medianLatencyMs: number | null; unsolicitedCues: number };
}

const K = {
  secretPrefix: "dealguard.v1.secret.",
  settings: "dealguard.v1.settings",
  deals: "dealguard.v1.deals",
  conversations: "dealguard.v1.conversations",
  usage: "dealguard.v1.usage",
  sessions: "dealguard.v1.sessions",
} as const;

/** Settings fields that hold credentials. Kept in the platform's secure store, never in Preferences. */
export const SECRET_SETTINGS = ["deepgramApiKey", "llmApiKey", "companionToken"] as const;
type SecretKey = (typeof SECRET_SETTINGS)[number];

export class Vault {
  /**
   * @param storage  ordinary app-sandbox key/value store (Preferences / localStorage)
   * @param secrets  Keychain / Android Keystore-backed store for API keys; defaults to `storage`
   */
  constructor(
    private readonly storage: StorageAdapter,
    private readonly secrets: StorageAdapter = storage,
  ) {}

  private async read<T>(key: string, fallback: T): Promise<T> {
    const raw = await this.storage.get(key);
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }

  private async write(key: string, value: unknown): Promise<void> {
    await this.storage.set(key, JSON.stringify(value));
  }

  async loadSettings(): Promise<AppSettings> {
    const s = await this.read<Partial<AppSettings>>(K.settings, {});
    const merged: AppSettings = { ...DEFAULT_SETTINGS, ...s, schemaVersion: 1 };
    for (const k of SECRET_SETTINGS) {
      const v = await this.secrets.get(`${K.secretPrefix}${k}`).catch(() => null);
      merged[k] = v ?? "";
    }
    return merged;
  }
  async saveSettings(s: AppSettings): Promise<void> {
    const plain: Record<string, unknown> = { ...s };
    for (const k of SECRET_SETTINGS) {
      const v = s[k as SecretKey];
      plain[k] = ""; // never persisted alongside ordinary settings
      if (v) await this.secrets.set(`${K.secretPrefix}${k}`, v);
      else await this.secrets.remove(`${K.secretPrefix}${k}`).catch(() => undefined);
    }
    await this.write(K.settings, plain);
  }

  async loadDeals(): Promise<Deal[]> {
    return this.read<Deal[]>(K.deals, []);
  }
  async saveDeal(deal: Deal): Promise<Deal[]> {
    const deals = await this.loadDeals();
    const i = deals.findIndex((d) => d.projectId === deal.projectId);
    const next = { ...deal, updatedAt: new Date().toISOString() };
    if (i >= 0) deals[i] = next;
    else deals.push(next);
    await this.write(K.deals, deals);
    return deals;
  }
  async deleteDeal(projectId: string): Promise<Deal[]> {
    const deals = (await this.loadDeals()).filter((d) => d.projectId !== projectId);
    await this.write(K.deals, deals);
    return deals;
  }

  async loadConversations(): Promise<Conversation[]> {
    return this.read<Conversation[]>(K.conversations, []);
  }
  async saveConversation(c: Conversation): Promise<Conversation[]> {
    const all = await this.loadConversations();
    const i = all.findIndex((x) => x.id === c.id);
    const next = { ...c, updatedAt: new Date().toISOString() };
    if (i >= 0) all[i] = next;
    else all.unshift(next);
    await this.write(K.conversations, all);
    return all;
  }
  async deleteConversation(id: string): Promise<Conversation[]> {
    const all = (await this.loadConversations()).filter((x) => x.id !== id);
    await this.write(K.conversations, all);
    return all;
  }

  async loadUsage(): Promise<UsageState | null> {
    return this.read<UsageState | null>(K.usage, null);
  }
  async saveUsage(u: UsageState): Promise<void> {
    await this.write(K.usage, u);
  }

  async loadSessions(): Promise<SessionRecord[]> {
    return this.read<SessionRecord[]>(K.sessions, []);
  }
  async saveSession(rec: SessionRecord): Promise<SessionRecord[]> {
    const all = await this.loadSessions();
    const i = all.findIndex((s) => s.id === rec.id);
    if (i >= 0) all[i] = rec;
    else all.unshift(rec);
    const kept = all.slice(0, 200);
    await this.write(K.sessions, kept);
    return kept;
  }
  async deleteSession(id: string): Promise<SessionRecord[]> {
    const all = (await this.loadSessions()).filter((s) => s.id !== id);
    await this.write(K.sessions, all);
    return all;
  }

  /** Wipe everything — Settings → "Delete all data". */
  async eraseAll(): Promise<void> {
    for (const k of [K.settings, K.deals, K.conversations, K.usage, K.sessions]) await this.storage.remove(k);
    for (const k of SECRET_SETTINGS) await this.secrets.remove(`${K.secretPrefix}${k}`).catch(() => undefined);
  }

  /** Export everything the app stores, for the privacy "download my data" flow. */
  async exportAll(): Promise<string> {
    return JSON.stringify(
      { settings: await this.loadSettings(), deals: await this.loadDeals(), conversations: await this.loadConversations(), usage: await this.loadUsage(), sessions: await this.loadSessions() },
      (key, value) => (key === "deepgramApiKey" || key === "llmApiKey" || key === "companionToken" ? "[redacted]" : value),
      2,
    );
  }
}

export function newId(prefix = "id"): string {
  const rnd = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID().slice(0, 8) : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${Date.now().toString(36)}-${rnd}`;
}
