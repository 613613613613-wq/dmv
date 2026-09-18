import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BRAND } from "../../brand";
import { formatHours, remainingSeconds } from "../../engine/billing/entitlements";
import { PLANS } from "../../engine/billing/plans";
import { US_JURISDICTIONS } from "../../engine/compliance/consent";
import type { LlmProvider } from "../../engine/advisor/llm";
import type { SttMode } from "../../engine/store/vault";
import { shareText } from "../../native/share";
import { useApp } from "../AppContext";
import { Button, Card, Field, Input, Screen, SectionTitle, Select, Toggle } from "../components";

/** Numeric field that lets the user type freely and clamps/commits on blur. */
function NumberField({ label, value, min, max, onCommit, testId }: { label: string; value: number; min: number; max: number; onCommit: (v: number) => void; testId?: string }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  return (
    <Field label={label}>
      <Input
        type="number"
        inputMode="numeric"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => {
          const n = Number(text);
          const v = Number.isFinite(n) && text.trim() !== "" ? Math.min(max, Math.max(min, n)) : value;
          setText(String(v));
          onCommit(v);
        }}
        data-testid={testId}
      />
    </Field>
  );
}

export function SettingsView() {
  const nav = useNavigate();
  const { settings, updateSettings, usage, exportData, eraseAll } = useApp();
  const [flash, setFlash] = useState<string | null>(null);
  const s = settings;
  const say = (m: string) => {
    setFlash(m);
    setTimeout(() => setFlash(null), 1800);
  };

  return (
    <Screen title="Settings" back="/home" testId="settings">
      <Card className="mt-4" onClick={() => nav("/paywall")}>
        <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">{PLANS[usage.planId].name} plan</div>
        <div className="text-[20px] font-extrabold mt-0.5">{formatHours(remainingSeconds(usage, new Date()))} live time left</div>
        <div className="text-[13px] text-link mt-1 font-semibold">Manage plan →</div>
      </Card>

      <SectionTitle>You</SectionTitle>
      <Field label="Your name">
        <Input value={s.userName} onChange={(e) => updateSettings({ userName: e.target.value })} />
      </Field>
      <Field label="Jurisdictions" className="mt-4" hint="• marks all-party-consent jurisdictions.">
        <div className="flex flex-wrap gap-2 mt-1">
          {US_JURISDICTIONS.map((j) => {
            const on = s.jurisdictions.includes(j.code);
            return (
              <button key={j.code} type="button" onClick={() => updateSettings({ jurisdictions: on ? s.jurisdictions.filter((c) => c !== j.code) : [...s.jurisdictions, j.code] })} className={`h-8 px-2.5 rounded-full text-[12px] font-semibold border ${on ? "bg-ink-100 text-ink-950 border-ink-100" : "bg-ink-900 border-ink-700 text-ink-300"}`}>
                {j.code === "INTL" ? "Intl" : j.code}
                {j.allParty && <span className="ml-0.5 text-flag">•</span>}
              </button>
            );
          })}
        </div>
      </Field>

      <SectionTitle>Listening</SectionTitle>
      <Field label="Default mode">
        <Select value={s.sttMode} onChange={(e) => updateSettings({ sttMode: e.target.value as SttMode })} data-testid="set-mode">
          <option value="demo">Demo (scripted)</option>
          <option value="deepgram">Live — this phone listens (Deepgram)</option>
          <option value="companion">Companion — desktop HUD</option>
        </Select>
      </Field>
      <Field label="Deepgram API key" className="mt-4" hint="Stored only on this device. Get one at console.deepgram.com. Live mode streams your microphone to Deepgram under your own account.">
        <Input type="password" autoComplete="off" value={s.deepgramApiKey} onChange={(e) => updateSettings({ deepgramApiKey: e.target.value.trim() })} placeholder="dg_…" data-testid="set-dg" />
      </Field>
      <Field label="Companion desktop host" className="mt-4" hint="LAN IP or hostname of the machine running the desktop daemon (port 8765 by default).">
        <div className="flex gap-2">
          <Input value={s.companionHost} onChange={(e) => updateSettings({ companionHost: e.target.value.trim() })} placeholder="192.168.1.20" className="flex-1" data-testid="set-host" />
          <div className="w-28">
            <NumberField label="" value={s.companionPort} min={1} max={65535} onCommit={(v) => updateSettings({ companionPort: v })} />
          </div>
        </div>
      </Field>
      <Field label="Companion token (optional)" className="mt-4">
        <Input type="password" autoComplete="off" value={s.companionToken} onChange={(e) => updateSettings({ companionToken: e.target.value.trim() })} />
      </Field>

      <SectionTitle>Help Now reasoning</SectionTitle>
      <Field label="Provider" hint="Optional. Without a provider, Help Now uses deterministic templates from your terms. With one, every model reply is checked: any figure not in your vault or the last 30 seconds is rejected.">
        <Select value={s.llmProvider} onChange={(e) => updateSettings({ llmProvider: e.target.value as LlmProvider })}>
          <option value="none">Templates only (offline)</option>
          <option value="gemini">Google Gemini 2.5 Flash</option>
          <option value="groq">Groq · Llama 3.3 70B</option>
        </Select>
      </Field>
      {s.llmProvider !== "none" && (
        <Field label={`${s.llmProvider === "gemini" ? "Gemini" : "Groq"} API key`} className="mt-4">
          <Input type="password" autoComplete="off" value={s.llmApiKey} onChange={(e) => updateSettings({ llmApiKey: e.target.value.trim() })} />
        </Field>
      )}

      <SectionTitle>Glance HUD</SectionTitle>
      <Toggle checked={s.hapticsEnabled} onChange={(v) => updateSettings({ hapticsEnabled: v })} label="Haptic on cue" hint="A distinct buzz for red flags so you never have to look until it matters." />
      <Toggle checked={s.keepAwake} onChange={(v) => updateSettings({ keepAwake: v })} label="Keep screen awake during calls" />
      <Toggle checked={s.speculative} onChange={(v) => updateSettings({ speculative: v })} label="Speculative retrieval" hint="Pre-build the cue while they are still talking; publish or cancel at end of turn." />
      <div className="grid grid-cols-2 gap-3 mt-2">
        <NumberField label="Red flag stays (s)" value={s.tier1TtlMs / 1000} min={3} max={120} onCommit={(v) => updateSettings({ tier1TtlMs: v * 1000 })} />
        <NumberField label="Fact card stays (s)" value={s.tier2TtlMs / 1000} min={3} max={120} onCommit={(v) => updateSettings({ tier2TtlMs: v * 1000 })} />
      </div>

      <SectionTitle>Privacy & data</SectionTitle>
      <p className="text-[13px] text-ink-300 leading-snug">Audio is never stored. Transcripts are discarded after each memorandum. Deal terms, ledgers, memoranda and these settings live only on this device.</p>
      <div className="flex gap-3 mt-3">
        <Button
          variant="ghost"
          full
          onClick={async () => {
            const r = await shareText(`${BRAND.name} data export`, await exportData());
            say(r === "copied" ? "Copied to clipboard" : r === "shared" ? "Exported" : "Export failed");
          }}
        >
          Export my data
        </Button>
        <Button
          variant="danger"
          full
          onClick={async () => {
            if (confirm("Delete every deal, memorandum, key and setting on this device? This cannot be undone.")) {
              await eraseAll();
              nav("/onboarding", { replace: true });
            }
          }}
          data-testid="erase"
        >
          Delete all data
        </Button>
      </div>
      {flash && <p className="text-[13px] text-calm mt-2">{flash}</p>}

      <SectionTitle>About</SectionTitle>
      <div className="space-y-1 text-[14px]">
        <button className="block text-link font-semibold" onClick={() => nav("/legal/privacy")}>
          Privacy policy
        </button>
        <button className="block text-link font-semibold" onClick={() => nav("/legal/terms")}>
          Terms of service
        </button>
        <button className="block text-link font-semibold" onClick={() => nav("/legal/compliance")}>
          Recording-consent guide
        </button>
        <a className="block text-link font-semibold" href={`mailto:${BRAND.supportEmail}`}>
          Support · {BRAND.supportEmail}
        </a>
        <p className="text-[12px] text-ink-400 pt-2">
          {BRAND.name} {BRAND.version} · Not legal or financial advice. Verify every cue against your documents.
        </p>
      </div>
    </Screen>
  );
}
