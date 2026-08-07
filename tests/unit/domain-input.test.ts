import { describe, expect, it } from "vitest";

import { parseTradeFilters } from "@/lib/domain/history";
import { historyBoundary, toKstInstant } from "@/lib/domain/time";

describe("KST datetime-local conversion", () => {
  it("converts a valid wall clock without depending on the server timezone", () => {
    expect(toKstInstant("2026-08-07T09:30").toISOString()).toBe("2026-08-07T00:30:00.000Z");
  });

  it("rejects calendar rollover dates", () => {
    expect(() => toKstInstant("2026-02-30T09:30")).toThrow("유효한");
  });

  it("turns an inclusive end-minute into an exclusive SQL boundary", () => {
    expect(historyBoundary("2026-08-07T09:30", "end")?.toISOString()).toBe(
      "2026-08-07T00:31:00.000Z",
    );
  });
});

describe("history filters", () => {
  it("preserves exact integer finance filters as strings", () => {
    const filters = parseTradeFilters({
      ownerId: "2",
      quantityMin: "9007199254740993",
      amountMax: "999999999999999999999",
      page: "3",
    });

    expect(filters).toMatchObject({
      ownerId: 2,
      quantityMin: "9007199254740993",
      amountMax: "999999999999999999999",
      page: 3,
    });
  });

  it("drops invalid ranges instead of interpolating unsafe SQL values", () => {
    const filters = parseTradeFilters({
      quantityMin: "1 OR 1=1",
      unitPriceMax: "-1",
      ownerId: "9",
    });

    expect(filters.quantityMin).toBeNull();
    expect(filters.unitPriceMax).toBeNull();
    expect(filters.ownerId).toBeNull();
  });

  it("accepts negative realized-profit bounds only for profit filters", () => {
    const filters = parseTradeFilters({
      profitMin: "-500",
      profitMax: "-1",
      amountMin: "-500",
    });

    expect(filters.profitMin).toBe("-500");
    expect(filters.profitMax).toBe("-1");
    expect(filters.amountMin).toBeNull();
  });

  it("accepts only a three-digit brokerage code", () => {
    const valid = parseTradeFilters({ brokerageCode: "264" });
    const invalid = parseTradeFilters({ brokerageCode: "26A" });

    expect(valid.brokerageCode).toBe("264");
    expect(invalid.brokerageCode).toBeNull();
  });
});
