import { describe, expect, it } from "vitest";
import { gate } from "../src/engine/gating";
import { DEMO_TERMS } from "../src/engine/demoDeal";
import type { Speaker } from "../src/engine/types";

const terms = DEMO_TERMS;
const run = (text: string, speaker: Speaker = "COUNTERPARTY") => gate({ text, speaker, terms });

/**
 * Phase 2 gate — The Accuracy Test.
 * 20 adversarial negotiation lines. Threshold: 100% detection of direct
 * contradictions of a deal term (Tier 1).
 */
const ADVERSARIAL: Array<[string, Speaker, string]> = [
  ["We agreed to $12M last week.", "COUNTERPARTY", "purchase_price"],
  ["You said the price was fourteen million.", "COUNTERPARTY", "purchase_price"],
  ["Per the PSA the purchase price is $14.5 million.", "COUNTERPARTY", "purchase_price"],
  ["The deposit we discussed was $250,000.", "COUNTERPARTY", "earnest_deposit"],
  ["As agreed, earnest money is four hundred thousand dollars.", "COUNTERPARTY", "earnest_deposit"],
  ["Last time you committed to a $600k deposit.", "COUNTERPARTY", "earnest_deposit"],
  ["We'll need you at $15 million to get this done.", "COUNTERPARTY", "walk_away_price"],
  ["Our number is 14.75 million, take it or leave it.", "COUNTERPARTY", "walk_away_price"],
  ["Okay, we can go up to $14.6M.", "USER", "walk_away_price"],
  ["I can stretch to fifteen million if you close in 60 days.", "USER", "walk_away_price"],
  ["Inspection has to be 10 days, that's firm.", "COUNTERPARTY", "inspection_window"],
  ["We can only give you two weeks of due diligence.", "COUNTERPARTY", "inspection_window"],
  ["Fine, we'll accept a 14-day inspection period.", "USER", "inspection_window"],
  ["You agreed to a 15 day inspection window on the last call.", "COUNTERPARTY", "inspection_window"],
  ["The lender said DSCR at 1.15x works.", "COUNTERPARTY", "dscr"],
  ["We could live with 1.1x coverage on the loan.", "USER", "dscr"],
  ["Our going-in cap rate is 6.25%.", "USER", "cap_rate"],
  ["The term sheet has the inspection period at 30 days, not 21.", "COUNTERPARTY", "inspection_window"],
  ["We settled on a $14.1M purchase price, remember?", "COUNTERPARTY", "purchase_price"],
  ["The PSA says the earnest deposit is $450,000.", "COUNTERPARTY", "earnest_deposit"],
];

/** Small talk and neutral lines: zero unsolicited cards. */
const SMALL_TALK: string[] = [
  "Good morning, thanks for making time.",
  "How was the weekend? We finally got some rain.",
  "Can you hear me okay? You were breaking up.",
  "Let me share my screen real quick.",
  "Great, sounds good.",
  "Our kids are back in school so the mornings are chaos.",
  "I'll send the redline over after this.",
  "Appreciate you jumping on.",
  "Hold on, someone's at the door.",
  "Perfect, talk soon.",
  "The weather in Miami has been brutal.",
  "Did you catch the game last night?",
  "I think we're broadly aligned on the approach here.",
  "Let's circle back with the attorneys on the language.",
  "We have three buildings on the site tour tomorrow.",
];

/** Consistent statements: touch a term but match the record — stay silent. */
const CONSISTENT: Array<[string, Speaker]> = [
  ["The purchase price is $14,250,000 as in the PSA.", "COUNTERPARTY"],
  ["Earnest money is five hundred thousand.", "USER"],
  ["We need our 21 calendar days of inspection.", "USER"],
  ["We're comfortable at 1.3x DSCR.", "COUNTERPARTY"],
  ["Purchase price stays at 14.25 million.", "USER"],
];

describe("Phase 2 accuracy test — Tier 1 detection", () => {
  it.each(ADVERSARIAL)("flags %j", (text, speaker, topic) => {
    const d = run(text, speaker);
    expect(d.tier, d.reason).toBe(1);
    expect(d.term?.fieldName).toBe(topic);
    expect(d.cue).toBeDefined();
    expect(d.cue!.headline.split(" ").length).toBeLessThanOrEqual(12);
    expect(d.cue!.source).toMatch(/\.(pdf|xlsx|docx) · \d{4}-\d{2}-\d{2}$/);
  });

  it("detects 100% of the adversarial set", () => {
    const hits = ADVERSARIAL.filter(([t, s]) => run(t, s).tier === 1).length;
    expect(hits).toBe(ADVERSARIAL.length);
  });
});

