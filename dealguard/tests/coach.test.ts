import { describe, expect, it } from "vitest";
import { Advisor } from "../src/engine/advisor/llm";
import { DEMO_CONVERSATION, DEMO_CONVERSATION_SCRIPT, ScriptedCoach } from "../src/engine/coach/demoConversation";
import { HeuristicCoach } from "../src/engine/coach/heuristic";
import { buildCoachPrompt, LlmCoach, parseCoachJson } from "../src/engine/coach/llm";
import type { CoachContext, CoachProvider } from "../src/engine/coach/types";
import { CallSession, type SessionEvent } from "../src/engine/session";
import type { SttClient } from "../src/engine/stt/types";
import type { TranscriptEvent } from "../src/engine/types";
import { conversationAsDeal } from "../src/ui/live";

const ctx = (theirLine: string, turnIndex = 0): CoachContext => ({ conversation: DEMO_CONVERSATION, recent: [{ speaker: "COUNTERPARTY", text: theirLine }], theirLine, turnIndex });
const never = new AbortController().signal;

describe("HeuristicCoach (offline)", () => {
  const h = new HeuristicCoach();
  it("waits when they are mid-thought", async () => {
    expect((await h.decide(ctx("Every time we wait it costs us more and"), never)).action).toBe("wait");
    expect((await h.decide(ctx("Well"), never)).action).toBe("wait");
  });
  it("acknowledges feelings before anything else", async () => {
    const d = await h.decide(ctx("I feel like I'm the only one who plans anything."), never);
    expect(d.action).toBe("say");
    expect(d.say).toMatch(/sounds hard/i);
  });
  it("answers questions and closes decisions", async () => {
    expect((await h.decide(ctx("Can we agree on a budget tonight so I can book?"), never)).say).toMatch(/^Yes\./);
    expect((await h.decide(ctx("Did you look at the flights?"), never)).action).toBe("say");
    expect((await h.decide(ctx("The weather was nice today."), never)).action).toBe("wait");
  });
});

describe("LlmCoach", () => {
  it("builds a prompt that carries goal, facts, tone and their line", () => {
    const p = buildCoachPrompt(ctx("Can we agree on a budget tonight?"));
    expect(p.system).toMatch(/Tone: warm/);
    expect(p.user).toContain("Agree on a budget");
    expect(p.user).toContain("Flights went up about 30%");
    expect(p.user).toContain("THEY JUST SAID:\nCan we agree on a budget tonight?");
  });
  it("parses tolerant JSON", () => {
    expect(parseCoachJson('Sure: {"action":"say","say":"Yes. What number feels right to you?","why":"commit"} ok')).toEqual({ action: "say", say: "Yes. What number feels right to you?", why: "commit" });
    expect(parseCoachJson("nope")).toBeNull();
  });
  it("accepts a grounded suggestion", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"action":"say","say":"Four thousand works if the hotel stays under half.","why":"agree with guardrail"}' } }] }), { status: 200 })) as typeof fetch;
    const c = new LlmCoach({ provider: "groq", apiKey: "k", fetchFn });
    const d = await c.decide(ctx("I was thinking around four thousand all in."), never);
    expect(d).toMatchObject({ action: "say", source: "llm" });
    expect(d.say).toMatch(/Four thousand/);
  });
  it("rejects invented numbers and falls back to the heuristic", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ choices: [{ message: { content: '{"action":"say","say":"Let us cap it at 2,500 and fly on the 9th.","why":"x"}' } }] }), { status: 200 })) as typeof fetch;
    const c = new LlmCoach({ provider: "groq", apiKey: "k", fetchFn });
    const d = await c.decide(ctx("I was thinking around four thousand all in."), never);
    expect(d.source).toBe("heuristic");
    expect(d.say ?? "").not.toMatch(/2,500/);
  });
  it("honours a wait decision and survives network failure", async () => {
    const waitFetch = (async () => new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"action":"wait","why":"she is venting"}' }] } }] }), { status: 200 })) as typeof fetch;
    expect((await new LlmCoach({ provider: "gemini", apiKey: "k", fetchFn: waitFetch }).decide(ctx("I knew this would happen."), never)).action).toBe("wait");
    const failFetch = (async () => new Response("x", { status: 500 })) as typeof fetch;
    expect((await new LlmCoach({ provider: "gemini", apiKey: "k", fetchFn: failFetch }).decide(ctx("Did you book it?"), never)).source).toBe("heuristic");
  });
  it("uses the heuristic when no key is configured", async () => {
    expect((await new LlmCoach({ provider: "none", apiKey: "" }).decide(ctx("Did you book it?"), never)).source).toBe("heuristic");
  });
});

