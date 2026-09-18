import type { DealTerm, LedgerEntry, Speaker } from "./types";

export class Ledger {
  private entries: LedgerEntry[] = [];
  private nextId = 1;

  add(entry: Omit<LedgerEntry, "entryId" | "timestamp"> & { timestamp?: string }): LedgerEntry {
    const full: LedgerEntry = {
      ...entry,
      entryId: this.nextId++,
      timestamp: entry.timestamp ?? new Date().toISOString(),
    };
    this.entries.push(full);
    return full;
  }

  all(): readonly LedgerEntry[] {
    return this.entries;
  }

  byTopic(topic: string): LedgerEntry[] {
    return this.entries.filter((e) => e.topic === topic);
  }

  bySpeaker(speaker: Speaker): LedgerEntry[] {
    return this.entries.filter((e) => e.speaker === speaker);
  }

  concessions(): LedgerEntry[] {
    return this.entries.filter((e) => e.assertionType === "CONCESSION" || e.assertionType === "AGREEMENT");
  }

  /** Entries where the user committed past a hard boundary. */
  audit(terms: DealTerm[]): LedgerEntry[] {
    const caps = new Set(terms.filter((t) => t.status === "hard_cap").map((t) => t.termId));
    return this.entries.filter((e) => e.speaker === "USER" && e.flaggedTermId && caps.has(e.flaggedTermId));
  }

  since(offsetMs: number): LedgerEntry[] {
    return this.entries.filter((e) => e.offsetMs >= offsetMs);
  }

  toJSON(): LedgerEntry[] {
    return [...this.entries];
  }

  static fromJSON(entries: LedgerEntry[]): Ledger {
    const l = new Ledger();
    l.entries = [...entries];
    l.nextId = entries.reduce((m, e) => Math.max(m, e.entryId), 0) + 1;
    return l;
  }
}
