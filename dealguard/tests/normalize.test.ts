import { describe, expect, it } from "vitest";
import { approxEqual, digitize, extractDays, extractMoney, extractPercent, extractRatio, formatValue, parseTermValue } from "../src/engine/normalize";

describe("digitize", () => {
  it("turns word numbers into digits", () => {
    expect(digitize("twelve million")).toBe("12 million");
    expect(digitize("twelve and a half million")).toBe("12.5 million");
    expect(digitize("twenty one days")).toBe("21 days");
    expect(digitize("fourteen point two five million")).toBe("14.25 million");
  });
});

describe("extractMoney", () => {
  it("parses common spoken and written forms", () => {
    expect(extractMoney("we agreed to $12M last week").map((v) => v.value)).toEqual([12_000_000]);
    expect(extractMoney("call it 14.25 million dollars").map((v) => v.value)).toEqual([14_250_000]);
    expect(extractMoney("$14,250,000 is the number")[0].value).toBe(14_250_000);
    expect(extractMoney("five hundred thousand deposit")[0].value).toBe(500_000);
    expect(extractMoney("a 500k deposit")[0].value).toBe(500_000);
    expect(extractMoney("$1.2B portfolio")[0].value).toBe(1_200_000_000);
  });
  it("does not treat bare numbers or I'm as money", () => {
    expect(extractMoney("I'm going to need 21 days")).toEqual([]);
    expect(extractMoney("we have 3 buildings")).toEqual([]);
  });
});

describe("extractDays / percent / ratio", () => {
  it("normalizes weeks and months to days", () => {
    expect(extractDays("three weeks of diligence")[0].value).toBe(21);
    expect(extractDays("two months to close")[0].value).toBe(60);
    expect(extractDays("21 calendar days")[0].value).toBe(21);
    expect(extractDays("a 30-day inspection")[0].value).toBe(30);
  });
  it("parses percent and bps", () => {
    expect(extractPercent("a 6.5 percent cap")[0].value).toBe(6.5);
    expect(extractPercent("25 bps wider")[0].value).toBe(0.25);
  });
  it("parses ratios", () => {
    expect(extractRatio("1.2x coverage")[0].value).toBe(1.2);
  });
});

describe("parseTermValue / formatValue", () => {
  it("round-trips canonical field values", () => {
    expect(parseTermValue("$14,250,000", "USD")).toBe(14_250_000);
    expect(parseTermValue("21 calendar days", "days")).toBe(21);
    expect(parseTermValue("6.25%", "percent")).toBe(6.25);
    expect(parseTermValue("1.25x", "ratio")).toBe(1.25);
    expect(parseTermValue("Rooftop lease excluded", "text")).toBeNull();
  });
  it("formats compactly for a 12-word headline", () => {
    expect(formatValue(14_250_000, "USD")).toBe("$14.25M");
    expect(formatValue(500_000, "USD")).toBe("$500,000");
    expect(formatValue(21, "days")).toBe("21 days");
    expect(formatValue(1, "days")).toBe("1 day");
    expect(formatValue(6.25, "percent")).toBe("6.25%");
    expect(formatValue(1.25, "ratio")).toBe("1.25x");
  });
  it("approxEqual tolerates rounding but not real differences", () => {
    expect(approxEqual(12_500_000, 12_500_000.4)).toBe(true);
    expect(approxEqual(12_000_000, 12_500_000)).toBe(false);
    expect(approxEqual(21, 20)).toBe(false);
  });
});
