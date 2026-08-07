import { z } from "zod";

import { type Database, db } from "@/lib/db";
import {
  filtersAreActive,
  type HistoryFilters,
  parseTradeFilters,
  type RawSearchParams,
} from "@/lib/domain/history-filters";
import { historyBoundary } from "@/lib/domain/time";
import { financeTextSchema, ownerIdSchema, type TradeSide } from "@/lib/domain/types";

export type { HistoryFilters, RawSearchParams } from "@/lib/domain/history-filters";
export { parseTradeFilters } from "@/lib/domain/history-filters";

const pageSize = 25;
const countSchema = z.array(
  z.object({ filtered: financeTextSchema, unfiltered: financeTextSchema }),
);
const rowSchema = z.object({
  id: financeTextSchema,
  executedAt: z.date(),
  stockName: z.string(),
  itemCode: z.string(),
  quantity: financeTextSchema,
  unitPrice: financeTextSchema,
  amount: financeTextSchema,
  ownerId: ownerIdSchema,
  ownerName: z.string(),
  brokerageCode: z.string().nullable(),
  brokerageName: z.string().nullable(),
  market: z.string(),
  isEtf: z.boolean(),
  profit: financeTextSchema.nullable(),
});

export interface TradeHistoryRow {
  readonly id: string;
  readonly executedAt: string;
  readonly stockName: string;
  readonly itemCode: string;
  readonly quantity: string;
  readonly unitPrice: string;
  readonly amount: string;
  readonly ownerId: 1 | 2 | 3;
  readonly ownerName: string;
  readonly brokerageCode: string | null;
  readonly brokerageName: string | null;
  readonly market: string;
  readonly isEtf: boolean;
  readonly profit: string | null;
}

export interface TradeHistoryResult {
  readonly rows: readonly TradeHistoryRow[];
  readonly total: number;
  readonly unfilteredTotal: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
  readonly filters: HistoryFilters;
  readonly hasFilters: boolean;
}

function safeCount(value: string): number {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0) {
    throw new Error("거래 개수가 안전한 표시 범위를 벗어났습니다.");
  }
  return count;
}

