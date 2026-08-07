import { describe, expect, it } from "vitest";
import { formatDecimal, formatPercent, formatWon, profitLabel } from "@/lib/format";

describe("financial presentation", () => {
  it("formats values larger than JavaScript safe integers without precision loss", () => {
    expect(formatWon("12345678901234567890")).toBe("12,345,678,901,234,567,890원");
  });

  it("rounds fractional won only at the display boundary", () => {
    expect(formatWon("120.5")).toBe("121원");
    expect(formatDecimal("120.5", 2)).toBe("120.50");
  });

  it("keeps unavailable ratios distinct from zero", () => {
    expect(formatPercent(null)).toBe("-");
    expect(formatPercent("0")).toBe("0.00%");
  });

  it("labels gains and losses with text as well as a sign", () => {
    expect(profitLabel("1500")).toEqual({ kind: "positive", text: "이익 +1,500원" });
    expect(profitLabel("-500")).toEqual({ kind: "negative", text: "손실 -500원" });
  });
});
