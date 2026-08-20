import "server-only";

import { z } from "zod";

import { type DashboardResponse, dashboardResponseSchema } from "@/components/dashboard/types";
import type { Brokerage, Owner } from "@/lib/api-contracts";

import { getInternalApiData } from "./internal-api";

const financeTextSchema = z.string().regex(/^-?(0|[1-9]\d*)(\.\d+)?$/);
const ownerIdSchema = z.number().int().positive().max(Number.MAX_SAFE_INTEGER);
const ownerSchema = z.strictObject({
  id: ownerIdSchema,
  name: z.string().trim().min(1),
});
const brokerageSchema = z.strictObject({
  code: z.string().regex(/^\d{3}$/),
  name: z.string().min(1),
});
const historyFiltersSchema = z.strictObject({
  brokerageCode: z.string().nullable(),
  from: z.string().nullable(),
  ownerId: ownerIdSchema.nullable(),
  page: z.number().int().positive(),
  q: z.string().nullable(),
  to: z.string().nullable(),
});
const historyRowSchema = z.strictObject({
  amount: financeTextSchema,
  brokerageCode: z.string().regex(/^\d{3}$/),
  brokerageName: z.string().min(1),
  executedAt: z.string().min(1),
  id: z.string().regex(/^[1-9]\d*$/),
  isEtf: z.boolean(),
  itemCode: z.string().regex(/^[0-9A-Z]{6}$/),
  market: z.string().min(1),
  ownerId: ownerIdSchema,
  ownerName: z.string().min(1),
  profit: financeTextSchema.nullable(),
  quantity: financeTextSchema,
  stockName: z.string().min(1),
  unitPrice: financeTextSchema,
});
const historySchema = z.strictObject({
  filters: historyFiltersSchema,
  hasFilters: z.boolean(),
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  rows: z.array(historyRowSchema),
  total: z.number().int().nonnegative(),
  totalPages: z.number().int().positive(),
  unfilteredTotal: z.number().int().nonnegative(),
});
const purchasedStockSchema = z.strictObject({
  code: z.string().regex(/^[0-9A-Z]{6}$/),
  isEtf: z.boolean(),
  market: z.string().min(1),
  name: z.string().min(1),
});

export type TradeHistoryResult = z.infer<typeof historySchema>;
export type PurchasedStock = z.infer<typeof purchasedStockSchema>;

export function listBrokerages(): Promise<readonly Brokerage[]> {
  return getInternalApiData("brokerages", z.array(brokerageSchema));
}

export function listOwners(): Promise<readonly Owner[]> {
  return getInternalApiData("owners", z.array(ownerSchema));
}

export function getDashboard(): Promise<DashboardResponse> {
  return getInternalApiData("dashboard", dashboardResponseSchema);
}

export function listTradeHistory(
  side: "BUY" | "SELL",
  rawSearchParams: Readonly<Record<string, string | string[] | undefined>>,
): Promise<TradeHistoryResult> {
  const searchParams = new URLSearchParams({ side });
  for (const key of ["q", "from", "to", "ownerId", "brokerageCode", "page"] as const) {
    const value = rawSearchParams[key];
    if (typeof value === "string") searchParams.set(key, value);
  }
  return getInternalApiData("trades/history", historySchema, searchParams);
}

export function listPurchasedStocks(): Promise<readonly PurchasedStock[]> {
  return getInternalApiData("stocks/purchased", z.array(purchasedStockSchema));
}
