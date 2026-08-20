import { z } from "zod";

import { MARKET_SESSIONS } from "@/lib/api-contracts";

const financeNumberSchema = z.number();
const ownerIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const marketSessionSchema = z.enum(MARKET_SESSIONS);

const dashboardStockSchema = z.strictObject({
  stockCode: z.string().regex(/^[0-9A-Z]{6}$/),
  stockName: z.string().min(1),
  quantity: z.number().int(),
  averageBuyPrice: financeNumberSchema,
  totalBuyAmount: financeNumberSchema,
  brokerageWeight: financeNumberSchema,
  currentPrice: financeNumberSchema,
  valuation: financeNumberSchema,
  unrealizedProfit: financeNumberSchema,
  returnRate: financeNumberSchema,
});

const dashboardBrokerageSchema = z.strictObject({
  brokerageCode: z.string().min(1),
  brokerageName: z.string().min(1),
  stockCount: z.number().int().nonnegative(),
  totalBuyAmount: financeNumberSchema,
  valuation: financeNumberSchema,
  unrealizedProfit: financeNumberSchema,
  stocks: z.array(dashboardStockSchema),
});

const dashboardOwnerSchema = z.strictObject({
  ownerId: ownerIdSchema,
  ownerName: z.string().min(1),
  stockCount: z.number().int().nonnegative(),
  totalBuyAmount: financeNumberSchema,
  valuation: financeNumberSchema,
  unrealizedProfit: financeNumberSchema,
  brokerages: z.array(dashboardBrokerageSchema),
});

const dashboardResponseShape = {
  totalBuyAmount: financeNumberSchema,
  valuation: financeNumberSchema,
  unrealizedProfit: financeNumberSchema,
  owners: z.array(dashboardOwnerSchema),
};

const emptyDashboardResponseSchema = z.strictObject({
  ...dashboardResponseShape,
  stockCount: z.literal(0),
  checkedStockCount: z.literal(0),
  quoteFetchedAt: z.null(),
  valuationSession: z.null(),
});

const populatedDashboardResponseSchema = z
  .strictObject({
    ...dashboardResponseShape,
    stockCount: z.number().int().positive(),
    checkedStockCount: z.number().int().positive(),
    quoteFetchedAt: z.string(),
    valuationSession: marketSessionSchema,
  })
  .refine(({ checkedStockCount, stockCount }) => checkedStockCount === stockCount, {
    path: ["checkedStockCount"],
  });

export const dashboardResponseSchema = z.union([
  emptyDashboardResponseSchema,
  populatedDashboardResponseSchema,
]);

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
type WithReadonlyOwners<Response> = Response extends { owners: unknown }
  ? Readonly<
      Omit<Response, "owners"> & {
        readonly owners: readonly DashboardOwner[];
      }
    >
  : never;

export type DashboardResponse = WithReadonlyOwners<z.infer<typeof dashboardResponseSchema>>;

export type SortField =
  | "stockName"
  | "quantity"
  | "averageBuyPrice"
  | "totalBuyAmount"
  | "brokerageWeight"
  | "currentPrice"
  | "unrealizedProfit"
  | "valuation"
  | "returnRate";

export type SortDirection = "asc" | "desc";
