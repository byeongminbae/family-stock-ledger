export const OWNER_NAMES = ["병민", "할머니", "아빠"] as const;

export type OwnerName = (typeof OWNER_NAMES)[number];

export type DashboardPosition = Readonly<{
  ownerId: number;
  ownerName: OwnerName;
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
  heldQuantity: string;
  averageBuyPrice: string | null;
  costBasis: string;
  portfolioWeight: string;
  currentPrice: null;
  valuation: string | null;
  unrealizedProfit: string | null;
  returnRate: string | null;
}>;

export type DashboardSnapshot = Readonly<{
  positions: readonly DashboardPosition[];
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
