import { describe, expect, it } from "vitest";
import { calendarDisclaimer, consentRequirement, disclosureScript, US_JURISDICTIONS } from "../src/engine/compliance/consent";

describe("consent guardrails", () => {
  it("lists every US state plus DC and international", () => {
    expect(US_JURISDICTIONS.length).toBe(52);
    expect(US_JURISDICTIONS.find((j) => j.code === "FL")?.statute).toBe("Fla. Stat. § 934.03");
    expect(US_JURISDICTIONS.find((j) => j.code === "CA")?.statute).toBe("Cal. Penal Code § 632");
  });
  it("applies the strictest rule across participants", () => {
    expect(consentRequirement(["NY", "TX"]).allParty).toBe(false);
    const r = consentRequirement(["NY", "FL"]);
    expect(r.allParty).toBe(true);
    expect(r.jurisdictions.map((j) => j.code)).toEqual(["FL"]);
  });
  it("assumes all-party consent when the jurisdiction is unknown", () => {
    expect(consentRequirement([]).allParty).toBe(true);
    expect(consentRequirement(["INTL"]).allParty).toBe(true);
  });
  it("produces disclosure copy that names the product", () => {
    expect(disclosureScript("Deal Guard")).toMatch(/Deal Guard/);
    expect(calendarDisclaimer("Deal Guard")).toMatch(/never stored/);
  });
});
