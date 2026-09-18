import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, MemoryStorage, Vault } from "../src/engine/store/vault";

describe("Vault secrets split", () => {
  it("keeps API keys out of the ordinary settings blob and merges them back on load", async () => {
    const plain = new MemoryStorage();
    const secrets = new MemoryStorage();
    const v = new Vault(plain, secrets);
    await v.saveSettings({ ...DEFAULT_SETTINGS, userName: "Alex", deepgramApiKey: "dg_secret", llmApiKey: "g_secret", companionToken: "tok" });
    const blob = (await plain.get("dealguard.v1.settings")) ?? "";
    expect(blob).not.toContain("dg_secret");
    expect(blob).not.toContain("g_secret");
    expect(blob).not.toContain("tok\"");
    expect(await secrets.get("dealguard.v1.secret.deepgramApiKey")).toBe("dg_secret");
    const loaded = await v.loadSettings();
    expect(loaded.userName).toBe("Alex");
    expect(loaded.deepgramApiKey).toBe("dg_secret");
    expect(loaded.companionToken).toBe("tok");
    // Clearing a key removes it from the secure store.
    await v.saveSettings({ ...loaded, deepgramApiKey: "" });
    expect(await secrets.get("dealguard.v1.secret.deepgramApiKey")).toBeNull();
    // Export redacts, erase wipes both stores.
    await v.saveSettings({ ...loaded });
    expect(await v.exportAll()).not.toContain("dg_secret");
    await v.eraseAll();
    expect(await secrets.keys()).toEqual([]);
    expect((await v.loadSettings()).deepgramApiKey).toBe("");
  });

  it("saveSession caps history at 200 and returns what was stored", async () => {
    const v = new Vault(new MemoryStorage());
    let out: unknown[] = [];
    for (let i = 0; i < 205; i++) {
      out = await v.saveSession({ id: `s${i}`, projectId: "p", dealName: "d", startedAt: "", endedAt: "", durationMs: 0, memorandumMarkdown: "", ledger: [], stats: { redFlags: 0, factCards: 0, medianLatencyMs: null, unsolicitedCues: 0 } });
    }
    expect(out.length).toBe(200);
    expect((await v.loadSessions()).length).toBe(200);
  });
});
