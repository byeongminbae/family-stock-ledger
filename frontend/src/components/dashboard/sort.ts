import Decimal from "decimal.js";

import type { DashboardStock, SortDirection, SortField } from "./types";

const numericFields: ReadonlySet<SortField> = new Set([
  "quantity",
  "averageBuyPrice",
  "totalBuyAmount",
  "brokerageWeight",
  "currentPrice",
  "unrealizedProfit",
  "valuation",
  "returnRate",
]);

function stableCompare(a: DashboardStock, b: DashboardStock): number {
  const byName = a.stockName.localeCompare(b.stockName, "ko");
  return byName === 0 ? a.stockCode.localeCompare(b.stockCode) : byName;
}

function valueFor(stock: DashboardStock, field: SortField): string | number {
  if (field === "stockName") return stock.stockName;
  return stock[field];
}

export function sortStocks(
  stocks: readonly DashboardStock[],
  field: SortField,
  direction: SortDirection,
): readonly DashboardStock[] {
  const multiplier = direction === "asc" ? 1 : -1;

  return [...stocks].sort((a, b) => {
    const first = valueFor(a, field);
    const second = valueFor(b, field);

    const compared = numericFields.has(field)
      ? new Decimal(first).cmp(new Decimal(second))
      : String(first).localeCompare(String(second), "ko");

    return compared === 0 ? stableCompare(a, b) : compared * multiplier;
  });
}
