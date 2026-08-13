import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/lib/db";
import { listTradeHistory } from "@/lib/domain/history";
import { createTrade, getPositionAverage } from "@/lib/domain/trades";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined) {
  throw new Error("통합 테스트에는 운영 DB가 아닌 TEST_DATABASE_URL을 명시해야 합니다.");
}

const database = createDatabase(testDatabaseUrl);
const testCodes = ["LED001", "LED002", "LED003"] as const;

async function clearTestTrades(): Promise<void> {
  await database`DELETE FROM trades WHERE security_id IN (SELECT id FROM securities WHERE item_code IN ${database(testCodes)})`;
  await database`DELETE FROM securities WHERE item_code IN ${database(testCodes)}`;
}

beforeEach(clearTestTrades);
afterAll(async () => {
  await clearTestTrades();
  await database.end({ timeout: 5 });
});

describe("brokerage-scoped trade ledger", () => {
  it("rejects a sell when only another brokerage holds the stock", async () => {
    // Given: the owner bought the stock only through Kiwoom Securities.
    await createTrade(
      {
        brokerageCode: "264",
        executedAt: "2026-08-01T01:00:00Z",
        isEtf: false,
        itemCode: "LED001",
        market: "KRX",
        ownerId: 1,
        quantity: 10n,
        side: "BUY",
        stockName: "증권사별 매도 검증",
        unitPrice: 100n,
      },
      database,
    );

    // When: a sell is submitted through Samsung Securities, which has no inventory.
    const sell = createTrade(
      {
        brokerageCode: "240",
        executedAt: "2026-08-02T01:00:00Z",
        isEtf: false,
        itemCode: "LED001",
        market: "KRX",
        ownerId: 1,
        quantity: 1n,
        side: "SELL",
        stockName: "증권사별 매도 검증",
        unitPrice: 200n,
      },
      database,
    );

    // Then: inventory from the other brokerage cannot satisfy the sell.
    await expect(sell).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });
  });

  it("calculates realized profit from the selected brokerage cost basis", async () => {
    // Given: the same owner and stock have different acquisition prices at two brokerages.
    const common = {
      isEtf: false,
      itemCode: "LED002",
      market: "KRX",
      ownerId: 1,
      stockName: "증권사별 손익 검증",
    } as const;
    await createTrade(
      {
        ...common,
        brokerageCode: "264",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 10n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...common,
        brokerageCode: "240",
        executedAt: "2026-08-01T02:00:00Z",
        quantity: 10n,
        side: "BUY",
        unitPrice: 300n,
      },
      database,
    );

    // When: five Kiwoom shares are sold at 200 won.
    await createTrade(
      {
        ...common,
        brokerageCode: "264",
        executedAt: "2026-08-02T01:00:00Z",
        quantity: 5n,
        side: "SELL",
        unitPrice: 200n,
      },
      database,
    );

    // Then: only Kiwoom's 100-won basis contributes to the 500-won profit.
    const history = await listTradeHistory(
      "SELL",
      { brokerageCode: "264", q: "증권사별 손익" },
      database,
    );
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ brokerageCode: "264", profit: "500" });
  });

  it("returns the position average for one owner brokerage and stock", async () => {
    // Given: the same owner and stock are held at two brokerages with different prices.
    const common = {
      isEtf: false,
      itemCode: "LED003",
      market: "KRX",
      ownerId: 1,
      stockName: "증권사별 평균 검증",
    } as const;
    await createTrade(
      {
        ...common,
        brokerageCode: "264",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 10n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...common,
        brokerageCode: "240",
        executedAt: "2026-08-01T02:00:00Z",
        quantity: 5n,
        side: "BUY",
        unitPrice: 400n,
      },
      database,
    );

    // When: the Kiwoom position is requested.
    const kiwoomPosition = {
      brokerageCode: "264",
      itemCode: "LED003",
      ownerId: 1,
    } as const;
    const position = await getPositionAverage(kiwoomPosition, database);

    // Then: Samsung's five shares and 400-won cost are excluded.
    expect(position).toEqual({ averageBuyPrice: "100.0000000000000000", heldQuantity: "10" });
  });
});
