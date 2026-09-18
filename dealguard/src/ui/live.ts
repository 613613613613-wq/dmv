import { Advisor } from "../engine/advisor/llm";
import { MicCapture } from "../engine/audio/capture";
import { keywordBiasList } from "../engine/terms";
import { CallSession, type SessionEvent } from "../engine/session";
import { DeepgramClient, SpeakerMap } from "../engine/stt/deepgram";
import { DEMO_SCRIPT, MockSttClient } from "../engine/stt/mock";
import { DEMO_CONVERSATION_SCRIPT, ScriptedCoach } from "../engine/coach/demoConversation";
import { LlmCoach } from "../engine/coach/llm";
import type { Conversation } from "../engine/coach/types";
import type { SttClient } from "../engine/stt/types";
import type { AppSettings, SttMode } from "../engine/store/vault";
import type { Deal } from "../engine/types";

/**
 * Builds a CallSession for the chosen listening mode. Kept outside React so a
 * re-render or StrictMode double-mount can never start two microphones.
 */

export interface LiveController {
  session: CallSession;
  mode: SttMode;
  start(): Promise<void>;
  stop(): Promise<void>;
  captureStats(): { level: number; overflows: number; engine: string } | null;
}

/** A goal-driven conversation runs through the same session with an empty term vault plus a coach. */
export function conversationAsDeal(c: Conversation): Deal {
  return {
    projectId: c.id,
    name: c.title || "Conversation",
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
    side: "other",
    counterparties: c.counterpart ? [{ name: c.counterpart, role: "", notes: "" }] : [],
    terms: [],
    keywords: [c.counterpart, ...c.facts].filter(Boolean),
    archived: false,
  };
}

export function createLiveController(deal: Deal, settings: AppSettings, mode: SttMode, onEvent: (e: SessionEvent) => void, conversation?: Conversation): LiveController {
  const advisor = new Advisor({ provider: settings.llmProvider, apiKey: settings.llmApiKey });
  let capture: MicCapture | null = null;
  const stt: SttClient[] = [];
  const coach = conversation ? (mode === "demo" ? new ScriptedCoach() : new LlmCoach({ provider: settings.llmProvider, apiKey: settings.llmApiKey })) : undefined;

  if (mode === "demo") {
    stt.push(new MockSttClient(conversation ? DEMO_CONVERSATION_SCRIPT : DEMO_SCRIPT));
  } else if (mode === "deepgram") {
    // Standalone phone mode: one diarized stream. The first voice heard after
    // Start is the user (pre-flight tells them to speak first) — SpeakerMap
    // auto-calibrates on the first diarized index.
    const client = new DeepgramClient({
      apiKey: settings.deepgramApiKey,
      stream: "COUNTERPARTY",
      speakerMap: new SpeakerMap(null, true),
      options: { model: "nova-3", diarize: true, endpointingMs: 300, keywords: keywordBiasList(deal.terms, deal.keywords) },
    });
    stt.push(client);
    capture = new MicCapture((frames) => client.sendFrames(frames));
  }

  const session = new CallSession({
    deal,
    stt,
    advisor,
    coach,
    conversation,
    tier1TtlMs: settings.tier1TtlMs,
    tier2TtlMs: settings.tier2TtlMs,
    speculative: settings.speculative,
    onEvent,
  });

  return {
    session,
    mode,
    async start() {
      await session.start();
      if (capture) await capture.start();
    },
    async stop() {
      // Detach listeners first so a closing socket cannot surface a stale error banner.
      for (const c of stt) {
        c.onStatus = null;
        c.onTranscript = null;
      }
      if (capture) await capture.stop().catch(() => undefined);
    },
    captureStats() {
      if (!capture) return null;
      const s = capture.stats();
      return { level: s.level, overflows: s.overflows, engine: s.engine };
    },
  };
}
