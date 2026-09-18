import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BRAND } from "../../brand";
import { canStartSession } from "../../engine/billing/entitlements";
import type { Conversation, Tone } from "../../engine/coach/types";
import { consentRequirement, disclosureScript } from "../../engine/compliance/consent";
import type { SttMode } from "../../engine/store/vault";
import { newId } from "../../engine/store/vault";
import { useApp } from "../AppContext";
import { Button, Card, Empty, Field, Input, Screen, Textarea } from "../components";

const TONES: Array<{ v: Tone; label: string }> = [
  { v: "warm", label: "Warm" },
  { v: "calm", label: "Calm" },
  { v: "direct", label: "Direct" },
  { v: "playful", label: "Playful" },
];

const EXAMPLES = [
  "Ask my landlord to hold the rent this year without souring the relationship.",
  "Talk to my brother about splitting Dad's care costs fairly.",
  "Tell my manager I need a raise and get a date, not a maybe.",
  "Plan our October trip with Dana and agree a budget without a fight.",
];

function blank(): Conversation {
  const now = new Date().toISOString();
  return { id: newId("talk"), title: "", goal: "", counterpart: "", tone: "warm", facts: [], createdAt: now, updatedAt: now };
}

/**
 * The simple entry point: describe the conversation in your own words, pick
 * who and how, start. The coach stays silent until the other person speaks.
 */
