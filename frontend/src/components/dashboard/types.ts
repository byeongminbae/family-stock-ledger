import { z } from "zod";

import { MARKET_SESSIONS } from "@/lib/api-contracts";

const financeTextSchema = z.string().regex(/^-?(0|[1-9]\d*)(\.\d+)?$/);
const ownerIdSchema = z.number().int().positive().max(32_767);
const marketSessionSchema = z.enum(MARKET_SESSIONS);

const dashboardStockSchema = z.strictObject({
  itemCode: z.string().regex(/^[0-9A-Z]{6}$/),
  stockName: z.string().min(1),
  heldQuantity: financeTextSchema,
  averageBuyPrice: financeTextSchema,
  costBasis: financeTextSchema,
  brokerageWeight: financeTextSchema.nullable(),
  currentPrice: financeTextSchema.nullable(),
  valuation: financeTextSchema.nullable(),
  unrealizedProfit: financeTextSchema.nullable(),
  returnRate: financeTextSchema.nullable(),
});

const dashboardBrokerageSchema = z.strictObject({
  brokerageCode: z.string().nullable(),
  brokerageName: z.string().nullable(),
  stockCount: z.number().int().nonnegative(),
  costBasis: financeTextSchema,
  valuation: financeTextSchema.nullable(),
  unrealizedProfit: financeTextSchema.nullable(),
  stocks: z.array(dashboardStockSchema),
});

const dashboardOwnerSchema = z.strictObject({
  id: ownerIdSchema,
  name: z.string().min(1),
  stockCount: z.number().int().nonnegative(),
  costBasis: financeTextSchema,
  valuation: financeTextSchema.nullable(),
  unrealizedProfit: financeTextSchema.nullable(),
  brokerages: z.array(dashboardBrokerageSchema),
});

export const dashboardResponseSchema = z.strictObject({
  stockCount: z.number().int().nonnegative(),
  quotedStockCount: z.number().int().nonnegative(),
  costBasis: financeTextSchema,
  valuation: financeTextSchema.nullable(),
  unrealizedProfit: financeTextSchema.nullable(),
  owners: z.array(dashboardOwnerSchema),
  quoteFetchedAt: z.string().nullable(),
  valuationSessions: z.array(marketSessionSchema),
});

export type DashboardStock = Readonly<z.infer<typeof dashboardStockSchema>>;
export type DashboardBrokerage = Readonly<
  Omit<z.infer<typeof dashboardBrokerageSchema>, "stocks"> & {
    readonly stocks: readonly DashboardStock[];
  }
>;
export type DashboardOwner = Readonly<
  Omit<z.infer<typeof dashboardOwnerSchema>, "brokerages"> & {
    readonly brokerages: readonly DashboardBrokerage[];
  }
>;
export type DashboardResponse = Readonly<
  Omit<z.infer<typeof dashboardResponseSchema>, "owners"> & {
    readonly owners: readonly DashboardOwner[];
  }
>;

export type SortField =
  | "stockName"
  | "heldQuantity"
  | "averageBuyPrice"
  | "costBasis"
  | "brokerageWeight"
  | "currentPrice"
  | "unrealizedProfit"
  | "valuation"
  | "returnRate";

export type SortDirection = "asc" | "desc";
