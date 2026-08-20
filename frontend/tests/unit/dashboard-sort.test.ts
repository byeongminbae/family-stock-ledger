import { describe, expect, it } from "vitest";

import { sortStocks } from "../../src/components/dashboard/sort";
import type { DashboardStock } from "../../src/components/dashboard/types";

const baseStock: DashboardStock = {
  stockCode: "005930",
  stockName: "삼성전자",
  quantity: 2,
  averageBuyPrice: 70000,
  totalBuyAmount: 140000,
  brokerageWeight: 100,
  currentPrice: 80000,
  valuation: 160000,
  unrealizedProfit: 20000,
  returnRate: 14.2857,
};

describe("dashboard stock sorting", () => {
  it("sorts native numeric fields numerically", () => {
    // Given: two positions whose numeric order differs from their string order.
    const stocks = [
      { ...baseStock, stockCode: "000002", stockName: "두번째", quantity: 10 },
      { ...baseStock, stockCode: "000001", stockName: "첫번째", quantity: 2 },
    ];

    // When: the positions are sorted by quantity in ascending order.
    const sorted = sortStocks(stocks, "quantity", "asc");

    // Then: the native numbers determine the order.
    expect(sorted.map((stock) => stock.stockCode)).toEqual(["000001", "000002"]);
  });

  it("sorts current prices as required native numbers", () => {
    // Given: both positions have concrete current prices.
    const stocks = [
      { ...baseStock, stockCode: "000001", stockName: "낮은 가격", currentPrice: 1 },
      { ...baseStock, stockCode: "000002", stockName: "높은 가격", currentPrice: 10 },
    ];

    // When: the positions are sorted by current price in descending order.
    const sorted = sortStocks(stocks, "currentPrice", "desc");

    // Then: the larger native number sorts first without a null fallback.
    expect(sorted.map((stock) => stock.stockCode)).toEqual(["000002", "000001"]);
  });
});
