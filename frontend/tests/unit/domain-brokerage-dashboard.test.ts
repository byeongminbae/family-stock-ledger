import { describe, expect, it } from "vitest";

import { type DashboardPosition, summarizeBrokerageTotals } from "@/lib/domain/dashboard";

describe("brokerage dashboard totals", () => {
  it("normalizes each non-empty brokerage subtotal to one hundred percent", () => {
    // Given: one brokerage holds two positions with weights that do not already sum to 100%.
    const positions: readonly DashboardPosition[] = [
      {
        ownerId: 1,
        ownerName: "병민",
        brokerageCode: "240",
        brokerageName: "삼성증권",
        itemCode: "005930",
        stockName: "삼성전자",
        quantity: "2",
        averageBuyPrice: "100",
        acquisitionAmount: "200",
        portfolioWeightPercent: "20",
        currentPrice: "120",
        valuationAmount: "240",
        unrealizedProfit: "40",
        returnRatePercent: "20",
        quoteUpdatedAt: "2026-08-07T10:00:00+09:00",
      },
      {
        ownerId: 1,
        ownerName: "병민",
        brokerageCode: "240",
        brokerageName: "삼성증권",
        itemCode: "000660",
        stockName: "SK하이닉스",
        quantity: "1",
        averageBuyPrice: "300",
        acquisitionAmount: "300",
        portfolioWeightPercent: "30",
        currentPrice: "360",
        valuationAmount: "360",
        unrealizedProfit: "60",
        returnRatePercent: "20",
        quoteUpdatedAt: "2026-08-07T10:00:00+09:00",
      },
    ];

    // When: the brokerage subtotal is calculated.
    const totals = summarizeBrokerageTotals(positions);

    // Then: money values add identically to the owner total and brokerage weight is exactly 100%.
    expect(totals).toStrictEqual({
      stockCount: 2,
      acquisitionAmount: "500",
      portfolioWeightPercent: "100",
      currentPrice: null,
      valuationAmount: "600",
      unrealizedProfit: "100",
    });
  });
});
