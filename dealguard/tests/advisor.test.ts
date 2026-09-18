import { describe, expect, it } from "vitest";
import { Advisor, buildPrompt, sanitizeLlmLine } from "../src/engine/advisor/llm";
import { guardText, numericTokens } from "../src/engine/advisor/guard";
import { deterministicTalkingPoint } from "../src/engine/advisor/templates";
import { makeDemoDeal } from "../src/engine/demoDeal";

const deal = makeDemoDeal();

describe("hallucination guard", () => {
  it("extracts numbers including scaled forms", () => {
    expect(numericTokens("hold at $14.25M and 21 days")).toEqual([14.25, 14_250_000, 21]);
  });
  it("accepts text whose figures are all in the vault or transcript", () => {
    const g = guardText("Hold price at $14.25M; offer 21 days.", deal.terms, []);
    expect(g.ok).toBe(true);
  });
  it("rejects invented figures", () => {
    const g = guardText("Counter at $13.9M and ask for 25 days.", deal.terms, []);
    expect(g.ok).toBe(false);
    expect(g.offending).toContain(13.9);
    expect(g.offending).toContain(25);
  });
  it("allows figures the counterparty just said", () => {
    const g = guardText("Ask what the $15 million is based on.", deal.terms, ["we would need you at fifteen million"]);
    expect(g.ok).toBe(true);
  });
});

describe("deterministicTalkingPoint", () => {
  it("anchors on a term from the last 30 seconds", () => {
    const cue = deterministicTalkingPoint({ deal, ledger: [], recentLines: [{ offsetMs: 0, speaker: "COUNTERPARTY", text: "we need to talk about the deposit" }] });
    expect(cue.kind).toBe("TALKING_POINT");
    expect(cue.headline).toContain("$500,000");
    expect(cue.headline.split(" ").length).toBeLessThanOrEqual(12);
  });
  it("tells the user to hold a hard cap rather than trade it", () => {
    const cue = deterministicTalkingPoint({ deal, ledger: [], recentLines: [{ offsetMs: 0, speaker: "COUNTERPARTY", text: "the inspection period needs to shrink" }] });
    expect(cue.headline).toMatch(/Hold inspection window at 21 calendar days/);
  });
  it("asks for the basis of an unattributed figure", () => {
    const cue = deterministicTalkingPoint({ deal, ledger: [], recentLines: [{ offsetMs: 0, speaker: "COUNTERPARTY", text: "we think 8 percent is market" }] });
    expect(cue.headline).toMatch(/8 percent/);
  });
  it("falls back to a neutral move with no numbers", () => {
    const cue = deterministicTalkingPoint({ deal, ledger: [], recentLines: [] });
    expect(cue.headline).not.toMatch(/\d/);
  });
});

describe("Advisor", () => {
  const ctx = { deal, ledger: [], recentLines: [{ offsetMs: 0, speaker: "COUNTERPARTY" as const, text: "we would need you at fifteen million" }] };

  it("uses the template when no provider is configured", async () => {
    const a = new Advisor({ provider: "none", apiKey: "" });
    const r = await a.helpNow(ctx);
    expect(r.source).toBe("template");
  });

  it("accepts a guarded LLM line", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ choices: [{ message: { content: "Ask what drives the fifteen million before you move." } }] }), { status: 200 })) as typeof fetch;
    const a = new Advisor({ provider: "groq", apiKey: "k", fetchFn });
    const r = await a.helpNow(ctx);
    expect(r.source).toBe("llm");
    expect(r.cue.headline).toBe("Ask what drives the fifteen million before you move.");
  });

  it("rejects an LLM line with an invented number and falls back", async () => {
    const fetchFn = (async () =>
      new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: "Counter at $14.9M and close in 75 days." }] } }] }), { status: 200 })) as typeof fetch;
    const a = new Advisor({ provider: "gemini", apiKey: "k", fetchFn });
    const r = await a.helpNow(ctx);
    expect(r.source).toBe("template");
    expect(r.rejected?.offending).toContain(75);
  });

  it("falls back on network failure and never throws", async () => {
    const fetchFn = (async () => new Response("nope", { status: 500 })) as typeof fetch;
    const a = new Advisor({ provider: "gemini", apiKey: "k", fetchFn });
    const r = await a.helpNow(ctx);
    expect(r.source).toBe("template");
    expect(r.error).toMatch(/500/);
  });

  it("builds a prompt that marks confidential terms", () => {
    const p = buildPrompt(ctx);
    expect(p.user).toMatch(/cap_rate = \[withheld\] \[internal_confidential/);
    expect(p.user).not.toContain("6.25");
    expect(p.system).toMatch(/at most 12 words/);
  });

  it("sanitizes model output to one clamped line", () => {
    expect(sanitizeLlmLine('  "Hold the line."\nSecond line')).toBe("Hold the line.");
    expect(sanitizeLlmLine("one two three four five six seven eight nine ten eleven twelve thirteen fourteen").split(" ").length).toBe(12);
  });
});
