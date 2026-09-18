import { clampHeadline } from "../gating";
import { guardText } from "./guard";
import { deterministicTalkingPoint, type AdviceContext, type CueDraft } from "./templates";

export type LlmProvider = "none" | "gemini" | "groq";

export interface LlmConfig {
  provider: LlmProvider;
  apiKey: string;
  /** Override model ids if needed. */
  model?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export const DEFAULT_MODELS: Record<Exclude<LlmProvider, "none">, string> = {
  gemini: "gemini-2.5-flash",
  groq: "llama-3.3-70b-versatile",
};

export function buildPrompt(ctx: AdviceContext): { system: string; user: string } {
  const facts = ctx.deal.terms
    .map((t) => `- ${t.fieldName} = ${t.fieldValue} [${t.status}${t.status === "internal_confidential" ? ", NEVER suggest disclosing" : ""}] (${t.sourceDoc}, ${t.sourceDate})`)
    .join("\n");
  const transcript = ctx.recentLines.map((l) => `${l.speaker === "USER" ? "ME" : "THEM"}: ${l.text}`).join("\n");
  const concessions = ctx.ledger
    .filter((e) => e.assertionType === "CONCESSION" || e.assertionType === "AGREEMENT")
    .slice(-5)
    .map((e) => `- ${e.speaker}: ${e.verbatimText}`)
    .join("\n");
  return {
    system: [
      "You are a silent negotiation coach whispering ONE line to a dealmaker mid-call.",
      "Rules:",
      "1. Reply with a single talking point of at most 12 words. No preamble, no quotes, no markdown.",
      "2. Use ONLY figures that appear verbatim in FACTS or TRANSCRIPT. Never invent or round a number.",
      "3. Never suggest revealing anything marked internal_confidential.",
      "4. Prefer a question or a hold over a concession.",
    ].join("\n"),
    user: `FACTS:\n${facts}\n\nRECENT CONCESSIONS:\n${concessions || "(none)"}\n\nTRANSCRIPT (last 30s):\n${transcript || "(silence)"}\n\nTalking point:`,
  };
}

async function callGemini(cfg: LlmConfig, p: { system: string; user: string }, signal: AbortSignal): Promise<string> {
  const model = cfg.model ?? DEFAULT_MODELS.gemini;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const res = await (cfg.fetchFn ?? fetch)(url, {
    method: "POST",
    headers: { "content-type": "application/json", "x-goog-api-key": cfg.apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: p.system }] },
      contents: [{ role: "user", parts: [{ text: p.user }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 40 },
    }),
    signal,
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const json = (await res.json()) as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  return json.candidates?.[0]?.content?.parts?.map((x) => x.text ?? "").join("") ?? "";
}

async function callGroq(cfg: LlmConfig, p: { system: string; user: string }, signal: AbortSignal): Promise<string> {
  const model = cfg.model ?? DEFAULT_MODELS.groq;
  const res = await (cfg.fetchFn ?? fetch)("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${cfg.apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_tokens: 40,
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

export function sanitizeLlmLine(raw: string): string {
  const first = raw
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0) ?? "";
  return clampHeadline(first.replace(/^["'“”*\-•\s]+|["'“”*\s]+$/g, ""));
}

export interface AdvisorResult {
  cue: CueDraft;
  source: "llm" | "template";
  /** Set when the LLM answered but the guard rejected it. */
  rejected?: { text: string; offending: number[] };
  error?: string;
}

/**
 * "Help Now": ask the model, run the guard, fall back to the template.
 * Always resolves — the HUD never waits on a failed network call.
 */
export class Advisor {
  constructor(private cfg: LlmConfig) {}

  configure(cfg: LlmConfig): void {
    this.cfg = cfg;
  }

  async helpNow(ctx: AdviceContext): Promise<AdvisorResult> {
    const fallback = deterministicTalkingPoint(ctx);
    if (this.cfg.provider === "none" || !this.cfg.apiKey) return { cue: fallback, source: "template" };

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.cfg.timeoutMs ?? 2_500);
    try {
      const prompt = buildPrompt(ctx);
      const raw = this.cfg.provider === "gemini" ? await callGemini(this.cfg, prompt, controller.signal) : await callGroq(this.cfg, prompt, controller.signal);
      const line = sanitizeLlmLine(raw);
      if (!line) return { cue: fallback, source: "template", error: "empty model reply" };
      const g = guardText(
        line,
        ctx.deal.terms,
        ctx.recentLines.map((l) => l.text),
      );
      if (!g.ok) return { cue: fallback, source: "template", rejected: { text: line, offending: g.offending } };
      return {
        cue: { tier: 3, kind: "TALKING_POINT", headline: line, source: `${this.cfg.provider} · guarded against vault`, topic: fallback.topic, termId: fallback.termId },
        source: "llm",
      };
    } catch (e) {
      return { cue: fallback, source: "template", error: e instanceof Error ? e.message : String(e) };
    } finally {
      clearTimeout(timer);
    }
  }
}
