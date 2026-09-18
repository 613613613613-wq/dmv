import { formatValue } from "./normalize";
import { humanFieldName } from "./terms";
import type { Deal, DealTerm, LedgerEntry, TranscriptLine } from "./types";

export interface MemoItem {
  topic: string;
  topicLabel: string;
  speaker: "USER" | "COUNTERPARTY";
  text: string;
  at: string; // mm:ss
  value?: string;
  entryId: number;
}

export interface AuditItem extends MemoItem {
  boundary: string;
  sourceDoc: string;
}

export interface Memorandum {
  dealName: string;
  generatedAt: string;
  durationLabel: string;
  agreedTerms: MemoItem[];
  openIssues: MemoItem[];
  ledgerAudit: AuditItem[];
  stats: {
    userLines: number;
    counterpartyLines: number;
    ledgerEntries: number;
    redFlags: number;
    factCards: number;
  };
}

export function mmss(offsetMs: number): string {
  const s = Math.max(0, Math.floor(offsetMs / 1000));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function label(topic: string, terms: DealTerm[]): string {
  const t = terms.find((x) => x.fieldName === topic);
  return t ? humanFieldName(t) : topic.replace(/_/g, " ");
}

function toItem(e: LedgerEntry, terms: DealTerm[]): MemoItem {
  return {
    topic: e.topic,
    topicLabel: label(e.topic, terms),
    speaker: e.speaker,
    text: e.verbatimText,
    at: mmss(e.offsetMs),
    value: e.value !== undefined && e.unit ? formatValue(e.value, e.unit) : undefined,
    entryId: e.entryId,
  };
}

export interface MemoInput {
  deal: Deal;
  ledger: LedgerEntry[];
  transcript: TranscriptLine[];
  durationMs: number;
  redFlags: number;
  factCards: number;
  now?: Date;
}

export function buildMemorandum(input: MemoInput): Memorandum {
  const { deal, ledger, transcript } = input;
  const terms = deal.terms;

  // Agreed terms: explicit agreement or concession, latest per topic wins.
  const agreedByTopic = new Map<string, LedgerEntry>();
  for (const e of ledger) {
    if (e.assertionType === "AGREEMENT" || e.assertionType === "CONCESSION") agreedByTopic.set(e.topic, e);
  }
  // A later rejection on the same topic reopens it.
  const lastByTopic = new Map<string, LedgerEntry>();
  for (const e of ledger) if (e.assertionType !== "QUESTION") lastByTopic.set(e.topic, e);

  const agreedTerms: MemoItem[] = [];
  const openIssues: MemoItem[] = [];
  for (const [topic, last] of lastByTopic) {
    const agreed = agreedByTopic.get(topic);
    if (agreed && (last.assertionType === "AGREEMENT" || last.assertionType === "CONCESSION")) {
      agreedTerms.push(toItem(agreed, terms));
    } else if (last.assertionType === "REJECTION" || last.assertionType === "OFFER") {
      openIssues.push(toItem(last, terms));
    }
  }

  const caps = new Map(terms.filter((t) => t.status === "hard_cap").map((t) => [t.termId, t]));
  const ledgerAudit: AuditItem[] = ledger
    .filter((e) => e.speaker === "USER" && e.flaggedTermId && caps.has(e.flaggedTermId))
    .map((e) => {
      const t = caps.get(e.flaggedTermId!)!;
      return { ...toItem(e, terms), boundary: `${humanFieldName(t)} ${t.boundary} ${t.fieldValue}`, sourceDoc: t.sourceDoc };
    });

  const sortByEntry = (a: MemoItem, b: MemoItem) => a.entryId - b.entryId;
  agreedTerms.sort(sortByEntry);
  openIssues.sort(sortByEntry);

  return {
    dealName: deal.name,
    generatedAt: (input.now ?? new Date()).toISOString(),
    durationLabel: mmss(input.durationMs),
    agreedTerms,
    openIssues,
    ledgerAudit,
    stats: {
      userLines: transcript.filter((l) => l.speaker === "USER").length,
      counterpartyLines: transcript.filter((l) => l.speaker === "COUNTERPARTY").length,
      ledgerEntries: ledger.length,
      redFlags: input.redFlags,
      factCards: input.factCards,
    },
  };
}

export function memorandumToMarkdown(m: Memorandum): string {
  const lines: string[] = [];
  lines.push(`# Deal Memorandum — ${m.dealName}`);
  lines.push(`Generated ${m.generatedAt.slice(0, 16).replace("T", " ")} · Call length ${m.durationLabel}`);
  lines.push("");
  lines.push("## Agreed terms");
  if (!m.agreedTerms.length) lines.push("_No explicit agreements or concessions were recorded._");
  for (const a of m.agreedTerms) lines.push(`- [${a.at}] **${a.topicLabel}** — ${a.speaker === "USER" ? "You" : "Counterparty"}: “${a.text}”${a.value ? ` (${a.value})` : ""}`);
  lines.push("");
  lines.push("## Open issues");
  if (!m.openIssues.length) lines.push("_Nothing left contested or deferred._");
  for (const o of m.openIssues) lines.push(`- [${o.at}] **${o.topicLabel}** — ${o.speaker === "USER" ? "You" : "Counterparty"}: “${o.text}”${o.value ? ` (${o.value})` : ""}`);
  lines.push("");
  lines.push("## Ledger audit");
  if (!m.ledgerAudit.length) lines.push("_You stayed inside every pre-call boundary._");
  for (const x of m.ledgerAudit) lines.push(`- ⚠️ [${x.at}] **${x.topicLabel}** — you said “${x.text}”; boundary was ${x.boundary} (${x.sourceDoc}).`);
  lines.push("");
  lines.push(`_${m.stats.userLines} of your lines · ${m.stats.counterpartyLines} of theirs · ${m.stats.ledgerEntries} ledger entries · ${m.stats.redFlags} red flags · ${m.stats.factCards} fact cards_`);
  lines.push("");
  lines.push("_Generated automatically from live speech recognition. Verify every entry against your documents before relying on it. This is not legal, financial or investment advice._");
  return lines.join("\n");
}
