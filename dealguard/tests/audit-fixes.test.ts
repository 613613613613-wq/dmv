import { describe, expect, it } from "vitest";
import { Advisor, disclosureSafe } from "../src/engine/advisor/llm";
import { guardText } from "../src/engine/advisor/guard";
import { StreamingResampler } from "../src/engine/audio/chunker";
import { applyEntitlements, applyPurchase, initialUsage } from "../src/engine/billing/entitlements";
import { PRODUCT_IDS } from "../src/engine/billing/plans";
import { buildCompanionUrl, isPrivateHost, parseHudMessage, validateHost } from "../src/engine/companion/protocol";
import { DEMO_TERMS, makeDemoDeal } from "../src/engine/demoDeal";
import { gate } from "../src/engine/gating";
import { memorandumToMarkdown, buildMemorandum } from "../src/engine/memorandum";
import { approxEqual, digitize, extractMoney, extractScaledBare, parseTermValue } from "../src/engine/normalize";
import { SpeakerMap } from "../src/engine/stt/deepgram";
import { defaultBoundary } from "../src/ui/views/DealEditorView";

const deal = makeDemoDeal();

describe("audit: dates and comma values", () => {
  it("does not read an ordinal date as a dollar figure", () => {
    expect(extractScaledBare("we need to close by the 15th", 14_500_000)).toEqual([]);
    expect(gate({ text: "We need to close by the 15th.", speaker: "COUNTERPARTY", terms: DEMO_TERMS }).tier).toBeNull();
    expect(gate({ text: "Can we get to the 15th?", speaker: "COUNTERPARTY", terms: DEMO_TERMS }).tier).toBeNull();
    expect(gate({ text: "Let's aim for the 3 pm slot.", speaker: "USER", terms: DEMO_TERMS }).cue).toBeUndefined();
  });
  it("parses USD term values typed without a $ or scale word", () => {
    expect(parseTermValue("14,500,000", "USD")).toBe(14_500_000);
    expect(parseTermValue("USD 12,500,000", "USD")).toBe(12_500_000);
    expect(parseTermValue("$14,500,000", "USD")).toBe(14_500_000);
  });
  it("collapses 'five hundred and two thousand'", () => {
    expect(digitize("five hundred and two thousand")).toBe("502 thousand");
    expect(extractMoney("five hundred and two thousand dollars")[0].value).toBe(502_000);
  });
  it("catches a $50k slip on an agreed $14.25M price", () => {
    expect(approxEqual(14_250_000, 14_300_000)).toBe(false);
    expect(approxEqual(14_250_000, 14_250_000.4)).toBe(true);
    const d = gate({ text: "We agreed to fourteen point three million on the price.", speaker: "COUNTERPARTY", terms: DEMO_TERMS });
    expect(d.tier).toBe(1);
  });
});

describe("audit: confidential values never reach the HUD via the model", () => {
  it("guard rejects a confidential figure even though it is in the vault", () => {
    expect(guardText("Mention your 6.25% cap to build trust.", deal.terms, []).ok).toBe(false);
    expect(guardText("Mention your 6.25% cap to build trust.", deal.terms, ["we are at 6.25 percent"]).ok).toBe(true); // already spoken aloud
  });
  it("textual guard blocks disclosure verbs paired with a confidential term", () => {
    expect(disclosureSafe("Share your cap rate to build trust.", deal.terms)).toBe(false);
    expect(disclosureSafe("Ask what their underwriting assumes instead.", deal.terms)).toBe(true);
    expect(disclosureSafe("Hold the deposit at $500,000.", deal.terms)).toBe(true);
  });
  it("advisor falls back to the template when the model suggests disclosing", async () => {
    const fetchFn = (async () => new Response(JSON.stringify({ choices: [{ message: { content: "Tell them your cap rate is conservative." } }] }), { status: 200 })) as typeof fetch;
    const a = new Advisor({ provider: "groq", apiKey: "k", fetchFn });
    const r = await a.helpNow({ deal, ledger: [], recentLines: [{ offsetMs: 0, speaker: "COUNTERPARTY", text: "what cap rate are you at" }] });
    expect(r.source).toBe("template");
    expect(r.cue.headline).not.toMatch(/6\.25/);
  });
});

