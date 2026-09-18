import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { recordUsage } from "../../engine/billing/entitlements";
import { CompanionLink, type LinkStatus } from "../../engine/companion/link";
import { CueDedupe } from "../../engine/companion/protocol";
import type { SessionEvent, SessionMetrics } from "../../engine/session";
import type { SttMode } from "../../engine/store/vault";
import { newId } from "../../engine/store/vault";
import type { Cue, Speaker } from "../../engine/types";
import { hapticCue, hapticTap } from "../../native/haptics";
import { keepAwake } from "../../native/keepAwake";
import { platform } from "../../native/platform";
import { immersive } from "../../native/statusBar";
import { useApp } from "../AppContext";
import { createLiveController, type LiveController } from "../live";

const HOLD_MS = 1500;

function fmt(ms: number): string {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

export function LiveView() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const { deals, settings, usage, setUsage, saveSession } = useApp();
  const deal = deals.find((d) => d.projectId === id);
  const rawMode = params.get("mode");
  const mode: SttMode = rawMode === "demo" || rawMode === "deepgram" || rawMode === "companion" ? rawMode : settings.sttMode;
  const disclosed = params.get("disclosed") === "1";

  const [cue, setCue] = useState<Cue | null>(null);
  const [frozen, setFrozen] = useState(false);
  const [streams, setStreams] = useState<Record<string, string>>({});
  const [interim, setInterim] = useState<{ speaker: Speaker; text: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [helpBusy, setHelpBusy] = useState(false);
  const [ending, setEnding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [ledgerCount, setLedgerCount] = useState(0);

  const ctrl = useRef<LiveController | null>(null);
  const link = useRef<CompanionLink | null>(null);
  const dedupe = useRef(new CueDedupe());
  const startedAt = useRef(Date.now());
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const held = useRef(false);
  const companionTtl = useRef<ReturnType<typeof setTimeout> | null>(null);

  const applyCue = useCallback(
    (c: Cue | null) => {
      if (!dedupe.current.changed(c)) return;
      setCue(c);
      if (c && settings.hapticsEnabled) void hapticCue(c.tier);
    },
    [settings.hapticsEnabled],
  );

  const onEvent = useCallback(
    (e: SessionEvent) => {
      switch (e.type) {
        case "cue":
          applyCue(e.cue);
          setFrozen(false);
          break;
        case "cue-cleared":
          applyCue(null);
          setFrozen(false);
          break;
        case "frozen":
          setFrozen(e.frozen);
          break;
        case "transcript":
          setInterim(e.isFinal ? null : { speaker: e.line.speaker, text: e.line.text });
          break;
        case "ledger":
          setLedgerCount((n) => n + 1);
          break;
        case "status":
          setStreams((s) => ({ ...s, [e.stream]: e.status }));
          if (e.status === "error" && e.detail) setError(e.detail);
          break;
        default:
          break;
      }
    },
    [applyCue],
  );

  // Boot the session once.
  useEffect(() => {
    if (!deal) return;
    let cancelled = false;
    void keepAwake(settings.keepAwake);
    // iOS keeps its system microphone indicator in the Dynamic Island; on Android the
    // status bar (and its privacy chip) stays visible so a live call is never hidden.
    if (platform() === "ios") void immersive(true);
    startedAt.current = Date.now();

    if (mode === "companion") {
      const l = new CompanionLink({ host: settings.companionHost, port: settings.companionPort, token: settings.companionToken || undefined, device: "phone" });
      link.current = l;
      l.onStatus = (s: LinkStatus, d) => {
        setStreams((x) => ({ ...x, link: s }));
        if (s === "error" && d) setError(d);
      };
      l.onStreams = (self, cp) => setStreams((x) => ({ ...x, USER: self, COUNTERPARTY: cp }));
      l.onCue = (c, ttl) => {
        applyCue(c);
        setFrozen(false);
        if (companionTtl.current) clearTimeout(companionTtl.current);
        companionTtl.current = setTimeout(() => applyCue(null), ttl ?? (c.tier === 1 ? settings.tier1TtlMs : settings.tier2TtlMs));
      };
      l.onClear = () => applyCue(null);
      l.connect();
    } else {
      const c = createLiveController(deal, settings, mode, onEvent);
      ctrl.current = c;
      if (disclosed) {
        // Pre-flight confirmation that participants were informed, on the record with a timestamp.
        c.session.ledger.add({
          offsetMs: 0,
          speaker: "USER",
          assertionType: "AGREEMENT",
          topic: "consent_disclosure",
          verbatimText: `Host confirmed all participants were informed that an AI deal assistant is running (${new Date().toISOString()}).`,
        });
      }
      c.start().catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not start listening");
      });
    }

    const tick = setInterval(() => setElapsed(Date.now() - startedAt.current), 500);
    return () => {
      cancelled = true;
      clearInterval(tick);
      if (companionTtl.current) clearTimeout(companionTtl.current);
      void keepAwake(false);
      void immersive(false);
      link.current?.close();
      link.current = null;
      // Navigated away without "End meeting" (history back, deep link): finish the
      // call properly so the memorandum is saved and live time is metered.
      if (ctrl.current) void endRef.current(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal?.projectId, mode]);

  // Android hardware back: end the call instead of silently unmounting.
  useEffect(() => {
    const sub = CapApp.addListener("backButton", () => void endRef.current(true));
    return () => {
      void sub.then((h) => h.remove()).catch(() => undefined);
    };
  }, []);

  // Keyboard shortcuts (desktop/web): space dismiss/hold-freeze, ⌘/Ctrl+H help.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        onPressStart();
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "h") {
        e.preventDefault();
        void help();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") onPressEnd();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cue]);

  const dismiss = () => {
    if (!cue) return;
    void hapticTap();
    if (mode === "companion") {
      link.current?.dismiss(cue.id);
      applyCue(null);
    } else ctrl.current?.session.dismiss();
  };

  const toggleFreeze = () => {
    if (!cue) return;
    void hapticTap();
    const next = !frozen;
    if (mode === "companion") {
      link.current?.freeze(cue.id, next);
      setFrozen(next);
      if (next && companionTtl.current) clearTimeout(companionTtl.current);
    } else ctrl.current?.session.freeze(next);
  };

  const onPressStart = () => {
    held.current = false;
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = setTimeout(() => {
      held.current = true;
      toggleFreeze();
    }, HOLD_MS);
  };
  const onPressEnd = () => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    holdTimer.current = null;
    if (!held.current) dismiss();
    held.current = false;
  };

  const help = async () => {
    if (helpBusy) return;
    setHelpBusy(true);
    try {
      if (mode === "companion") link.current?.help();
      else await ctrl.current?.session.helpNow();
    } finally {
      setHelpBusy(false);
    }
  };

  const endRef = useRef<(navigate: boolean) => Promise<void>>(async () => undefined);
  const end = () => endRef.current(true);
  endRef.current = async (navigate: boolean) => {
    if (!deal) return;
    const c = ctrl.current;
    if (!c && mode !== "companion") return; // already ended
    if (navigate) setEnding(true);
    ctrl.current = null;
    link.current?.close();
    link.current = null;
    const durationMs = Date.now() - startedAt.current;
    let metrics: SessionMetrics | null = null;
    let record = null as null | Parameters<typeof saveSession>[0];
    if (c) {
      await c.stop();
      const { markdown, metrics: m } = await c.session.end();
      metrics = m;
      record = {
        id: newId("session"),
        projectId: deal.projectId,
        dealName: deal.name || "Untitled deal",
        startedAt: new Date(startedAt.current).toISOString(),
        endedAt: new Date().toISOString(),
        durationMs,
        memorandumMarkdown: markdown,
        ledger: c.session.ledger.toJSON(),
        stats: { redFlags: m.tier1, factCards: m.tier2, medianLatencyMs: m.medianLatencyMs, unsolicitedCues: m.unsolicitedCues },
      };
      await saveSession(record);
    }
    if (mode !== "demo") await setUsage(recordUsage(usage, Math.ceil(durationMs / 1000), new Date()));
    void metrics;
    if (navigate) nav(record ? `/memo/${record.id}` : "/home", { replace: true });
  };

  const tone = useMemo(() => (cue ? (cue.tier === 1 ? "text-flag" : cue.tier === 2 ? "text-fact" : "text-calm") : ""), [cue]);
  const dot = (s?: string) => (s === "open" ? "bg-calm" : s === "connecting" || s === "reconnecting" ? "bg-fact pulse" : s === "error" ? "bg-flag" : "bg-ink-600");

  if (!deal) return null;

  return (
    <div className="fixed inset-0 bg-black text-ink-100 flex flex-col select-none" data-testid="live">
      {/* The glance surface: black until there is something to say. */}
      <button
        className="flex-1 flex items-center justify-center px-6 text-center outline-none"
        onPointerDown={onPressStart}
        onPointerUp={onPressEnd}
        onPointerCancel={onPressEnd}
        onPointerLeave={() => holdTimer.current && onPressEnd()}
        onContextMenu={(e) => e.preventDefault()}
        aria-label={cue ? `${cue.headline}. Tap to dismiss, hold to freeze.` : "Listening"}
        data-testid="hud"
      >
        {cue ? (
          <div key={cue.id} className="cue-in max-w-[680px]" data-testid="cue" data-tier={cue.tier}>
            <div className={`text-[12px] font-bold uppercase tracking-[0.2em] mb-4 ${tone}`}>
              {cue.kind === "RED_FLAG" ? "Red flag" : cue.kind === "CONFIDENTIAL" ? "Confidential" : cue.kind === "FACT_CARD" ? "Fact" : "Talking point"}
              {frozen && " · frozen"}
            </div>
            <div className={`hud-headline ${cue.tier === 1 ? "text-white" : "text-ink-100"}`} data-testid="cue-headline">
              {cue.headline}
            </div>
            <div className="text-[15px] text-ink-400 mt-5 truncate" data-testid="cue-source">
              {cue.source}
            </div>
          </div>
        ) : (
          <div className="opacity-30">
            {interim && showTranscript ? (
              <p className="text-[15px] text-ink-300 max-w-[560px] leading-snug">
                <span className="text-ink-400">{interim.speaker === "USER" ? "You: " : "Them: "}</span>
                {interim.text}
              </p>
            ) : (
              <div className="w-2 h-2 rounded-full bg-ink-400 pulse" />
            )}
          </div>
        )}
      </button>

      {error && (
        <div className="mx-4 mb-2 rounded-xl bg-flag/15 border border-flag/40 text-flag text-[13px] px-3 py-2" role="alert">
          {error}
        </div>
      )}

      <div className="safe-bottom px-4 pb-6">
        <div className="flex items-center gap-3 text-[12px] text-ink-400 mb-3">
          <span className={`flex items-center gap-1.5 font-semibold ${mode === "demo" ? "text-ink-300" : "text-flag"}`} data-testid="live-indicator">
            <span className={`w-2 h-2 rounded-full ${mode === "demo" ? "bg-ink-300" : "bg-flag"} pulse`} />
            {mode === "demo" ? "DEMO" : mode === "companion" ? "LIVE · desktop" : "LIVE · listening"}
          </span>
          <span className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${dot(mode === "companion" ? streams.link : streams.COUNTERPARTY)}`} />
            {mode === "companion" ? "desktop" : mode === "demo" ? "demo" : "them"}
          </span>
          {mode !== "demo" && (
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${dot(mode === "companion" ? streams.USER : streams.COUNTERPARTY)}`} />
              you
            </span>
          )}
          <span className="ml-auto tabular-nums" data-testid="elapsed">
            {fmt(elapsed)}
          </span>
          <span>· {ledgerCount} ledger</span>
          <button className="underline" onClick={() => setShowTranscript(!showTranscript)}>
            {showTranscript ? "hide words" : "show words"}
          </button>
        </div>
        <div className="flex gap-3">
          <button onClick={end} disabled={ending} className="h-14 px-5 rounded-2xl bg-ink-800 text-ink-100 font-semibold text-[15px] active:scale-[0.98] disabled:opacity-50" data-testid="end">
            {ending ? "Ending…" : "End meeting"}
          </button>
          <button onClick={help} disabled={helpBusy} className="flex-1 h-14 rounded-2xl bg-ink-100 text-ink-950 font-bold text-[16px] active:scale-[0.98] disabled:opacity-50" data-testid="help">
            {helpBusy ? "Thinking…" : "Help now"}
          </button>
        </div>
        <p className="text-center text-[11px] text-ink-600 mt-2">tap to dismiss · hold to freeze</p>
      </div>
    </div>
  );
}