// ── Session integration: coach fires only after THEIR turns, never before ──
class PushStt implements SttClient {
  readonly stream = "COUNTERPARTY" as const;
  status: "idle" | "connecting" | "open" | "closed" | "error" = "idle";
  onTranscript: ((e: TranscriptEvent) => void) | null = null;
  onStatus: ((s: "idle" | "connecting" | "open" | "closed" | "error", d?: string) => void) | null = null;
  async start() {
    this.status = "open";
  }
  sendFrames() {}
  async stop() {
    this.status = "closed";
  }
}

function harness(coach: CoachProvider) {
  let t = 1_000_000;
  const timers: Array<{ at: number; fn: () => void; id: number }> = [];
  let nextId = 1;
  const setT = ((fn: () => void, ms: number) => {
    const id = nextId++;
    timers.push({ at: t + ms, fn, id });
    return id as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof setTimeout;
  const clearT = ((id: unknown) => {
    const i = timers.findIndex((x) => x.id === (id as number));
    if (i >= 0) timers.splice(i, 1);
  }) as unknown as typeof clearTimeout;
  const advance = (ms: number) => {
    const target = t + ms;
    for (;;) {
      timers.sort((a, b) => a.at - b.at);
      const n = timers[0];
      if (!n || n.at > target) break;
      timers.shift();
      t = n.at;
      n.fn();
    }
    t = target;
  };
  const events: SessionEvent[] = [];
  const stt = new PushStt();
  const session = new CallSession({
    deal: conversationAsDeal(DEMO_CONVERSATION),
    conversation: DEMO_CONVERSATION,
    coach,
    stt: [stt],
    advisor: new Advisor({ provider: "none", apiKey: "" }),
    now: () => t,
    setTimeoutFn: setT,
    clearTimeoutFn: clearT,
    onEvent: (e) => events.push(e),
  });
  const say = (speaker: "USER" | "COUNTERPARTY", text: string) => stt.onTranscript?.({ speaker, text, isFinal: true, endOfTurn: true, receivedAt: t });
  const flush = () => new Promise<void>((r) => setTimeout(r, 0));
  return { session, events, say, advance, flush };
}

describe("CallSession + coach", () => {
  it("shows nothing before they speak, then reacts to each of their turns with context", async () => {
    const { session, events, say, advance, flush } = harness(new ScriptedCoach());
    await session.start();
    expect(events.filter((e) => e.type === "cue").length).toBe(0);
    for (const line of DEMO_CONVERSATION_SCRIPT) {
      advance(line.gapMs ?? 1000);
      say(line.speaker, line.text);
      await flush();
    }
    const cues = events.filter((e): e is Extract<SessionEvent, { type: "cue" }> => e.type === "cue").map((e) => e.cue);
    const replies = cues.filter((c) => c.kind === "REPLY");
    expect(replies.length).toBe(5);
    expect(replies[0].headline).toBe("Yes, I did. Let me show you what I found.");
    expect(replies[0].context).toBe("So did you look at the flights for October like you said you would?");
    expect(replies[0].source).toMatch(/^Why:/);
    // The venting line produced a WAIT decision; since a reply was still on screen it was not shown.
    expect(cues.some((c) => c.kind === "WAIT")).toBe(false);
    expect(session.coachMetrics).toMatchObject({ says: 5, waits: 1, stale: 0 });
    // Nothing fired on the user's own lines.
    for (const c of replies) expect(DEMO_CONVERSATION_SCRIPT.some((l) => l.speaker === "COUNTERPARTY" && l.text === c.context)).toBe(true);
    const { memorandum } = await session.end();
    expect(memorandum.dealName).toBe("October trip with Dana");
    expect(memorandum.agreedTerms.some((a) => /book the car by Friday/i.test(a.text))).toBe(true);
  });

  it("drops a stale decision when a newer turn arrives first", async () => {
    let resolveFirst!: (v: { action: "say"; say: string; reactingTo: string; source: "llm" }) => void;
    let calls = 0;
    const slow: CoachProvider = {
      decide: (c, signal) =>
        new Promise((resolve) => {
          calls++;
          if (calls === 1) resolveFirst = resolve;
          else resolve({ action: "say", say: "Second answer.", reactingTo: c.theirLine, source: "llm" });
          signal.addEventListener("abort", () => resolve({ action: "wait", reactingTo: c.theirLine, source: "llm" }));
        }),
    };
    const { session, events, say, flush } = harness(slow);
    await session.start();
    say("COUNTERPARTY", "First thing they said, quite long indeed.");
    await flush();
    say("COUNTERPARTY", "Second thing they said, also long enough.");
    await flush();
    resolveFirst({ action: "say", say: "First answer.", reactingTo: "x", source: "llm" });
    await flush();
    const replies = events.filter((e): e is Extract<SessionEvent, { type: "cue" }> => e.type === "cue").map((e) => e.cue.headline);
    expect(replies).toEqual(["Second answer."]);
    expect(session.coachMetrics.stale).toBe(1);
  });
});