describe("audit: companion is LAN-only and bounded", () => {
  it("accepts private hosts only", () => {
    for (const h of ["192.168.1.20", "10.0.0.5", "172.16.4.4", "172.31.255.1", "169.254.1.1", "127.0.0.1", "localhost", "my-mac.local"]) expect(isPrivateHost(h), h).toBe(true);
    for (const h of ["8.8.8.8", "172.32.0.1", "example.com", "evil.example", "300.1.1.1", "1.2.3"]) expect(isPrivateHost(h), h).toBe(false);
    expect(validateHost("ws://192.168.0.9:8765/hud")).toBe("192.168.0.9");
    expect(buildCompanionUrl("192.168.0.9")).toBe("ws://192.168.0.9:8765/hud");
    expect(buildCompanionUrl("example.com")).toBeNull();
    expect(buildCompanionUrl("192.168.0.9", 70000)).toBeNull();
  });
  it("clamps ttl and bounds ids", () => {
    const m = parseHudMessage(JSON.stringify({ type: "cue", id: "x".repeat(500), tier: 1, kind: "RED_FLAG", headline: "h", source: "s", topic: "t".repeat(500), ttlMs: 9_999_999 }));
    expect(m && m.type === "cue" && m.id.length).toBe(64);
    expect(m && m.type === "cue" && m.topic.length).toBe(64);
    expect(m && m.type === "cue" && m.ttlMs).toBe(120_000);
    const low = parseHudMessage(JSON.stringify({ type: "cue", id: "a", tier: 1, kind: "RED_FLAG", headline: "h", source: "s", ttlMs: 5 }));
    expect(low && low.type === "cue" && low.ttlMs).toBe(1_000);
  });
});

describe("audit: store is the source of truth for subscriptions", () => {
  const sep1 = new Date("2026-09-01T00:00:00Z");
  it("keeps a renewing subscriber on their plan past the local expiry", () => {
    let u = applyPurchase(initialUsage(sep1), PRODUCT_IDS.dealmakerMonthly, sep1);
    const oct5 = new Date("2026-10-05T00:00:00Z");
    u = applyEntitlements(u, { entitlements: ["dealmaker"], expiresAt: "2026-11-01T00:00:00Z" }, oct5);
    expect(u.planId).toBe("dealmaker");
    expect(u.planExpiresAt).toBe("2026-11-01T00:00:00Z");
  });
  it("downgrades a refunded / cancelled subscriber", () => {
    const u = applyPurchase(initialUsage(sep1), PRODUCT_IDS.principalAnnual, sep1);
    const next = applyEntitlements(u, { entitlements: [], expiresAt: null }, sep1);
    expect(next.planId).toBe("trial");
  });
  it("leaves a trial user alone", () => {
    const u = initialUsage(sep1);
    expect(applyEntitlements(u, { entitlements: [], expiresAt: null }, sep1)).toEqual(u);
  });
});

describe("audit: audio and speaker calibration", () => {
  it("streaming resampler loses nothing across 128-sample quanta", () => {
    const r = new StreamingResampler(48_000);
    let total = 0;
    for (let i = 0; i < 375; i++) total += r.process(new Float32Array(128)).length; // 1 s of 48 kHz audio
    expect(total).toBeGreaterThanOrEqual(15_990);
    expect(total).toBeLessThanOrEqual(16_010);
  });
  it("only a final result may calibrate the user's voice", () => {
    const m = new SpeakerMap(null, true);
    expect(m.resolve(1, "COUNTERPARTY", false)).toBe("COUNTERPARTY");
    expect(m.calibrated).toBe(false);
    expect(m.resolve(1, "COUNTERPARTY", true)).toBe("USER");
    m.recalibrate(0);
    expect(m.resolve(0, "COUNTERPARTY")).toBe("USER");
  });
});

describe("audit: editor defaults and memo footer", () => {
  it("derives boundary direction from side and unit", () => {
    expect(defaultBoundary("buyer", "walk_away_price", "USD")).toBe("max");
    expect(defaultBoundary("seller", "walk_away_price", "USD")).toBe("min");
    expect(defaultBoundary("buyer", "inspection_window", "days")).toBe("min");
    expect(defaultBoundary("seller", "inspection_window", "days")).toBe("max");
    expect(defaultBoundary("lender", "dscr", "ratio")).toBe("min");
    expect(defaultBoundary("buyer", "exclusions", "text")).toBe("exact");
  });
  it("memorandum ends with a verification disclaimer", () => {
    const md = memorandumToMarkdown(buildMemorandum({ deal, ledger: [], transcript: [], durationMs: 1000, redFlags: 0, factCards: 0 }));
    expect(md).toMatch(/not legal, financial or investment advice/);
  });
});
