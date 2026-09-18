import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { formatValue, parseTermValue } from "../../engine/normalize";
import { FIELD_ALIASES, humanFieldName } from "../../engine/terms";
import { newId } from "../../engine/store/vault";
import type { Boundary, Counterparty, Deal, DealTerm, TermCategory, TermStatus, TermUnit } from "../../engine/types";
import { useApp } from "../AppContext";
import { Button, Card, Empty, Field, Input, Pill, Screen, SectionTitle, Select, StatusTermStatus, Textarea, Toggle } from "../components";

const CATEGORIES: TermCategory[] = ["financial", "contingency", "closing", "entity", "other"];
const UNITS: TermUnit[] = ["USD", "days", "percent", "ratio", "count", "text"];
const STATUSES: Array<{ v: TermStatus; label: string; hint: string }> = [
  { v: "hard_cap", label: "Hard cap (walk-away)", hint: "Crossing it is a red flag, for them or for you." },
  { v: "agreed", label: "Agreed on the record", hint: "A different recollection is a red flag." },
  { v: "negotiable", label: "Negotiable target", hint: "A worse counter shows a fact card." },
  { v: "internal_confidential", label: "Internal — confidential", hint: "You get a warning if you start saying it." },
];
const BOUNDARIES: Array<{ v: Boundary; label: string }> = [
  { v: "max", label: "Maximum — higher breaches" },
  { v: "min", label: "Minimum — lower breaches" },
  { v: "exact", label: "Exact — any change breaches" },
];

/**
 * Which direction breaches a cap, given who we are. A buyer's price cap is a
 * maximum; a seller's is a minimum. Time windows we need are minimums; a closing
 * deadline we are held to is a maximum for either side.
 */
export function defaultBoundary(side: Deal["side"], fieldName: string, unit: TermUnit): Boundary {
  const weAreBuyerLike = side === "buyer" || side === "borrower";
  if (unit === "USD") {
    if (/deposit|earnest|credit|holdback|fee/.test(fieldName)) return weAreBuyerLike ? "max" : "min";
    return weAreBuyerLike ? "max" : "min";
  }
  if (unit === "days") return /closing_date|expiry|deadline/.test(fieldName) ? (weAreBuyerLike ? "min" : "max") : weAreBuyerLike ? "min" : "max";
  if (unit === "percent") return /cap_rate|ltv/.test(fieldName) ? (weAreBuyerLike ? "min" : "max") : weAreBuyerLike ? "max" : "min";
  if (unit === "ratio") return "min";
  return "exact";
}

function blankTerm(projectId: string): DealTerm {
  return {
    termId: newId("term"),
    projectId,
    category: "financial",
    fieldName: "purchase_price",
    fieldValue: "",
    unit: "USD",
    status: "agreed",
    boundary: "exact",
    sourceDoc: "",
    sourceDate: new Date().toISOString().slice(0, 10),
    allowCounterpartyDisclosure: false,
    aliases: [],
  };
}

