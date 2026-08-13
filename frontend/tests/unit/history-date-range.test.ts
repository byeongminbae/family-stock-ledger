import { describe, expect, it } from "vitest";

import { periodRange } from "@/components/trades/history-date-range";

describe("history date range presets", () => {
  it("uses the current KST day for daily, monthly, and seven-day ranges", () => {
    const now = new Date("2026-08-08T15:30:00.000Z");

    expect(periodRange("당일", now)).toEqual({ from: "2026-08-09", to: "2026-08-09" });
    expect(periodRange("당월", now)).toEqual({ from: "2026-08-01", to: "2026-08-09" });
    expect(periodRange("1주일", now)).toEqual({ from: "2026-08-03", to: "2026-08-09" });
  });

  it("clamps calendar-month and calendar-year subtraction at month end", () => {
    expect(periodRange("1개월", new Date("2026-03-31T03:00:00.000Z"))).toEqual({
      from: "2026-02-28",
      to: "2026-03-31",
    });
    expect(periodRange("1년", new Date("2024-02-29T03:00:00.000Z"))).toEqual({
      from: "2023-02-28",
      to: "2024-02-29",
    });
  });
});
