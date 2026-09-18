import type { ScriptLine } from "../stt/mock";
import type { CoachContext, CoachDecision, CoachProvider, Conversation } from "./types";

/** Fictional personal conversation for the demo: planning a trip with a spouse. */
export const DEMO_CONVERSATION: Conversation = {
  id: "demo-vacation-talk",
  title: "October trip with Dana",
  goal: "Agree on a budget and dates for our October trip without it turning into a fight. I want Dana to feel like we're planning it together, and I want to keep the total under about four thousand.",
  counterpart: "Dana, my wife",
  tone: "warm",
  facts: ["Flights went up about 30% since August", "I get 5 days off around October 12", "Last year's trip cost about 3,200"],
  createdAt: "2026-09-01T12:00:00Z",
  updatedAt: "2026-09-01T12:00:00Z",
};

export const DEMO_CONVERSATION_SCRIPT: ScriptLine[] = [
  { speaker: "COUNTERPARTY", text: "So did you look at the flights for October like you said you would?", gapMs: 900 },
  { speaker: "USER", text: "I did. Let me show you what I found.", gapMs: 1600 },
  { speaker: "COUNTERPARTY", text: "I knew this would happen. Every time we wait it costs us more and", gapMs: 1500 },
  { speaker: "COUNTERPARTY", text: "honestly I feel like I'm the only one who plans anything around here.", gapMs: 1400 },
  { speaker: "USER", text: "You're right, you carry most of the planning. I'm sorry.", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "Thank you. Can we at least agree on a budget tonight so I can book?", gapMs: 1500 },
  { speaker: "USER", text: "Yes. What number feels right to you?", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "I was thinking around four thousand all in.", gapMs: 1500 },
  { speaker: "USER", text: "Four thousand works if we keep the hotel under half of it.", gapMs: 1800 },
  { speaker: "COUNTERPARTY", text: "Okay. And you'll handle the car rental this time?", gapMs: 1500 },
  { speaker: "USER", text: "Deal. I'll book the car by Friday.", gapMs: 1200 },
];

/** Pre-written coaching for the demo script so the experience needs no API key. */
const SCRIPTED: Record<number, Omit<CoachDecision, "reactingTo" | "source">> = {
  0: { action: "say", say: "Yes, I did. Let me show you what I found.", why: "answer directly" },
  1: { action: "wait", why: "she's mid-thought — let her finish" },
  2: { action: "say", say: "You're right, you carry most of the planning. I'm sorry.", why: "acknowledge before anything else" },
  3: { action: "say", say: "Yes. What number feels right to you?", why: "commit, then ask" },
  4: { action: "say", say: "Four thousand works if we keep the hotel under half.", why: "agree with a guardrail" },
  5: { action: "say", say: "Deal. I'll book the car by Friday.", why: "own a concrete next step" },
};

export class ScriptedCoach implements CoachProvider {
  async decide(ctx: CoachContext, _signal?: AbortSignal): Promise<CoachDecision> {
    const d = SCRIPTED[ctx.turnIndex] ?? { action: "wait" as const, why: "nothing to add" };
    return { ...d, reactingTo: ctx.theirLine, source: "script" };
  }
}
