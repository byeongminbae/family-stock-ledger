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
    brokerageCode: "240",
    brokerageName: "삼성증권",
    itemCode: "005930",
    stockName: "삼성전자",
    boughtQuantity: "7",
    soldQuantity: "2",
    totalBuyAmount: "700",
  },
  {
    ownerId: 2,
    ownerName: "할머니",
    brokerageCode: "264",
    brokerageName: "키움증권",
    itemCode: "000660",
    stockName: "SK하이닉스",
    boughtQuantity: "2",
    soldQuantity: "0",
    totalBuyAmount: "600",
  },
];

describe("dashboard portfolio math", () => {
  it("uses the lifetime buy average and owner held cost basis", () => {
    const positions = summarizeDashboardRows(rows);

    expect(positions).toMatchObject([
      {
        quantity: "5",
        averageBuyPrice: "100",
        acquisitionAmount: "500",
        portfolioWeightPercent: "100",
        brokerageCode: "240",
        brokerageName: "삼성증권",
      },
      {
        quantity: "2",
        averageBuyPrice: "300",
        acquisitionAmount: "600",
        portfolioWeightPercent: "100",
        brokerageCode: "264",
        brokerageName: "키움증권",
      },
    ]);
  });

  it("keeps brokerage positions separate while each brokerage totals one hundred percent", () => {
    // Given: one owner holds the same stock at two brokerages and another stock at one brokerage.
    const positions = summarizeDashboardRows([
      {
        ownerId: 1,
        ownerName: "병민",
        brokerageCode: "240",
        brokerageName: "삼성증권",
        itemCode: "005930",
        stockName: "삼성전자",
        boughtQuantity: "2",
        soldQuantity: "0",
        totalBuyAmount: "200",
      },
      {
        ownerId: 1,
        ownerName: "병민",
        brokerageCode: "264",
        brokerageName: "키움증권",
        itemCode: "005930",
        stockName: "삼성전자",
        boughtQuantity: "2",
        soldQuantity: "0",
        totalBuyAmount: "200",
      },
      {
        ownerId: 1,
        ownerName: "병민",
        brokerageCode: "264",
        brokerageName: "키움증권",
        itemCode: "000660",
        stockName: "SK하이닉스",
        boughtQuantity: "4",
        soldQuantity: "0",
        totalBuyAmount: "400",
      },
    ]);

    // When: the weights are grouped by brokerage.
    const samsungWeight = positions
      .filter((position) => position.brokerageCode === "240")
      .reduce((total, position) => total + Number(position.portfolioWeightPercent), 0);
    const kiwoomWeight = positions
      .filter((position) => position.brokerageCode === "264")
      .reduce((total, position) => total + Number(position.portfolioWeightPercent), 0);

    // Then: brokerage-stock rows stay distinct and each brokerage's weights total 100%.
    expect(positions).toHaveLength(3);
    expect(positions.map((position) => position.portfolioWeightPercent)).toEqual([
      "100",
      "33.333333333333333333",
      "66.666666666666666667",
    ]);
    expect(samsungWeight).toBe(100);
    expect(kiwoomWeight).toBe(100);
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
  it("sums meaningful owner totals when market quotes are complete", () => {
    // Given: one owner's held positions with complete market quotes.
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
        brokerageCode: "264",
        brokerageName: "키움증권",
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

    // Then: additive money columns are summed and the owner weight is omitted.
    expect(totals).toStrictEqual({
      stockCount: 2,
      acquisitionAmount: "500",
      portfolioWeightPercent: null,
      currentPrice: null,
      valuationAmount: "600",
      unrealizedProfit: "100",
    });
  });

  it("withholds quote-dependent owner totals when one position has no quote", () => {
    // Given: an owner with one unavailable quote.
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
        brokerageCode: "264",
        brokerageName: "키움증권",
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
      acquisitionAmount: "500",
      portfolioWeightPercent: null,
      currentPrice: null,
      valuationAmount: null,
      unrealizedProfit: null,
    });
    expect(totals).not.toHaveProperty("heldQuantity");
    expect(totals).not.toHaveProperty("averageBuyPrice");
    expect(totals).not.toHaveProperty("returnRatePercent");
  });
});
