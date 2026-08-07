import { z } from "zod";

import { type Database, db } from "@/lib/db";
import {
  earliestByLedger,
  type LedgerKey,
  lockLedgers,
  lockTradeIds,
  replayLedger,
  TradeDomainError,
  type TradeErrorCode,
  type Transaction,
} from "@/lib/domain/trade-replay";
import {
  financeTextSchema,
  itemCodeSchema,
  ownerIdSchema,
  type TradeSide,
  tradeSideSchema,
} from "@/lib/domain/types";

export type { TradeErrorCode };
export { TradeDomainError };

const tradeInputSchema = z.object({
  side: tradeSideSchema,
  executedAt: z.union([z.date(), z.string().min(1)]),
  itemCode: itemCodeSchema,
  stockName: z.string().trim().min(1).max(120),
  market: z.string().trim().min(1).max(40),
  isEtf: z.boolean(),
  ownerId: ownerIdSchema,
  quantity: z.bigint().positive(),
  unitPrice: z.bigint().positive(),
});
const updateTradeInputSchema = tradeInputSchema.extend({ id: z.bigint().positive() });
const tradeIdResultSchema = z.array(z.object({ id: financeTextSchema }));
const selectedTradeSchema = z.array(
  z.object({
    id: financeTextSchema,
    ownerId: ownerIdSchema,
    securityCode: itemCodeSchema,
    executedAt: z.date(),
  }),
);
const averageResultSchema = z.array(
  z.object({ heldQuantity: financeTextSchema, averageBuyPrice: financeTextSchema.nullable() }),
);

export type TradeInput = z.input<typeof tradeInputSchema>;
export type UpdateTradeInput = z.input<typeof updateTradeInputSchema>;
export type DeleteTradesInput = {
  readonly side: TradeSide;
  readonly ids: readonly bigint[];
};
type ParsedTrade = z.output<typeof tradeInputSchema> & { readonly executedAt: Date };

function validExecutedAt(value: Date | string): Date {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new TradeDomainError("INVALID_TRADE", "거래 일시가 올바르지 않습니다.");
  }
  return date;
}

function parseTrade(input: TradeInput): ParsedTrade {
  const parsed = tradeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new TradeDomainError("INVALID_TRADE", "거래 입력값을 확인해 주세요.");
  }
  return { ...parsed.data, executedAt: validExecutedAt(parsed.data.executedAt) };
}

function parseUpdate(input: UpdateTradeInput): ParsedTrade & { readonly id: bigint } {
  const parsed = updateTradeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new TradeDomainError("INVALID_TRADE", "거래 입력값을 확인해 주세요.");
  }
  return { ...parsed.data, executedAt: validExecutedAt(parsed.data.executedAt) };
}

function ledgerKey(trade: { readonly ownerId: 1 | 2 | 3; readonly itemCode: string }): LedgerKey {
  return { ownerId: trade.ownerId, itemCode: trade.itemCode };
}

async function upsertSecurity(transaction: Transaction, trade: ParsedTrade): Promise<void> {
  await transaction`
    INSERT INTO securities (item_code, stock_name, market, is_etf)
    VALUES (${trade.itemCode}, ${trade.stockName}, ${trade.market}, ${trade.isEtf})
    ON CONFLICT (item_code) DO UPDATE SET stock_name = EXCLUDED.stock_name,
      market = EXCLUDED.market, is_etf = EXCLUDED.is_etf, updated_at = CURRENT_TIMESTAMP
  `;
}

export async function createTrade(
  input: TradeInput,
  database: Database = db,
): Promise<{ readonly id: string }> {
  const trade = parseTrade(input);
  return database.begin(async (transaction) => {
    const key = ledgerKey(trade);
    await lockLedgers(transaction, [key]);
    await upsertSecurity(transaction, trade);
    const initialProfit = trade.side === "SELL" ? "0" : null;
    const result: unknown = await transaction`
      INSERT INTO trades (
        owner_id, security_code, side, executed_at, quantity, unit_price, realized_profit
      ) VALUES (
        ${trade.ownerId}, ${trade.itemCode}, ${trade.side}, ${trade.executedAt},
        ${trade.quantity.toString()}::bigint, ${trade.unitPrice.toString()}::bigint,
        ${initialProfit}::numeric
      ) RETURNING id::text AS id
    `;
    const [created] = tradeIdResultSchema.parse(result);
    if (created === undefined) {
      throw new TradeDomainError("INVALID_TRADE", "생성된 거래 ID를 읽을 수 없습니다.");
    }
    await replayLedger(transaction, key, trade.executedAt);
    return created;
  });
}

