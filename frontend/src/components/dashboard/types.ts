import type { MarketSession } from "@/lib/api-contracts";

export type DashboardPosition = Readonly<{
  ownerId: number;
  ownerName: string;
  brokerageCode: string | null;
  brokerageName: string | null;
  itemCode: string;
  stockName: string;
  heldQuantity: string;
  averageBuyPrice: string;
  costBasis: string;
  portfolioWeight: string | null;
  currentPrice: string | null;
  valuation: string | null;
  unrealizedProfit: string | null;
  returnRate: string | null;
}>;

export type OwnerTotals = Readonly<{
  stockCount: number;
  costBasis: string;
  portfolioWeight: string | null;
  currentPrice: null;
  valuation: string | null;
  unrealizedProfit: string | null;
}>;

export type DashboardSummaryTotals = Readonly<{
  stockCount: number;
  quotedStockCount: number;
  costBasis: string;
  valuation: string | null;
  unrealizedProfit: string | null;
}>;

export type BrokeragePositionGroup = Readonly<{
  brokerageCode: string | null;
  brokerageName: string | null;
  positions: readonly DashboardPosition[];
  totals: OwnerTotals;
}>;

export type DashboardOwner = Readonly<{
  id: number;
  name: string;
  brokerageGroups: readonly BrokeragePositionGroup[];
  totals: OwnerTotals;
}>;

export type DashboardSnapshot = Readonly<{
  positions: readonly DashboardPosition[];
  owners: readonly DashboardOwner[];
  summaryTotals: DashboardSummaryTotals;
  quoteFetchedAt: string | null;
  valuationSessions: readonly MarketSession[];
}>;

export type SortField =
  | "stockName"
  | "heldQuantity"
  | "averageBuyPrice"
  | "costBasis"
  | "portfolioWeight"
  | "currentPrice"
  | "unrealizedProfit"
  | "valuation"
  | "returnRate";

export type SortDirection = "asc" | "desc";