export function ConversationView() {
  const { id } = useParams();
  const nav = useNavigate();
  const { conversations, saveConversation, deleteConversation, settings, updateSettings, usage } = useApp();
  const existing = id && id !== "new" ? conversations.find((c) => c.id === id) : undefined;
  const [c, setC] = useState<Conversation>(existing ?? blank());
  const [mode, setMode] = useState<SttMode>(settings.sttMode === "companion" ? "demo" : settings.sttMode);
  const [informed, setInformed] = useState(false);
  const [factsText, setFactsText] = useState((existing?.facts ?? []).join("\n"));
  const req = consentRequirement(settings.jurisdictions);
  const start = canStartSession(usage, new Date());

  useEffect(() => {
    if (existing && existing.id !== c.id) {
      setC(existing);
      setFactsText(existing.facts.join("\n"));
    }
  }, [existing, c.id]);

  if (id && id !== "new" && !existing) return <Screen title="Conversation" back="/home"><Empty title="Not found" /></Screen>;

  const facts = factsText.split("\n").map((f) => f.trim()).filter(Boolean);
  const title = c.title.trim() || (c.counterpart.trim() ? `Talk with ${c.counterpart.trim()}` : c.goal.trim().split(/[.!?\n]/)[0].slice(0, 48));
  const canSave = c.goal.trim().length >= 8;
  const noCoachKey = mode === "deepgram" && (settings.llmProvider === "none" || !settings.llmApiKey);
  const blocked =
    mode === "deepgram" && !settings.deepgramApiKey ? "Add your Deepgram API key in Settings to listen live." : mode === "deepgram" && !start.ok ? (start.reason === "trial_expired" ? "Your trial has ended." : "No live hours left this month.") : null;

  const persist = async () => {
    const next = { ...c, title, facts };
    setC(next);
    await saveConversation(next);
    return next;
  };

  const go = async () => {
    const saved = await persist();
    await updateSettings({ sttMode: mode });
    nav(`/live/talk/${saved.id}?mode=${mode}${informed ? "&disclosed=1" : ""}`, { replace: true });
  };

  return (
    <Screen title={existing ? "Conversation" : "New conversation"} back="/home" testId="talk-setup">
      <h2 className="text-[24px] font-extrabold mt-5 tracking-tight">What's this conversation, and what do you want from it?</h2>
      <p className="text-ink-300 mt-1.5 leading-snug">Plain words. {BRAND.name} listens, stays quiet until the other person speaks, then shows what they said and what you could say next.</p>

      <Textarea
        className="mt-4 min-h-[140px] text-[17px]"
        value={c.goal}
        onChange={(e) => setC({ ...c, goal: e.target.value })}
        placeholder={EXAMPLES[0]}
        autoFocus={!existing}
        data-testid="talk-goal"
      />
      {!c.goal && (
        <div className="flex flex-wrap gap-2 mt-2">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setC({ ...c, goal: ex })} className="text-left text-[12px] text-ink-300 bg-ink-900 border border-ink-800 rounded-full px-3 py-1.5">
              {ex.split(" ").slice(0, 6).join(" ")}…
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mt-5">
        <Field label="Who">
          <Input value={c.counterpart} onChange={(e) => setC({ ...c, counterpart: e.target.value })} placeholder="Dana, my wife" autoCapitalize="words" data-testid="talk-who" />
        </Field>
        <Field label="Title (optional)">
          <Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} placeholder={title || "Auto"} />
        </Field>
      </div>

      <Field label="Your tone" className="mt-4">
        <div className="flex gap-2 mt-1">
          {TONES.map((t) => (
            <button key={t.v} type="button" onClick={() => setC({ ...c, tone: t.v })} className={`h-9 px-3 rounded-full text-[13px] font-semibold border ${c.tone === t.v ? "bg-ink-100 text-ink-950 border-ink-100" : "bg-ink-900 border-ink-700 text-ink-300"}`} data-testid={`tone-${t.v}`}>
              {t.label}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Facts worth remembering (optional, one per line)" className="mt-4" hint="Numbers, dates, past promises. Suggestions only ever use figures from here or from what was actually said.">
        <Textarea value={factsText} onChange={(e) => setFactsText(e.target.value)} placeholder={"Flights went up 30% since August\nI get 5 days off around October 12"} />
      </Field>

      <h3 className="text-[13px] font-semibold uppercase tracking-wider text-ink-400 mt-7 mb-2.5">How it listens</h3>
      <div className="space-y-2">
        <button onClick={() => setMode("deepgram")} className={`w-full text-left rounded-2xl border p-4 ${mode === "deepgram" ? "border-ink-100 bg-ink-900" : "border-ink-800 bg-ink-900/50"}`} data-testid="talk-mode-live">
          <div className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full border-2 ${mode === "deepgram" ? "border-ink-100 bg-ink-100" : "border-ink-500"}`} />
            <span className="text-[15px] font-semibold">Live — this phone listens</span>
          </div>
          <div className="text-[13px] text-ink-400 mt-1.5 ml-8 leading-snug">Put the phone on the table. Speak first so it learns your voice. Uses your Deepgram key{noCoachKey ? "; add a Gemini or Groq key for real suggestions (otherwise only simple prompts)" : " and your Gemini/Groq key"}.</div>
        </button>
        <button onClick={() => setMode("demo")} className={`w-full text-left rounded-2xl border p-4 ${mode === "demo" ? "border-ink-100 bg-ink-900" : "border-ink-800 bg-ink-900/50"}`} data-testid="talk-mode-demo">
          <div className="flex items-center gap-3">
            <span className={`w-5 h-5 rounded-full border-2 ${mode === "demo" ? "border-ink-100 bg-ink-100" : "border-ink-500"}`} />
            <span className="text-[15px] font-semibold">Demo — see how it feels</span>
          </div>
          <div className="text-[13px] text-ink-400 mt-1.5 ml-8 leading-snug">Plays a scripted conversation about planning a trip with a spouse. No microphone, no keys, no live hours.</div>
        </button>
      </div>
      {blocked && (
        <p className="text-[13px] text-flag mt-3">
          {blocked}{" "}
          <button className="underline" onClick={() => nav(blocked.includes("hours") || blocked.includes("trial") ? "/paywall" : "/settings")}>
            Open
          </button>
        </p>
      )}

      {mode === "deepgram" && (
        <Card className="mt-5">
          <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-400">{req.allParty ? "Tell them first — required where you are" : "Tell them first — good practice"}</div>
          <p className="text-[14px] mt-1.5 leading-snug">“{disclosureScript(BRAND.name)}”</p>
          <button type="button" onClick={() => setInformed(!informed)} className="mt-3 w-full flex items-start gap-3 text-left" data-testid="talk-informed">
            <span className={`mt-0.5 w-6 h-6 rounded-md border-2 flex items-center justify-center ${informed ? "bg-ink-100 border-ink-100 text-ink-950" : "border-ink-500"}`}>{informed && "✓"}</span>
            <span className="text-[14px] leading-snug">I've told everyone in the room that an AI assistant is listening.</span>
          </button>
        </Card>
      )}

      <div className="sticky bottom-0 py-4 bg-ink-950 safe-bottom flex gap-3 mt-8">
        {existing && (
          <Button
            variant="danger"
            onClick={() => {
              if (confirm("Delete this conversation? Past memoranda are kept.")) deleteConversation(existing.id).then(() => nav("/home"));
            }}
          >
            Delete
          </Button>
        )}
        <Button variant="ghost" onClick={() => persist().then(() => nav("/home"))} disabled={!canSave}>
          Save
        </Button>
        <Button full variant="flag" disabled={!canSave || !!blocked || (mode === "deepgram" && req.allParty && !informed)} onClick={go} data-testid="talk-start">
          {mode === "demo" ? "Start demo" : "Start listening"}
        </Button>
      </div>
    </Screen>
  );
}