export async function updateTrade(
  input: UpdateTradeInput,
  database: Database = db,
): Promise<{ readonly id: string }> {
  const trade = parseUpdate(input);
  const id = trade.id.toString();
  return database.begin(async (transaction) => {
    await lockTradeIds(transaction, [id]);
    const selectedResult: unknown = await transaction`
      SELECT id::text AS id, owner_id AS "ownerId", security_code AS "securityCode",
        executed_at AS "executedAt"
      FROM trades WHERE id = ${id}::bigint AND side = ${trade.side}
    `;
    const [selected] = selectedTradeSchema.parse(selectedResult);
    if (selected === undefined) {
      throw new TradeDomainError("TRADE_NOT_FOUND", "수정할 거래를 찾을 수 없습니다.");
    }
    const oldKey = { ownerId: selected.ownerId, itemCode: selected.securityCode };
    const newKey = ledgerKey(trade);
    const affected = earliestByLedger([
      { key: oldKey, executedAt: selected.executedAt },
      { key: newKey, executedAt: trade.executedAt },
    ]);
    await lockLedgers(
      transaction,
      affected.map(({ key }) => key),
    );
    const lockedResult: unknown = await transaction`
      SELECT id::text AS id, owner_id AS "ownerId", security_code AS "securityCode",
        executed_at AS "executedAt"
      FROM trades WHERE id = ${id}::bigint AND side = ${trade.side} FOR UPDATE
    `;
    if (selectedTradeSchema.parse(lockedResult).length !== 1) {
      throw new TradeDomainError("TRADE_NOT_FOUND", "수정할 거래를 찾을 수 없습니다.");
    }
    await upsertSecurity(transaction, trade);
    await transaction`
      UPDATE trades SET owner_id = ${trade.ownerId}, security_code = ${trade.itemCode},
        executed_at = ${trade.executedAt}, quantity = ${trade.quantity.toString()}::bigint,
        unit_price = ${trade.unitPrice.toString()}::bigint,
        realized_profit = ${trade.side === "SELL" ? "0" : null}::numeric
      WHERE id = ${id}::bigint AND side = ${trade.side}
    `;
    for (const ledger of affected) {
      await replayLedger(transaction, ledger.key, ledger.updateFrom);
    }
    return { id };
  });
}

export async function deleteTrades(
  input: DeleteTradesInput,
  database: Database = db,
): Promise<{ readonly deletedCount: number }> {
  const ids = input.ids.map((id) => id.toString());
  return database.begin(async (transaction) => {
    await lockTradeIds(transaction, ids);
    const selectedResult: unknown = await transaction`
      SELECT id::text AS id, owner_id AS "ownerId", security_code AS "securityCode",
        executed_at AS "executedAt"
      FROM trades WHERE id IN ${transaction(ids)} AND side = ${input.side}
    `;
    const selected = selectedTradeSchema.parse(selectedResult);
    if (selected.length !== ids.length) {
      throw new TradeDomainError(
        "TRADE_NOT_FOUND",
        "선택한 거래를 찾을 수 없거나 거래 종류가 일치하지 않습니다.",
      );
    }
    const affected = earliestByLedger(
      selected.map((trade) => ({
        key: { ownerId: trade.ownerId, itemCode: trade.securityCode },
        executedAt: trade.executedAt,
      })),
    );
    await lockLedgers(
      transaction,
      affected.map(({ key }) => key),
    );
    const lockedResult: unknown = await transaction`
      SELECT id::text AS id, owner_id AS "ownerId", security_code AS "securityCode",
        executed_at AS "executedAt"
      FROM trades WHERE id IN ${transaction(ids)} AND side = ${input.side} FOR UPDATE
    `;
    if (selectedTradeSchema.parse(lockedResult).length !== ids.length) {
      throw new TradeDomainError(
        "TRADE_NOT_FOUND",
        "선택한 거래를 찾을 수 없거나 거래 종류가 일치하지 않습니다.",
      );
    }
    const deletedResult: unknown = await transaction`
      DELETE FROM trades WHERE id IN ${transaction(ids)} AND side = ${input.side}
      RETURNING id::text AS id
    `;
    const deleted = tradeIdResultSchema.parse(deletedResult);
    for (const ledger of affected) {
      await replayLedger(transaction, ledger.key, ledger.updateFrom);
    }
    return { deletedCount: deleted.length };
  });
}

export async function getPositionAverage(
  input: { readonly ownerId: number; readonly itemCode: string },
  database: Database = db,
): Promise<{ readonly heldQuantity: string; readonly averageBuyPrice: string | null }> {
  const parsed = z.object({ ownerId: ownerIdSchema, itemCode: itemCodeSchema }).safeParse(input);
  if (!parsed.success) {
    throw new TradeDomainError("INVALID_TRADE", "소유주와 종목 코드를 확인해 주세요.");
  }
  const result: unknown = await database`
    WITH position AS (
      SELECT COALESCE(SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END), 0) AS held,
        COALESCE(SUM(quantity::numeric * unit_price) FILTER (WHERE side = 'BUY'), 0) -
        COALESCE(SUM(quantity::numeric * unit_price - realized_profit) FILTER (WHERE side = 'SELL'), 0)
          AS cost
      FROM trades WHERE owner_id = ${parsed.data.ownerId}
        AND security_code = ${parsed.data.itemCode}
    )
    SELECT held::text AS "heldQuantity", (cost / NULLIF(held, 0))::text AS "averageBuyPrice"
    FROM position
  `;
  const [position] = averageResultSchema.parse(result);
  return position ?? { heldQuantity: "0", averageBuyPrice: null };
}
