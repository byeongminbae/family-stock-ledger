export const OWNER_NAMES = ["병민", "할머니", "아빠"] as const;

export type OwnerName = (typeof OWNER_NAMES)[number];

export type DashboardPosition = Readonly<{
  ownerId: number;
  ownerName: OwnerName;
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

export type BrokeragePositionGroup = Readonly<{
  brokerageCode: string | null;
  brokerageName: string | null;
  positions: readonly DashboardPosition[];
  totals: OwnerTotals;
}>;

export type DashboardSnapshot = Readonly<{
  positions: readonly DashboardPosition[];
  brokerageGroups: Readonly<Record<OwnerName, readonly BrokeragePositionGroup[]>>;
  ownerTotals: Readonly<Record<OwnerName, OwnerTotals>>;
  quoteFetchedAt: string | null;
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
