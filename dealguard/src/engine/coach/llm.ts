import { clampHeadline } from "../gating";
import { guardText } from "../advisor/guard";
import type { LlmConfig } from "../advisor/llm";
import { DEFAULT_MODELS } from "../advisor/llm";
import type { CoachContext, CoachDecision, CoachProvider } from "./types";
import { HeuristicCoach } from "./heuristic";

export function buildCoachPrompt(ctx: CoachContext): { system: string; user: string } {
  const c = ctx.conversation;
  const facts = c.facts.filter(Boolean).map((f) => `- ${f}`).join("\n") || "(none given)";
  const transcript = ctx.recent.map((l) => `${l.speaker === "USER" ? "ME" : "THEM"}: ${l.text}`).join("\n") || "(start)";
  return {
    system: [
      "You are a discreet real-time coach whispering to ONE person (ME) during a live conversation.",
      "At the end of each of THEIR turns you decide whether ME should respond now, and if so, what to say.",
      'Reply with ONLY a JSON object: {"action":"say"|"wait","say":"...","why":"..."}.',
      "Rules:",
      "1. \"say\" is at most 12 words, in ME's own voice, ready to speak aloud. No quotes, no options, no preamble.",
      "2. \"why\" is at most 8 words.",
      "3. Choose \"wait\" when THEY are mid-thought, venting, or asked nothing — silence is often the best move.",
      "4. Never invent facts, numbers, dates or promises that are not in GOAL, FACTS or the TRANSCRIPT.",
      "5. Acknowledge feelings before making a point. Prefer a question over a push.",
      `6. Tone: ${c.tone}. Relationship: ${c.counterpart || "unspecified"}.`,
    ].join("\n"),
    user: `GOAL (in ME's words):\n${c.goal}\n\nFACTS:\n${facts}\n\nTRANSCRIPT (last 90 s):\n${transcript}\n\nTHEY JUST SAID:\n${ctx.theirLine}\n\nJSON:`,
  };
}

async function callModel(cfg: LlmConfig, p: { system: string; user: string }, signal: AbortSignal): Promise<string> {
  const f = cfg.fetchFn ?? fetch;
  if (cfg.provider === "gemini") {
    const model = cfg.model ?? DEFAULT_MODELS.gemini;
    const res = await f(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-goog-api-key": cfg.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: p.system }] },
        contents: [{ role: "user", parts: [{ text: p.user }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 120, responseMimeType: "application/json" },
      }),
      signal,
    });
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return json.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
  }
  const model = cfg.model ?? DEFAULT_MODELS.groq;
  const res = await f("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: 120,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: p.system },
        { role: "user", content: p.user },
      ],
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const json = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  return json.choices?.[0]?.message?.content ?? "";
}

/** Tolerant JSON extraction: models sometimes wrap JSON in prose or fences. */
export function parseCoachJson(raw: string): { action?: string; say?: string; why?: string } | null {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) return null;
  try {
    const o = JSON.parse(m[0]) as Record<string, unknown>;
    return { action: typeof o.action === "string" ? o.action : undefined, say: typeof o.say === "string" ? o.say : undefined, why: typeof o.why === "string" ? o.why : undefined };
  } catch {
    return null;
  }
}

/**
 * LLM-backed coach with the same no-hallucination discipline as the deal
 * advisor: any number in the suggestion must already exist in the goal, the
 * facts or the transcript. Falls back to the heuristic coach on any failure.
 */
export class LlmCoach implements CoachProvider {
  private readonly fallback: CoachProvider = new HeuristicCoach();
  constructor(private readonly cfg: LlmConfig) {}

  async decide(ctx: CoachContext, signal: AbortSignal): Promise<CoachDecision> {
    if (this.cfg.provider === "none" || !this.cfg.apiKey) return this.fallback.decide(ctx, signal);
    try {
      const raw = await callModel(this.cfg, buildCoachPrompt(ctx), signal);
      const parsed = parseCoachJson(raw);
      if (!parsed) return this.fallback.decide(ctx, signal);
      const reactingTo = ctx.theirLine;
      if (parsed.action !== "say" || !parsed.say?.trim()) return { action: "wait", why: parsed.why?.slice(0, 60), reactingTo, source: "llm" };
      const say = clampHeadline(parsed.say.replace(/^["'“”\s]+|["'“”\s]+$/g, ""));
      const allowedContext = [ctx.conversation.goal, ...ctx.conversation.facts, ...ctx.recent.map((l) => l.text), ctx.theirLine];
      if (!guardText(say, [], allowedContext).ok) return this.fallback.decide(ctx, signal);
      return { action: "say", say, why: parsed.why?.slice(0, 60), reactingTo, source: "llm" };
    } catch {
      return this.fallback.decide(ctx, signal);
    }
  }
}