export async function listTradeHistory(
  side: TradeSide,
  rawParams: RawSearchParams,
  database: Database = db,
): Promise<TradeHistoryResult> {
  const filters = parseTradeFilters(rawParams);
  const fromInstant = historyBoundary(filters.from, "start");
  const toInstant = historyBoundary(filters.to, "end");
  const countsResult: unknown = await database`
    WITH base AS (
      SELECT
        t.owner_id,
        t.brokerage_code,
        t.executed_at,
        t.quantity::numeric AS quantity,
        t.unit_price::numeric AS unit_price,
        t.quantity::numeric * t.unit_price::numeric AS amount,
        s.item_code,
        s.stock_name,
        t.realized_profit AS profit
      FROM trades t
      JOIN securities s ON s.item_code = t.security_code
      WHERE t.side = ${side}
    )
    SELECT
      COUNT(*)::text AS unfiltered,
      COUNT(*) FILTER (WHERE
        (${filters.q}::text IS NULL OR
          position(lower(${filters.q}) in lower(stock_name)) > 0 OR
          position(upper(${filters.q}) in upper(item_code)) > 0) AND
        (${fromInstant}::timestamptz IS NULL OR executed_at >= ${fromInstant}) AND
        (${toInstant}::timestamptz IS NULL OR executed_at < ${toInstant}) AND
        (${filters.stockName}::text IS NULL OR
          position(lower(${filters.stockName}) in lower(stock_name)) > 0) AND
        (${filters.itemCode}::text IS NULL OR
          position(upper(${filters.itemCode}) in upper(item_code)) > 0) AND
        (${filters.ownerId}::smallint IS NULL OR owner_id = ${filters.ownerId}) AND
        (${filters.brokerageCode}::char(3) IS NULL OR
          brokerage_code = ${filters.brokerageCode}) AND
        (${filters.quantityMin}::numeric IS NULL OR quantity >= ${filters.quantityMin}) AND
        (${filters.quantityMax}::numeric IS NULL OR quantity <= ${filters.quantityMax}) AND
        (${filters.unitPriceMin}::numeric IS NULL OR unit_price >= ${filters.unitPriceMin}) AND
        (${filters.unitPriceMax}::numeric IS NULL OR unit_price <= ${filters.unitPriceMax}) AND
        (${filters.amountMin}::numeric IS NULL OR amount >= ${filters.amountMin}) AND
        (${filters.amountMax}::numeric IS NULL OR amount <= ${filters.amountMax}) AND
        (${filters.profitMin}::numeric IS NULL OR profit >= ${filters.profitMin}) AND
        (${filters.profitMax}::numeric IS NULL OR profit <= ${filters.profitMax})
      )::text AS filtered
    FROM base
  `;
  const [countRow] = countSchema.parse(countsResult);
  if (countRow === undefined) {
    throw new Error("거래 개수를 조회하지 못했습니다.");
  }
  const total = safeCount(countRow.filtered);
  const unfilteredTotal = safeCount(countRow.unfiltered);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(filters.page, totalPages);
  const offset = (currentPage - 1) * pageSize;

  const rowsResult: unknown = await database`
    WITH base AS (
      SELECT t.id, t.owner_id, o.name AS owner_name, t.brokerage_code,
        b.name AS brokerage_name, t.executed_at,
        t.quantity::numeric AS quantity, t.unit_price::numeric AS unit_price,
        t.quantity::numeric * t.unit_price::numeric AS amount,
        s.item_code, s.stock_name, s.market, s.is_etf,
        t.realized_profit AS profit
      FROM trades t
      JOIN owners o ON o.id = t.owner_id
      JOIN securities s ON s.item_code = t.security_code
      LEFT JOIN brokerages b ON b.code = t.brokerage_code
      WHERE t.side = ${side}
    )
    SELECT id::text AS id, executed_at AS "executedAt",
      stock_name AS "stockName", item_code AS "itemCode",
      quantity::text AS quantity, unit_price::text AS "unitPrice",
      amount::text AS amount, owner_id AS "ownerId", owner_name AS "ownerName",
      brokerage_code AS "brokerageCode", brokerage_name AS "brokerageName",
      market, is_etf AS "isEtf",
      profit::text AS profit
    FROM base
    WHERE
      (${filters.q}::text IS NULL OR
        position(lower(${filters.q}) in lower(stock_name)) > 0 OR
        position(upper(${filters.q}) in upper(item_code)) > 0) AND
      (${fromInstant}::timestamptz IS NULL OR executed_at >= ${fromInstant}) AND
      (${toInstant}::timestamptz IS NULL OR executed_at < ${toInstant}) AND
      (${filters.stockName}::text IS NULL OR
        position(lower(${filters.stockName}) in lower(stock_name)) > 0) AND
      (${filters.itemCode}::text IS NULL OR
        position(upper(${filters.itemCode}) in upper(item_code)) > 0) AND
      (${filters.ownerId}::smallint IS NULL OR owner_id = ${filters.ownerId}) AND
      (${filters.brokerageCode}::char(3) IS NULL OR
        brokerage_code = ${filters.brokerageCode}) AND
      (${filters.quantityMin}::numeric IS NULL OR quantity >= ${filters.quantityMin}) AND
      (${filters.quantityMax}::numeric IS NULL OR quantity <= ${filters.quantityMax}) AND
      (${filters.unitPriceMin}::numeric IS NULL OR unit_price >= ${filters.unitPriceMin}) AND
      (${filters.unitPriceMax}::numeric IS NULL OR unit_price <= ${filters.unitPriceMax}) AND
      (${filters.amountMin}::numeric IS NULL OR amount >= ${filters.amountMin}) AND
      (${filters.amountMax}::numeric IS NULL OR amount <= ${filters.amountMax}) AND
      (${filters.profitMin}::numeric IS NULL OR profit >= ${filters.profitMin}) AND
      (${filters.profitMax}::numeric IS NULL OR profit <= ${filters.profitMax})
    ORDER BY executed_at DESC, id DESC
    LIMIT ${pageSize} OFFSET ${offset}
  `;
  const rows = z
    .array(rowSchema)
    .parse(rowsResult)
    .map((row) => ({
      ...row,
      executedAt: row.executedAt.toISOString(),
    }));

  return {
    rows,
    total,
    unfilteredTotal,
    page: currentPage,
    pageSize,
    totalPages,
    filters,
    hasFilters: filtersAreActive(filters),
  };
}
