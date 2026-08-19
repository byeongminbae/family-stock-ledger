import Decimal from "decimal.js";

import type { DashboardStock, SortDirection, SortField } from "./types";

const numericFields: ReadonlySet<SortField> = new Set([
  "heldQuantity",
  "averageBuyPrice",
  "costBasis",
  "brokerageWeight",
  "currentPrice",
  "unrealizedProfit",
  "valuation",
  "returnRate",
]);

function stableCompare(a: DashboardStock, b: DashboardStock): number {
  const byName = a.stockName.localeCompare(b.stockName, "ko");
  return byName === 0 ? a.itemCode.localeCompare(b.itemCode) : byName;
}

function valueFor(stock: DashboardStock, field: SortField): string | null {
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
    const firstQuoteMissing = a.currentPrice === null;
    const secondQuoteMissing = b.currentPrice === null;
    if (firstQuoteMissing !== secondQuoteMissing) return firstQuoteMissing ? 1 : -1;

    const first = valueFor(a, field);
    const second = valueFor(b, field);
    if (first === null && second === null) return stableCompare(a, b);
    if (first === null) return 1;
    if (second === null) return -1;

    const compared = numericFields.has(field)
      ? new Decimal(first).cmp(new Decimal(second))
      : first.localeCompare(second, "ko");

    return compared === 0 ? stableCompare(a, b) : compared * multiplier;
  });
}
