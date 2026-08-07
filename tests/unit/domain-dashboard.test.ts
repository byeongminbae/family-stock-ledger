import { describe, expect, it } from "vitest";

import {
  type DashboardAggregateRow,
  type DashboardPosition,
  mergeMarketQuotes,
  summarizeDashboardRows,
  summarizeOwnerTotals,
} from "@/lib/domain/dashboard";

const rows: readonly DashboardAggregateRow[] = [
  {
    ownerId: 1,
    ownerName: "병민",
    itemCode: "005930",
    stockName: "삼성전자",
    boughtQuantity: "7",
    soldQuantity: "2",
    totalBuyAmount: "700",
  },
  {
    ownerId: 2,
    ownerName: "할머니",
    itemCode: "000660",
    stockName: "SK하이닉스",
    boughtQuantity: "2",
    soldQuantity: "0",
    totalBuyAmount: "600",
  },
];

describe("dashboard portfolio math", () => {
  it("uses the lifetime buy average and global held cost basis", () => {
    const positions = summarizeDashboardRows(rows);

    expect(positions).toMatchObject([
      {
        quantity: "5",
        averageBuyPrice: "100",
        acquisitionAmount: "500",
        portfolioWeightPercent: "45.454545454545454545",
      },
      {
        quantity: "2",
        averageBuyPrice: "300",
        acquisitionAmount: "600",
        portfolioWeightPercent: "54.545454545454545455",
      },
    ]);
  });

  it("keeps quote-dependent values null when one quote is unavailable", () => {
    const positions = summarizeDashboardRows(rows);
    const result = mergeMarketQuotes(positions, {
      "005930": {
        itemCode: "005930",
        currentPrice: "120",
        quotedAt: "2026-08-07T10:00:00+09:00",
      },
    });

    expect(result[0]).toMatchObject({
      currentPrice: "120",
      valuationAmount: "600",
      unrealizedProfit: "100",
      returnRatePercent: "20",
    });
    expect(result[1]).toMatchObject({
      currentPrice: null,
      valuationAmount: null,
      unrealizedProfit: null,
      returnRatePercent: null,
    });
  });
});

describe("owner dashboard totals", () => {
  it("uses held cost basis for the weighted average and complete quote totals", () => {
    // Given: one owner's held positions with complete market quotes.
    const positions: readonly DashboardPosition[] = [
      {
        ownerId: 1,
        ownerName: "병민",
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

    // When: the owner subtotal is calculated.
    const totals = summarizeOwnerTotals(positions);

    // Then: additive columns are summed and averages/rate stay portfolio-weighted.
    expect(totals).toStrictEqual({
      stockCount: 2,
      heldQuantity: "3",
      averageBuyPrice: "166.666666666666666667",
      acquisitionAmount: "500",
      portfolioWeightPercent: "50",
      currentPrice: null,
      valuationAmount: "600",
      unrealizedProfit: "100",
      returnRatePercent: "20",
    });
  });

  it("withholds quote-dependent owner totals when one position has no quote", () => {
    // Given: an owner with one unavailable quote.
    const positions: readonly DashboardPosition[] = [
      {
        ownerId: 1,
        ownerName: "병민",
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
        itemCode: "000660",
        stockName: "SK하이닉스",
        quantity: "1",
        averageBuyPrice: "300",
        acquisitionAmount: "300",
        portfolioWeightPercent: "30",
        currentPrice: null,
        valuationAmount: null,
        unrealizedProfit: null,
        returnRatePercent: null,
        quoteUpdatedAt: null,
      },
    ];

    // When: the owner subtotal is calculated.
    const totals = summarizeOwnerTotals(positions);

    // Then: only quote-independent values remain available.
    expect(totals).toMatchObject({
      stockCount: 2,
      heldQuantity: "3",
      averageBuyPrice: "166.666666666666666667",
      acquisitionAmount: "500",
      portfolioWeightPercent: "50",
      currentPrice: null,
      valuationAmount: null,
      unrealizedProfit: null,
      returnRatePercent: null,
    });
  });
});
