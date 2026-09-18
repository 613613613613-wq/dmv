import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { App as CapApp } from "@capacitor/app";
import { applyEntitlements, initialUsage, rollover, type UsageState } from "../engine/billing/entitlements";
import type { PurchaseProvider } from "../engine/billing/provider";
import { DEFAULT_SETTINGS, Vault, type AppSettings, type SessionRecord } from "../engine/store/vault";
import type { Deal } from "../engine/types";
import { makePurchaseProvider } from "../native/purchases";
import { makeSecretStorage, makeStorage } from "../native/storage";

export interface AppApi {
  ready: boolean;
  settings: AppSettings;
  deals: Deal[];
  usage: UsageState;
  sessions: SessionRecord[];
  purchases: PurchaseProvider;
  updateSettings(patch: Partial<AppSettings>): Promise<void>;
  saveDeal(deal: Deal): Promise<void>;
  deleteDeal(projectId: string): Promise<void>;
  setUsage(u: UsageState): Promise<void>;
  saveSession(rec: SessionRecord): Promise<void>;
  deleteSession(id: string): Promise<void>;
  exportData(): Promise<string>;
  eraseAll(): Promise<void>;
}

const Ctx = createContext<AppApi | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const vaultRef = useRef<Vault>();
  if (!vaultRef.current) {
    const plain = makeStorage();
    vaultRef.current = new Vault(plain, makeSecretStorage(plain));
  }
  const vault = vaultRef.current;
  const purchases = useMemo(() => makePurchaseProvider(), []);

  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [usage, setUsageState] = useState<UsageState>(() => initialUsage(new Date()));
  const [sessions, setSessions] = useState<SessionRecord[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [s, d, u, ss] = await Promise.all([vault.loadSettings(), vault.loadDeals(), vault.loadUsage(), vault.loadSessions()]);
      if (cancelled) return;
      const now = new Date();
      const usageNow = rollover(u ?? initialUsage(now), now);
      if (!u) await vault.saveUsage(usageNow);
      setSettings(s);
      setDeals(d);
      setUsageState(usageNow);
      setSessions(ss);
      setReady(true);
    })().catch(() => setReady(true));
    return () => {
      cancelled = true;
    };
  }, [vault]);

  // Subscriptions: re-sync with the store on launch, on resume, and whenever the
  // store pushes an update (renewal, refund, cancellation). Packs stay local.
  const usageRef = useRef(usage);
  usageRef.current = usage;
  useEffect(() => {
    if (!ready || !purchases.available()) return;
    let cancelled = false;
    const apply = (snap: { entitlements: string[]; expiresAt: string | null }) => {
      if (cancelled) return;
      const next = applyEntitlements(usageRef.current, snap, new Date());
      if (JSON.stringify(next) !== JSON.stringify(usageRef.current)) {
        setUsageState(next);
        void vault.saveUsage(next);
      }
    };
    const sync = () => purchases.currentEntitlements().then((snap) => snap && apply(snap)).catch(() => undefined);
    void sync();
    const unsubscribe = purchases.onEntitlementsChanged(apply);
    const resume = CapApp.addListener("appStateChange", ({ isActive }) => {
      if (isActive) void sync();
    });
    return () => {
      cancelled = true;
      unsubscribe();
      void resume.then((h) => h.remove()).catch(() => undefined);
    };
  }, [ready, purchases, vault]);

  const updateSettings = useCallback(
    async (patch: Partial<AppSettings>) => {
      const next = { ...settings, ...patch, schemaVersion: 1 as const };
      setSettings(next);
      await vault.saveSettings(next);
    },
    [settings, vault],
  );

  const saveDeal = useCallback(async (deal: Deal) => setDeals(await vault.saveDeal(deal)), [vault]);
  const deleteDeal = useCallback(async (id: string) => setDeals(await vault.deleteDeal(id)), [vault]);
  const setUsage = useCallback(
    async (u: UsageState) => {
      setUsageState(u);
      await vault.saveUsage(u);
    },
    [vault],
  );
  const saveSession = useCallback(async (rec: SessionRecord) => setSessions(await vault.saveSession(rec)), [vault]);
  const deleteSession = useCallback(async (id: string) => setSessions(await vault.deleteSession(id)), [vault]);
  const exportData = useCallback(() => vault.exportAll(), [vault]);
  const eraseAll = useCallback(async () => {
    await vault.eraseAll();
    const now = new Date();
    setSettings(DEFAULT_SETTINGS);
    setDeals([]);
    setSessions([]);
    const u = initialUsage(now);
    setUsageState(u);
    await vault.saveUsage(u);
  }, [vault]);

  const api = useMemo<AppApi>(
    () => ({ ready, settings, deals, usage, sessions, purchases, updateSettings, saveDeal, deleteDeal, setUsage, saveSession, deleteSession, exportData, eraseAll }),
    [ready, settings, deals, usage, sessions, purchases, updateSettings, saveDeal, deleteDeal, setUsage, saveSession, deleteSession, exportData, eraseAll],
  );

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useApp(): AppApi {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp outside AppProvider");
  return v;
}
