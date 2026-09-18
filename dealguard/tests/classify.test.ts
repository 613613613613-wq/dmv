import { describe, expect, it } from "vitest";
import { classifyAssertion, classifyUtterance, isQuestion } from "../src/engine/classify";

describe("classifyUtterance", () => {
  it("treats pleasantries as chatter", () => {
    for (const s of ["Good morning!", "Thanks so much", "Can you hear me?", "How was your weekend", "Sounds good.", "One sec, let me pull that up"]) {
      expect(classifyUtterance(s), s).toBe("chatter");
    }
  });
  it("detects questions", () => {
    expect(isQuestion("What was the deposit again?")).toBe(true);
    expect(isQuestion("remind me where we landed on the inspection period")).toBe(true);
    expect(isQuestion("the deposit was 500, right")).toBe(true);
    expect(classifyUtterance("Did we settle the closing date")).toBe("question");
  });
  it("detects assertions", () => {
    expect(classifyUtterance("We agreed to $12M last week.")).toBe("assertion");
    expect(classifyUtterance("We need 30 days of diligence.")).toBe("assertion");
  });
});

describe("classifyAssertion", () => {
  it("types offers, concessions, rejections, agreements", () => {
    expect(classifyAssertion("We're proposing $14.4M.", "COUNTERPARTY")).toBe("OFFER");
    expect(classifyAssertion("Fine, we can live with 21 days.", "COUNTERPARTY")).toBe("CONCESSION");
    expect(classifyAssertion("We can go up to $14.4M.", "USER")).toBe("CONCESSION");
    expect(classifyAssertion("That's not acceptable, we're firm at 500.", "COUNTERPARTY")).toBe("REJECTION");
    expect(classifyAssertion("We have a deal.", "COUNTERPARTY")).toBe("AGREEMENT");
    expect(classifyAssertion("We agreed to $12M last week.", "COUNTERPARTY")).toBe("OFFER");
    expect(classifyAssertion("Can we do 30 days?", "COUNTERPARTY")).toBe("QUESTION");
  });
  it("lets the later clause win when a rejection is followed by a concession", () => {
    expect(classifyAssertion("We can't do 12, but we can do 12.5.", "COUNTERPARTY")).toBe("CONCESSION");
  });
});
