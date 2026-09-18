import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BRAND } from "../../brand";
import { canStartSession } from "../../engine/billing/entitlements";
import { calendarDisclaimer, consentRequirement, disclosureScript, PREFLIGHT_REMINDER } from "../../engine/compliance/consent";
import type { SttMode } from "../../engine/store/vault";
import { humanFieldName } from "../../engine/terms";
import { shareText } from "../../native/share";
import { useApp } from "../AppContext";
import { Button, Card, Empty, Screen, StatusTermStatus } from "../components";

const MODES: Array<{ v: SttMode; label: string; hint: string }> = [
  { v: "demo", label: "Demo", hint: "Scripted negotiation. No microphone, no keys, no live hours used." },
  { v: "deepgram", label: "Live — this phone listens", hint: "Phone mic → Deepgram. Speak first so it learns your voice." },
  { v: "companion", label: "Companion — desktop HUD", hint: "Shows cues from the desktop daemon over Wi-Fi." },
];

export function PreflightView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { deals, settings, updateSettings, usage } = useApp();
  const deal = deals.find((d) => d.projectId === id);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<SttMode>(settings.sttMode);
  const [confirmedTerms, setConfirmedTerms] = useState(false);
  const [informed, setInformed] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const req = consentRequirement(settings.jurisdictions);
  const start = canStartSession(usage, new Date());

  if (!deal) return <Screen title="Pre-flight" back="/home"><Empty title="Deal not found" /></Screen>;

  const caps = deal.terms.filter((t) => t.status === "hard_cap" || t.status === "internal_confidential");
  const agreed = deal.terms.filter((t) => t.status === "agreed");
  const modeBlocked = mode === "deepgram" && !settings.deepgramApiKey ? "Add your Deepgram API key in Settings first." : mode === "companion" && !settings.companionHost ? "Set the desktop host in Settings first." : mode !== "demo" && !start.ok ? (start.reason === "trial_expired" ? "Your trial has ended." : "No live hours left this month.") : null;

  const copy = async (label: string, text: string) => {
    await shareText(label, text);
    setCopied(label);
    setTimeout(() => setCopied(null), 1500);
  };

  const go = async () => {
    await updateSettings({ sttMode: mode });
    nav(`/live/${deal.projectId}?mode=${mode}`, { replace: true });
  };

  return (
    <Screen title={`Pre-flight · ${step + 1}/3`} back="/home" testId="preflight">
      <div className="flex gap-1.5 mt-4">
        {[0, 1, 2].map((i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink-100" : "bg-ink-800"}`} />
        ))}
      </div>

      {step === 0 && (
        <>
          <h2 className="text-[24px] font-extrabold mt-6 tracking-tight">Target project</h2>
          <Card className="mt-3">
            <div className="text-[18px] font-bold">{deal.name || "Untitled deal"}</div>
            <div className="text-[13px] text-ink-400 mt-1">
              {deal.terms.length} terms · you are the {deal.side} · {deal.counterparties.length} counterpart{deal.counterparties.length === 1 ? "y" : "ies"}
            </div>
          </Card>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400 mt-7 mb-2.5">How {BRAND.name} listens</h3>
          <div className="space-y-2">
            {MODES.map((m) => (
              <button key={m.v} onClick={() => setMode(m.v)} className={`w-full text-left rounded-2xl border p-4 ${mode === m.v ? "border-ink-100 bg-ink-900" : "border-ink-800 bg-ink-900/50"}`} data-testid={`mode-${m.v}`}>
                <div className="flex items-center gap-3">
                  <span className={`w-5 h-5 rounded-full border-2 ${mode === m.v ? "border-ink-100 bg-ink-100" : "border-ink-500"}`} />
                  <span className="text-[15px] font-semibold">{m.label}</span>
                </div>
                <div className="text-[13px] text-ink-400 mt-1.5 ml-8 leading-snug">{m.hint}</div>
              </button>
            ))}
          </div>
          {modeBlocked && (
            <p className="text-[13px] text-flag mt-3">
              {modeBlocked}{" "}
              <button className="underline" onClick={() => nav(modeBlocked.includes("hours") || modeBlocked.includes("trial") ? "/paywall" : "/settings")}>
                Open
              </button>
            </p>
          )}
        </>
      )}

      {step === 1 && (
        <>
          <h2 className="text-[24px] font-extrabold mt-6 tracking-tight">Key parameters</h2>
          <p className="text-ink-300 mt-1.5 leading-snug">Confirm these are current as of today. The engine treats them as ground truth.</p>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400 mt-6 mb-2">Walk-aways & confidential</h3>
          {!caps.length && <p className="text-[13px] text-ink-400">None set. Consider adding a walk-away price or minimum contingency window.</p>}
          <div className="space-y-2">
            {caps.map((t) => (
              <Card key={t.termId}>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[13px] text-ink-400">{humanFieldName(t)}</div>
                    <div className="text-[18px] font-extrabold">{t.fieldValue}</div>
                  </div>
                  <StatusTermStatus status={t.status} />
                </div>
              </Card>
            ))}
          </div>
          <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400 mt-6 mb-2">Agreed on the record</h3>
          <div className="space-y-2">
            {agreed.map((t) => (
              <Card key={t.termId}>
                <div className="text-[13px] text-ink-400">{humanFieldName(t)}</div>
                <div className="text-[18px] font-extrabold">{t.fieldValue}</div>
                <div className="text-[12px] text-ink-400 mt-0.5">
                  {t.sourceDoc} · {t.sourceDate}
                </div>
              </Card>
            ))}
          </div>
          <button type="button" onClick={() => setConfirmedTerms(!confirmedTerms)} className="mt-6 w-full flex items-start gap-3 text-left" data-testid="pf-confirm-terms">
            <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center ${confirmedTerms ? "bg-ink-100 border-ink-100 text-ink-950" : "border-ink-500"}`}>{confirmedTerms && "✓"}</span>
            <span className="text-[14px] leading-snug">These terms match the latest documents. <button className="text-link underline" onClick={(e) => { e.stopPropagation(); nav(`/deal/${deal.projectId}`); }}>Edit</button></span>
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-[24px] font-extrabold mt-6 tracking-tight">Counterparty & consent</h2>
          <div className="space-y-2 mt-3">
            {deal.counterparties.map((c, i) => (
              <Card key={i}>
                <div className="text-[15px] font-semibold">
                  {c.name} <span className="text-ink-400 font-normal">· {c.role}</span>
                </div>
                {c.notes && <div className="text-[13px] text-ink-300 mt-1 leading-snug">{c.notes}</div>}
              </Card>
            ))}
            {!deal.counterparties.length && <p className="text-[13px] text-ink-400">No dossier yet — add names and past concessions in the deal editor.</p>}
          </div>

          <div className={`mt-6 rounded-2xl p-4 border ${req.allParty ? "border-flag/40 bg-flag/10" : "border-ink-700 bg-ink-900"}`}>
            <div className="text-[13px] font-semibold uppercase tracking-wider text-ink-300">{req.allParty ? "All-party consent required" : "Disclosure recommended"}</div>
            <p className="text-[14px] mt-1.5 leading-snug">{PREFLIGHT_REMINDER}</p>
            {req.jurisdictions.length > 0 && <p className="text-[12px] text-ink-300 mt-2">{req.jurisdictions.map((j) => `${j.name}${j.statute ? ` — ${j.statute}` : ""}`).join(" · ")}</p>}
          </div>

          <Card className="mt-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">Read aloud at the start</div>
            <p className="text-[15px] mt-1.5 leading-snug">“{disclosureScript(BRAND.name)}”</p>
            <div className="flex gap-2 mt-3">
              <Button variant="subtle" className="h-10 text-[13px]" onClick={() => copy("Disclosure", disclosureScript(BRAND.name))}>
                {copied === "Disclosure" ? "Copied" : "Copy script"}
              </Button>
              <Button variant="subtle" className="h-10 text-[13px]" onClick={() => copy("Invite note", calendarDisclaimer(BRAND.name))}>
                {copied === "Invite note" ? "Copied" : "Copy invite note"}
              </Button>
            </div>
          </Card>

          <button type="button" onClick={() => setInformed(!informed)} className="mt-6 w-full flex items-start gap-3 text-left" data-testid="pf-informed">
            <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center ${informed ? "bg-ink-100 border-ink-100 text-ink-950" : "border-ink-500"}`}>{informed && "✓"}</span>
            <span className="text-[14px] leading-snug">All participants have been informed that an AI deal assistant is running{mode === "demo" ? " (not required for the demo)" : ""}.</span>
          </button>
          {mode === "deepgram" && <p className="text-[13px] text-ink-400 mt-4 leading-snug">On start, the phone asks for microphone access. Speak first — a simple “hello, everyone” — so the first voice is mapped to you.</p>}
        </>
      )}

      <div className="sticky bottom-0 py-4 bg-ink-950 safe-bottom flex gap-3 mt-8">
        {step > 0 && (
          <Button variant="ghost" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        {step < 2 ? (
          <Button full disabled={(step === 0 && !!modeBlocked) || (step === 1 && !confirmedTerms)} onClick={() => setStep(step + 1)} data-testid="pf-next">
            Continue
          </Button>
        ) : (
          <Button full variant="flag" disabled={!!modeBlocked || (req.allParty && mode !== "demo" && !informed)} onClick={go} data-testid="pf-start">
            {mode === "demo" ? "Start demo call" : "Start listening"}
          </Button>
        )}
      </div>
    </Screen>
  );
}