export function DealEditorView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { deals, saveDeal, deleteDeal } = useApp();
  const existing = deals.find((d) => d.projectId === id);
  const [deal, setDeal] = useState<Deal | null>(existing ?? null);
  const [editing, setEditing] = useState<DealTerm | null>(null);
  const [cpEditing, setCpEditing] = useState<{ index: number; cp: Counterparty } | null>(null);

  useEffect(() => {
    if (existing && !deal) setDeal(existing);
  }, [existing, deal]);

  if (!deal) return <Screen title="Deal" back="/home"><Empty title="Deal not found" /></Screen>;

  const patch = (p: Partial<Deal>) => setDeal({ ...deal, ...p });
  const persist = async (next: Deal = deal) => {
    setDeal(next);
    await saveDeal(next);
  };

  const parsedValue = editing && editing.unit !== "text" ? parseTermValue(editing.fieldValue, editing.unit) : null;
  const termValid = !!editing && !!editing.fieldValue.trim() && !!editing.sourceDoc.trim() && !!editing.fieldName && (editing.unit === "text" || parsedValue !== null);

  const saveTerm = async () => {
    if (!editing || !termValid) return;
    const terms = deal.terms.some((t) => t.termId === editing.termId) ? deal.terms.map((t) => (t.termId === editing.termId ? editing : t)) : [...deal.terms, editing];
    await persist({ ...deal, terms });
    setEditing(null);
  };

  const removeTerm = async (termId: string) => persist({ ...deal, terms: deal.terms.filter((t) => t.termId !== termId) });

  return (
    <Screen
      title={deal.name || "New deal"}
      back="/home"
      testId="deal-editor"
      right={
        <Button variant="subtle" className="h-9 px-3 text-[13px]" onClick={() => persist().then(() => nav("/home"))} data-testid="deal-save">
          Done
        </Button>
      }
    >
      <Field label="Deal name" className="mt-4">
        <Input value={deal.name} onChange={(e) => patch({ name: e.target.value })} onBlur={() => persist()} placeholder="e.g. Harbor Point Industrial" data-testid="deal-name" />
      </Field>
      <Field label="Your side" className="mt-4" hint="Sets sensible boundary defaults when you add terms.">
        <Select value={deal.side} onChange={(e) => persist({ ...deal, side: e.target.value as Deal["side"] })}>
          {(["buyer", "seller", "lender", "borrower", "other"] as const).map((s) => (
            <option key={s} value={s}>
              {s[0].toUpperCase() + s.slice(1)}
            </option>
          ))}
        </Select>
      </Field>

      <SectionTitle
        right={
          <button className="text-[13px] font-semibold text-link" onClick={() => setEditing(blankTerm(deal.projectId))} data-testid="add-term">
            + Add term
          </button>
        }
      >
        Ground-truth terms ({deal.terms.length})
      </SectionTitle>
      {!deal.terms.length && <Empty title="No terms yet" body="Every red flag and fact card is anchored to a term you enter here — price, deposit, contingency days, closing, cap rate, DSCR…" />}
      <div className="space-y-2">
        {deal.terms.map((t) => (
          <Card key={t.termId} onClick={() => setEditing({ ...t })} testId={`term-${t.fieldName}`}>
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold">{humanFieldName(t)}</div>
                <div className="text-[20px] font-extrabold mt-0.5 break-words">{t.fieldValue}</div>
                <div className="text-[12px] text-ink-400 mt-1 truncate">
                  {t.sourceDoc} · {t.sourceDate}
                  {t.status === "hard_cap" && ` · ${t.boundary}`}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                <StatusTermStatus status={t.status} />
                {t.allowCounterpartyDisclosure && <Pill>shareable</Pill>}
              </div>
            </div>
          </Card>
        ))}
      </div>

      <SectionTitle
        right={
          <button className="text-[13px] font-semibold text-link" onClick={() => setCpEditing({ index: -1, cp: { name: "", role: "", notes: "" } })}>
            + Add person
          </button>
        }
      >
        Counterparty dossier
      </SectionTitle>
      {!deal.counterparties.length && <p className="text-[13px] text-ink-400">Names, roles and past concessions. Names are also fed to speech recognition as keywords.</p>}
      <div className="space-y-2">
        {deal.counterparties.map((c, i) => (
          <Card key={i} onClick={() => setCpEditing({ index: i, cp: { ...c } })}>
            <div className="text-[15px] font-semibold">
              {c.name} <span className="text-ink-400 font-normal">· {c.role}</span>
            </div>
            {c.notes && <div className="text-[13px] text-ink-300 mt-1 leading-snug">{c.notes}</div>}
          </Card>
        ))}
      </div>

      <Field label="Extra speech keywords" hint="Comma-separated. Project names, acronyms, people. Improves transcription of jargon." className="mt-7">
        <Input value={deal.keywords.join(", ")} onChange={(e) => patch({ keywords: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} onBlur={() => persist()} placeholder="Harbor Point, T-12, estoppel" />
      </Field>

      <div className="mt-10 flex gap-3">
        <Button variant="ghost" full onClick={() => persist({ ...deal, archived: true }).then(() => nav("/home"))}>
          Archive
        </Button>
        <Button
          variant="danger"
          full
          onClick={() => {
            if (confirm("Delete this deal and all its terms? Memoranda are kept.")) deleteDeal(deal.projectId).then(() => nav("/home"));
          }}
        >
          Delete
        </Button>
      </div>

      {editing && (
        <Sheet title={deal.terms.some((t) => t.termId === editing.termId) ? "Edit term" : "New term"} onClose={() => setEditing(null)}>
          <Field label="Field">
            <Select
              value={Object.keys(FIELD_ALIASES).includes(editing.fieldName) ? editing.fieldName : "__custom"}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "__custom") return setEditing({ ...editing, fieldName: "" });
                const unit: TermUnit = /price|deposit|credit|amount|fee|noi|holdback/.test(v) ? "USD" : /window|contingency|date|extension|expiry/.test(v) ? "days" : /rate|ltv/.test(v) ? "percent" : /dscr/.test(v) ? "ratio" : "text";
                setEditing({ ...editing, fieldName: v, unit, category: unit === "days" ? "contingency" : v === "closing_date" ? "closing" : unit === "text" ? "entity" : "financial" });
              }}
              data-testid="term-field"
            >
              {Object.keys(FIELD_ALIASES).map((k) => (
                <option key={k} value={k}>
                  {k.replace(/_/g, " ")}
                </option>
              ))}
              <option value="__custom">Custom…</option>
            </Select>
          </Field>
          {!Object.keys(FIELD_ALIASES).includes(editing.fieldName) && (
            <Field label="Custom field name" className="mt-3" hint="snake_case, e.g. parking_ratio">
              <Input value={editing.fieldName} onChange={(e) => setEditing({ ...editing, fieldName: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "_") })} />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Value">
              <Input value={editing.fieldValue} onChange={(e) => setEditing({ ...editing, fieldValue: e.target.value })} placeholder={editing.unit === "USD" ? "$14,250,000" : editing.unit === "days" ? "21 calendar days" : editing.unit === "percent" ? "6.25%" : editing.unit === "ratio" ? "1.25x" : "…"} data-testid="term-value" />
            </Field>
            <Field label="Unit">
              <Select value={editing.unit} onChange={(e) => setEditing({ ...editing, unit: e.target.value as TermUnit })}>
                {UNITS.map((u) => (
                  <option key={u}>{u}</option>
                ))}
              </Select>
            </Field>
          </div>
          {editing.unit !== "text" && editing.fieldValue.trim() && (
            <p className={`text-[12px] mt-1.5 ${parsedValue === null ? "text-flag" : "text-ink-400"}`} data-testid="term-parsed">
              {parsedValue === null ? `Could not read a ${editing.unit} figure — e.g. ${editing.unit === "USD" ? "$14,250,000" : editing.unit === "days" ? "21 days" : editing.unit === "percent" ? "6.25%" : "1.25x"}` : `Reads as ${formatValue(parsedValue, editing.unit)}`}
            </p>
          )}
          <Field label="Status" className="mt-3" hint={STATUSES.find((s) => s.v === editing.status)?.hint}>
            <Select
              value={editing.status}
              onChange={(e) => {
                const status = e.target.value as TermStatus;
                const boundary = status === "hard_cap" || status === "negotiable" ? defaultBoundary(deal.side, editing.fieldName, editing.unit) : editing.boundary;
                setEditing({ ...editing, status, boundary });
              }}
              data-testid="term-status"
            >
              {STATUSES.map((s) => (
                <option key={s.v} value={s.v}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
          {editing.unit !== "text" && (
            <Field label="Boundary" className="mt-3">
              <Select value={editing.boundary} onChange={(e) => setEditing({ ...editing, boundary: e.target.value as Boundary })}>
                {BOUNDARIES.map((b) => (
                  <option key={b.v} value={b.v}>
                    {b.label}
                  </option>
                ))}
              </Select>
            </Field>
          )}
          <Field label="Category" className="mt-3">
            <Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value as TermCategory })}>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Source document">
              <Input value={editing.sourceDoc} onChange={(e) => setEditing({ ...editing, sourceDoc: e.target.value })} placeholder="PSA_Draft_v3.pdf" data-testid="term-source" />
            </Field>
            <Field label="Source date">
              <Input type="date" value={editing.sourceDate} onChange={(e) => setEditing({ ...editing, sourceDate: e.target.value })} />
            </Field>
          </div>
          <Field label="Spoken aliases" className="mt-3" hint="Comma-separated extra ways people say this term.">
            <Input value={editing.aliases.join(", ")} onChange={(e) => setEditing({ ...editing, aliases: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })} placeholder="the number, headline" />
          </Field>
          <Field label="Note" className="mt-3">
            <Textarea value={editing.note ?? ""} onChange={(e) => setEditing({ ...editing, note: e.target.value })} placeholder="Context for you — shown nowhere else." />
          </Field>
          <Toggle checked={editing.allowCounterpartyDisclosure} onChange={(v) => setEditing({ ...editing, allowCounterpartyDisclosure: v })} label="Safe to disclose to the counterparty" hint="Off: fact cards remind you it is internal when they ask." />
          <div className="flex gap-3 mt-4">
            {deal.terms.some((t) => t.termId === editing.termId) && (
              <Button variant="danger" onClick={() => removeTerm(editing.termId).then(() => setEditing(null))}>
                Delete
              </Button>
            )}
            <Button full onClick={saveTerm} disabled={!termValid} data-testid="term-save">
              Save term
            </Button>
          </div>
        </Sheet>
      )}

      {cpEditing && (
        <Sheet title={cpEditing.index < 0 ? "Add person" : "Edit person"} onClose={() => setCpEditing(null)}>
          <Field label="Name">
            <Input value={cpEditing.cp.name} onChange={(e) => setCpEditing({ ...cpEditing, cp: { ...cpEditing.cp, name: e.target.value } })} autoCapitalize="words" />
          </Field>
          <Field label="Role" className="mt-3">
            <Input value={cpEditing.cp.role} onChange={(e) => setCpEditing({ ...cpEditing, cp: { ...cpEditing.cp, role: e.target.value } })} placeholder="Seller's broker" />
          </Field>
          <Field label="Notes & past concessions" className="mt-3">
            <Textarea value={cpEditing.cp.notes} onChange={(e) => setCpEditing({ ...cpEditing, cp: { ...cpEditing.cp, notes: e.target.value } })} />
          </Field>
          <div className="flex gap-3 mt-4">
            {cpEditing.index >= 0 && (
              <Button variant="danger" onClick={() => persist({ ...deal, counterparties: deal.counterparties.filter((_, i) => i !== cpEditing.index) }).then(() => setCpEditing(null))}>
                Remove
              </Button>
            )}
            <Button
              full
              disabled={!cpEditing.cp.name.trim()}
              onClick={() => {
                const cps = cpEditing.index < 0 ? [...deal.counterparties, cpEditing.cp] : deal.counterparties.map((c, i) => (i === cpEditing.index ? cpEditing.cp : c));
                persist({ ...deal, counterparties: cps }).then(() => setCpEditing(null));
              }}
            >
              Save
            </Button>
          </div>
        </Sheet>
      )}
    </Screen>
  );
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <button aria-label="Close" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative bg-ink-900 border-t border-ink-700 rounded-t-3xl max-h-[92%] overflow-y-auto px-4 pt-3 pb-6 safe-bottom">
        <div className="w-10 h-1 rounded-full bg-ink-600 mx-auto mb-3" />
        <div className="text-[17px] font-bold mb-4">{title}</div>
        {children}
      </div>
    </div>
  );
}
