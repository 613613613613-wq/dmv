import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND } from "../../brand";
import { consentRequirement, US_JURISDICTIONS } from "../../engine/compliance/consent";
import { makeDemoDeal } from "../../engine/demoDeal";
import { useApp } from "../AppContext";
import { Button, Field, Input, Screen } from "../components";

export function OnboardingView() {
  const nav = useNavigate();
  const { settings, updateSettings, deals, saveDeal } = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(settings.userName);
  const [juris, setJuris] = useState<string[]>(settings.jurisdictions);
  const [ack, setAck] = useState(false);
  const req = consentRequirement(juris);

  const finish = async () => {
    await updateSettings({ onboardingDone: true, userName: name.trim(), jurisdictions: juris, consentAcknowledgedAt: new Date().toISOString(), sttMode: "demo" });
    if (!deals.length) await saveDeal(makeDemoDeal(new Date()));
    nav("/home", { replace: true });
  };

  return (
    <Screen padded={false} testId="onboarding">
      <div className="min-h-full flex flex-col px-5 safe-top">
        <div className="flex gap-1.5 mt-5">
          {[0, 1, 2].map((i) => (
            <span key={i} className={`h-1 flex-1 rounded-full ${i <= step ? "bg-ink-100" : "bg-ink-800"}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="flex-1 flex flex-col justify-center py-10">
            <div className="w-16 h-16 rounded-2xl bg-flag flex items-center justify-center mb-8">
              <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h1 className="text-[34px] font-extrabold leading-[1.05] tracking-tight">{BRAND.name}</h1>
            <p className="text-[20px] text-ink-300 mt-3 leading-snug">{BRAND.tagline}</p>
            <ul className="mt-8 space-y-3 text-[15px] text-ink-100/90">
              <li className="flex gap-3"><span className="text-flag font-bold">●</span> Red flag the moment someone misstates the record or crosses your walk-away.</li>
              <li className="flex gap-3"><span className="text-fact font-bold">●</span> Fact cards with the source document when a term comes up.</li>
              <li className="flex gap-3"><span className="text-calm font-bold">●</span> A deal memorandum seconds after you hang up.</li>
            </ul>
            <p className="text-[13px] text-ink-400 mt-6 leading-snug">Deterministic. Every number on screen comes from your own deal terms. Nothing is invented.</p>
          </div>
        )}

        {step === 1 && (
          <div className="flex-1 py-8">
            <h1 className="text-[28px] font-extrabold tracking-tight">Who's at the table?</h1>
            <p className="text-ink-300 mt-2 leading-snug">Your name labels your side of the ledger. Jurisdictions decide the consent rules the pre-flight enforces.</p>
            <Field label="Your name" className="mt-7">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Alex Rosen" autoCapitalize="words" data-testid="ob-name" />
            </Field>
            <Field label="Where participants may be" hint="Pick every state anyone on the call might be in. The strictest rule applies." className="mt-5">
              <div className="flex flex-wrap gap-2 mt-1 max-h-[300px] overflow-y-auto no-scrollbar pb-1">
                {US_JURISDICTIONS.map((j) => {
                  const on = juris.includes(j.code);
                  return (
                    <button
                      key={j.code}
                      type="button"
                      onClick={() => setJuris(on ? juris.filter((c) => c !== j.code) : [...juris, j.code])}
                      className={`h-9 px-3 rounded-full text-[13px] font-semibold border ${on ? "bg-ink-100 text-ink-950 border-ink-100" : "bg-ink-900 border-ink-700 text-ink-300"}`}
                      data-testid={`juris-${j.code}`}
                    >
                      {j.code === "INTL" ? "Intl" : j.code}
                      {j.allParty && <span className={`ml-1 ${on ? "text-flag" : "text-flag/80"}`}>•</span>}
                    </button>
                  );
                })}
              </div>
            </Field>
            <p className="text-[12px] text-ink-400 mt-2">• = all-party consent jurisdiction</p>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 py-8">
            <h1 className="text-[28px] font-extrabold tracking-tight">Listen lawfully.</h1>
            <p className="text-ink-300 mt-2 leading-snug">{BRAND.name} transcribes live audio. Recording or intercepting a conversation without the required consent can be a crime and expose you to civil liability.</p>
            <div className={`mt-6 rounded-2xl p-4 border ${req.allParty ? "border-flag/40 bg-flag/10" : "border-ink-700 bg-ink-900"}`}>
              <div className="text-[13px] font-semibold uppercase tracking-wider text-ink-300">{req.allParty ? "All-party consent required" : "One-party consent"}</div>
              <p className="text-[15px] mt-1.5 leading-snug">
                {req.allParty
                  ? `Everyone on the call must be told and agree. ${req.jurisdictions.map((j) => `${j.name}${j.statute ? ` (${j.statute})` : ""}`).join("; ") || "Jurisdiction not set — treated as all-party."}`
                  : "In the jurisdictions you selected, your own consent suffices — but telling participants remains best practice and builds trust."}
              </p>
            </div>
            <ul className="mt-6 space-y-3 text-[15px] text-ink-100/90">
              <li className="flex gap-3"><span className="text-calm">✓</span> Audio is processed in memory only and never written to disk.</li>
              <li className="flex gap-3"><span className="text-calm">✓</span> Transcripts are discarded after the memorandum is built. Only the typed ledger and memo are kept, on this device.</li>
              <li className="flex gap-3"><span className="text-calm">✓</span> Every pre-flight shows a disclosure script for you to read aloud.</li>
            </ul>
            <button type="button" onClick={() => setAck(!ack)} className="mt-7 w-full flex items-start gap-3 text-left" data-testid="ob-ack">
              <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center ${ack ? "bg-ink-100 border-ink-100 text-ink-950" : "border-ink-500"}`}>{ack && "✓"}</span>
              <span className="text-[14px] leading-snug text-ink-100/90">I understand I am responsible for obtaining any consent required where my calls take place. This app provides product guidance, not legal advice.</span>
            </button>
          </div>
        )}

        <div className="sticky bottom-0 py-4 bg-ink-950 safe-bottom flex gap-3">
          {step > 0 && (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button full onClick={() => setStep(step + 1)} data-testid="ob-next">
              Continue
            </Button>
          ) : (
            <Button full disabled={!ack} onClick={finish} data-testid="ob-finish">
              Start with a sample deal
            </Button>
          )}
        </div>
      </div>
    </Screen>
  );
}
