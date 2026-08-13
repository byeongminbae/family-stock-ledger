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
  it("keeps date, text, ownership, brokerage, and page filters", () => {
    const filters = parseTradeFilters({
      from: "2026-08-01",
      to: "2026-08-09",
      q: "삼성전자",
      ownerId: "2",
      brokerageCode: "264",
      page: "3",
    });

    expect(filters).toEqual({
      from: "2026-08-01",
      to: "2026-08-09",
      q: "삼성전자",
      ownerId: 2,
      brokerageCode: "264",
      page: 3,
    });
  });

  it("ignores removed numeric and separate stock search parameters", () => {
    const filters = parseTradeFilters({
      q: "삼성전자",
      stockName: "무시되어야 하는 종목명",
      itemCode: "999999",
      quantityMin: "1 OR 1=1",
      quantityMax: "9007199254740993",
      unitPriceMin: "1",
      unitPriceMax: "999999",
      amountMin: "1",
      amountMax: "999999999999999999999",
      profitMin: "-500",
      profitMax: "500",
    });

    expect(filters).toEqual({
      from: null,
      to: null,
      q: "삼성전자",
      ownerId: null,
      brokerageCode: null,
      page: 1,
    });
  });

  it("accepts only a three-digit brokerage code", () => {
    const valid = parseTradeFilters({ brokerageCode: "264" });
    const invalid = parseTradeFilters({ brokerageCode: "26A" });

    expect(valid.brokerageCode).toBe("264");
    expect(invalid.brokerageCode).toBeNull();
  });
});
