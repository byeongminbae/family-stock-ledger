import type postgres from "postgres";
import { z } from "zod";

import {
  financeTextSchema,
  nonNegativeIntegerTextSchema,
  tradeSideSchema,
} from "@/lib/domain/types";

export type Transaction = postgres.TransactionSql;
export type TradeErrorCode = "INVALID_TRADE" | "INSUFFICIENT_HOLDING" | "TRADE_NOT_FOUND";

export class TradeDomainError extends Error {
  readonly code: TradeErrorCode;

  constructor(code: TradeErrorCode, message: string) {
    super(message);
    this.name = "TradeDomainError";
    this.code = code;
  }
}

export type LedgerKey = {
  readonly ownerId: 1 | 2 | 3;
  readonly itemCode: string;
};

const ledgerTradeSchema = z.object({
  id: financeTextSchema,
  side: tradeSideSchema,
  executedAt: z.date(),
  quantity: financeTextSchema,
  unitPrice: financeTextSchema,
});
const replaySeedSchema = z.array(
  z.object({
    heldQuantity: nonNegativeIntegerTextSchema,
    remainingCost: nonNegativeIntegerTextSchema,
  }),
);

type LedgerTrade = z.infer<typeof ledgerTradeSchema>;
type ReplayUpdate = readonly [string, string];

function ledgerLockKey(key: LedgerKey): string {
  return `${key.ownerId}:${key.itemCode}`;
}

export async function lockTradeIds(
  transaction: Transaction,
  ids: readonly string[],
): Promise<void> {
  const sortedIds = [...ids].sort((left, right) => (BigInt(left) < BigInt(right) ? -1 : 1));
  for (const id of sortedIds) {
    await transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${`trade:${id}`}, 0))
    `;
  }
}

export async function lockLedgers(
  transaction: Transaction,
  keys: readonly LedgerKey[],
): Promise<void> {
  const unique = new Map(keys.map((key) => [ledgerLockKey(key), key] as const));
  const sorted = [...unique.entries()].sort(([left], [right]) => left.localeCompare(right));
  for (const [key] of sorted) {
    await transaction`
      SELECT pg_advisory_xact_lock(hashtextextended(${key}, 0))
    `;
  }
}

export async function replayLedger(
  transaction: Transaction,
  key: LedgerKey,
  updateFrom: Date,
): Promise<{ readonly heldQuantity: string; readonly remainingCost: string }> {
  const seedResult: unknown = await transaction`
    SELECT
      COALESCE(SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END), 0)::text
        AS "heldQuantity",
      (
        COALESCE(SUM(quantity::numeric * unit_price) FILTER (WHERE side = 'BUY'), 0) -
        COALESCE(
          SUM(quantity::numeric * unit_price - realized_profit) FILTER (WHERE side = 'SELL'),
          0
        )
      )::text AS "remainingCost"
    FROM trades t
    JOIN securities s ON s.id = t.security_id
    WHERE t.owner_id = ${key.ownerId} AND s.item_code = ${key.itemCode}
      AND t.executed_at < ${updateFrom}
  `;
  const [seed] = replaySeedSchema.parse(seedResult);
  if (seed === undefined) {
    throw new TradeDomainError("INVALID_TRADE", "원장 재계산의 시작 잔고를 읽을 수 없습니다.");
  }

  const suffixResult: unknown = await transaction`
    SELECT t.id::text AS id, side, t.executed_at AS "executedAt",
      quantity::text AS quantity, unit_price::text AS "unitPrice"
    FROM trades t
    JOIN securities s ON s.id = t.security_id
    WHERE t.owner_id = ${key.ownerId} AND s.item_code = ${key.itemCode}
      AND t.executed_at >= ${updateFrom}
    ORDER BY t.executed_at ASC, t.id ASC
  `;
  const trades = z.array(ledgerTradeSchema).parse(suffixResult);
  const replay = calculateReplay(trades, seed);
  const updates = replay.updates;
  if (updates.length > 0) {
    const values: readonly ReplayUpdate[] = updates.map(({ trade, profit }) => [trade.id, profit]);
    await transaction`
      UPDATE trades SET realized_profit = update_data.profit::numeric
      FROM (VALUES ${transaction(values)}) AS update_data(id, profit)
      WHERE trades.id = update_data.id::bigint
    `;
  }
  return { heldQuantity: replay.held.toString(), remainingCost: replay.cost.toString() };
}

function calculateReplay(
  trades: readonly LedgerTrade[],
  seed: { readonly heldQuantity: string; readonly remainingCost: string },
) {
  let held = BigInt(seed.heldQuantity);
  let cost = BigInt(seed.remainingCost);
  const updates: { readonly trade: LedgerTrade; readonly profit: string }[] = [];

  for (const trade of trades) {
    const quantity = BigInt(trade.quantity);
    const unitPrice = BigInt(trade.unitPrice);
    if (trade.side === "BUY") {
      held += quantity;
      cost += quantity * unitPrice;
      continue;
    }
    if (held < quantity) {
      throw new TradeDomainError(
        "INSUFFICIENT_HOLDING",
        "해당 거래 시점의 보유 수량보다 많이 매도할 수 없습니다.",
      );
    }
    const soldCost = divideRoundHalfUp(cost * quantity, held);
    const profit = unitPrice * quantity - soldCost;
    updates.push({ trade, profit: profit.toString() });
    cost -= soldCost;
    held -= quantity;
    if (held === 0n) cost = 0n;
  }
  return { cost, held, updates };
}

function divideRoundHalfUp(numerator: bigint, denominator: bigint): bigint {
  const quotient = numerator / denominator;
  const remainder = numerator % denominator;
  return remainder * 2n >= denominator ? quotient + 1n : quotient;
}

export function earliestByLedger(
  entries: readonly { readonly key: LedgerKey; readonly executedAt: Date }[],
): readonly { readonly key: LedgerKey; readonly updateFrom: Date }[] {
  const earliest = new Map<string, { readonly key: LedgerKey; readonly updateFrom: Date }>();
  for (const entry of entries) {
    const lockKey = ledgerLockKey(entry.key);
    const current = earliest.get(lockKey);
    if (current === undefined || entry.executedAt < current.updateFrom) {
      earliest.set(lockKey, { key: entry.key, updateFrom: entry.executedAt });
    }
  }
  return [...earliest.values()].sort((left, right) =>
    ledgerLockKey(left.key).localeCompare(ledgerLockKey(right.key)),
  );
}
