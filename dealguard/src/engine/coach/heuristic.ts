import { clampHeadline } from "../gating";
import { isQuestion } from "../classify";
import type { CoachContext, CoachDecision, CoachProvider } from "./types";

const FEELING = /\b(i feel|i'm (?:tired|upset|frustrated|annoyed|hurt|worried|stressed|exhausted|angry|disappointed|scared|overwhelmed)|always|never|every time|the only one|you don't|you never|you always|sick of|fed up|can't believe)\b/i;
const TRAILING = /\b(and|but|so|because|like|um|uh|which|that)\W*$/i;
const DECISION_ASK = /\b(can we|could we|let's|shall we|agree|decide|book|commit|promise|deal\??|by (?:friday|monday|tonight|tomorrow|next week))\b/i;

/**
 * Offline coach. Deliberately modest: it never invents content, it only
 * shapes *how* to respond (answer, acknowledge, wait) based on the surface
 * form of what was just said. Used when no LLM key is configured.
 */
export class HeuristicCoach implements CoachProvider {
  async decide(ctx: CoachContext, _signal?: AbortSignal): Promise<CoachDecision> {
    const t = ctx.theirLine.trim();
    const base = { reactingTo: t, source: "heuristic" as const };
    if (!t) return { action: "wait", ...base };
    // Mid-thought: let them finish.
    if (TRAILING.test(t) || t.split(" ").length < 3) return { action: "wait", why: "let them finish", ...base };
    if (FEELING.test(t)) return { action: "say", say: clampHeadline("That sounds hard. Tell me more about that."), why: "acknowledge first", ...base };
    if (DECISION_ASK.test(t) && isQuestion(t)) return { action: "say", say: clampHeadline("Yes. What would make that work for you?"), why: "commit, then ask", ...base };
    if (isQuestion(t)) return { action: "say", say: clampHeadline("Answer that plainly, then ask what they'd prefer."), why: "they asked", ...base };
    if (DECISION_ASK.test(t)) return { action: "say", say: clampHeadline("Let's agree on that now. What's your number?"), why: "close the loop", ...base };
    return { action: "wait", why: "nothing to add yet", ...base };
  }
}