describe("Phase 2 accuracy test — false positives", () => {
  it.each(SMALL_TALK)("stays blank on %j", (text) => {
    for (const speaker of ["USER", "COUNTERPARTY"] as Speaker[]) {
      const d = run(text, speaker);
      expect(d.cue, `${speaker}: ${d.reason}`).toBeUndefined();
      expect(d.tier).toBeNull();
    }
  });

  it.each(CONSISTENT)("stays blank on consistent statement %j", (text, speaker) => {
    const d = run(text, speaker);
    expect(d.cue, d.reason).toBeUndefined();
  });
});

describe("Tier 2 fact cards", () => {
  it("answers a question about a known term with the record and its source", () => {
    const d = run("What was the deposit again?", "USER");
    expect(d.tier).toBe(2);
    expect(d.cue!.kind).toBe("FACT_CARD");
    expect(d.cue!.headline).toContain("$500,000");
    expect(d.cue!.source).toBe("PSA_Draft_v3_Clean.pdf · 2026-08-15");
  });

  it("marks a confidential term when the counterparty asks about it", () => {
    const d = run("What cap rate are you underwriting to?", "COUNTERPARTY");
    expect(d.tier).toBe(2);
    expect(d.cue!.kind).toBe("CONFIDENTIAL");
    expect(d.cue!.headline).toMatch(/don't share/);
  });

  it("shows where we stand when the counterparty counters a negotiable term", () => {
    const d = run("We need closing in 60 days.", "COUNTERPARTY");
    expect(d.tier).toBe(2);
    expect(d.cue!.headline).toMatch(/60 days/);
    expect(d.cue!.headline).toMatch(/90 days/);
  });

  it("surfaces the record when someone references it without a figure", () => {
    const d = run("As we discussed, the financing contingency stays as is.", "COUNTERPARTY");
    expect(d.tier).toBe(2);
    expect(d.cue!.headline).toContain("45 days");
  });

  it("reminds the user when they touch a confidential term without a number", () => {
    const d = run("Our cap rate assumption is pretty conservative.", "USER");
    expect(d.tier).toBe(2);
    expect(d.cue!.kind).toBe("CONFIDENTIAL");
  });
});

describe("standby", () => {
  it("logs assertions that touch no deal term without a cue", () => {
    const d = run("We'd want a right of first refusal on the adjacent parcel.", "COUNTERPARTY");
    expect(d.kind).toBe("assertion");
    expect(d.tier).toBeNull();
    expect(d.reason).toBe("no deal term touched");
  });

  it("stays quiet when a figure is inside the boundary", () => {
    expect(run("We can offer 50 days on the financing contingency.", "COUNTERPARTY").tier).toBeNull();
    expect(run("We could do $14.4M.", "COUNTERPARTY").reason).toBe("no deal term touched");
    expect(run("We'll put up a $500k deposit.", "USER").tier).toBeNull();
  });

  it("treats a re-trade of an agreed price as a red flag even when phrased softly", () => {
    const d = run("We could do 14.4 million for the price.", "COUNTERPARTY");
    expect(d.tier).toBe(1);
    expect(d.term?.fieldName).toBe("purchase_price");
  });

  it("scales a bare figure toward the record when position language is present", () => {
    const d = run("Okay, we can go up to fourteen point six.", "USER");
    expect(d.tier).toBe(1);
    expect(d.term?.fieldName).toBe("walk_away_price");
    expect(d.value).toBe(14_600_000);
    expect(run("We could do 14.4 for the price.", "COUNTERPARTY").tier).toBe(1);
    // A bare count with a unit word is never money.
    expect(run("We can do 14 units in the first phase.", "COUNTERPARTY").cue).toBeUndefined();
  });

  it("never lets an unnamed dollar figure trigger anything but a Tier 1", () => {
    expect(run("We raised a $13 million fund last year.", "COUNTERPARTY").cue).toBeUndefined();
    expect(run("We raised a $13 million fund last year.", "USER").cue).toBeUndefined();
  });
});
