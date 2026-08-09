import { z } from "zod";

import { type Database, db } from "@/lib/db";
import { TradeDomainError } from "@/lib/domain/trade-replay";
import {
  brokerageCodeSchema,
  financeTextSchema,
  itemCodeSchema,
  ownerIdSchema,
} from "@/lib/domain/types";

const positionAverageInputSchema = z.object({
  brokerageCode: brokerageCodeSchema,
  itemCode: itemCodeSchema,
  ownerId: ownerIdSchema,
});
const averageResultSchema = z.array(
  z.object({ heldQuantity: financeTextSchema, averageBuyPrice: financeTextSchema.nullable() }),
);

export async function getPositionAverage(
  input: z.input<typeof positionAverageInputSchema>,
  database: Database = db,
): Promise<{ readonly heldQuantity: string; readonly averageBuyPrice: string | null }> {
  const parsed = positionAverageInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new TradeDomainError("INVALID_TRADE", "소유주와 증권사, 종목 코드를 확인해 주세요.");
  }
  const result: unknown = await database`
    WITH position AS (
      SELECT COALESCE(SUM(CASE WHEN side = 'BUY' THEN quantity ELSE -quantity END), 0) AS held,
        COALESCE(SUM(quantity::numeric * unit_price) FILTER (WHERE side = 'BUY'), 0) -
        COALESCE(SUM(quantity::numeric * unit_price - realized_profit) FILTER (WHERE side = 'SELL'), 0)
          AS cost
      FROM trades t
      JOIN brokerages b ON b.id = t.brokerage_id
      WHERE t.owner_id = ${parsed.data.ownerId} AND b.code = ${parsed.data.brokerageCode}
        AND t.security_id = (SELECT id FROM securities WHERE item_code = ${parsed.data.itemCode})
    )
    SELECT held::text AS "heldQuantity", (cost / NULLIF(held, 0))::text AS "averageBuyPrice"
    FROM position
  `;
  const [position] = averageResultSchema.parse(result);
  return position ?? { heldQuantity: "0", averageBuyPrice: null };
}
