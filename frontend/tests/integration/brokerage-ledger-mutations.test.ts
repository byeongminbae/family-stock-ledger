import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/lib/db";
import { listTradeHistory } from "@/lib/domain/history";
import { createTrade, deleteTrades, getPositionAverage, updateTrade } from "@/lib/domain/trades";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined) {
  throw new Error("통합 테스트에는 운영 DB가 아닌 TEST_DATABASE_URL을 명시해야 합니다.");
}

const database = createDatabase(testDatabaseUrl);
const testCodes = ["LED004", "LED005", "LED006"] as const;

async function clearTestTrades(): Promise<void> {
  await database`DELETE FROM trades WHERE security_id IN (SELECT id FROM securities WHERE item_code IN ${database(testCodes)})`;
  await database`DELETE FROM securities WHERE item_code IN ${database(testCodes)}`;
}

beforeEach(clearTestTrades);
afterAll(async () => {
  await clearTestTrades();
  await database.end({ timeout: 5 });
});

describe("brokerage-scoped ledger mutations", () => {
  it("rolls back an update that moves a sell to a brokerage without holdings", async () => {
    // Given: Kiwoom holds and partially sells a stock while Samsung holds none.
    const common = {
      brokerageCode: "264",
      isEtf: false,
      itemCode: "LED004",
      market: "KRX",
      ownerId: 1,
      stockName: "증권사 변경 롤백",
    } as const;
    await createTrade(
      {
        ...common,
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 5n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    const sell = await createTrade(
      {
        ...common,
        executedAt: "2026-08-02T01:00:00Z",
        quantity: 3n,
        side: "SELL",
        unitPrice: 200n,
      },
      database,
    );

    // When: the sell is moved to Samsung without moving its inventory.
    const update = updateTrade(
      {
        ...common,
        brokerageCode: "240",
        executedAt: "2026-08-02T01:00:00Z",
        id: BigInt(sell.id),
        quantity: 3n,
        side: "SELL",
        unitPrice: 200n,
      },
      database,
    );

    // Then: the update fails and the original Kiwoom sell remains intact.
    await expect(update).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });
    const history = await listTradeHistory(
      "SELL",
      { brokerageCode: "264", q: "증권사 변경 롤백" },
      database,
    );
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ brokerageCode: "264", profit: "300", quantity: "3" });
  });

  it("rejects deleting a buy when only another brokerage can cover the later sell", async () => {
    // Given: Kiwoom has a fully sold lot and Samsung separately holds ample inventory.
    const common = {
      isEtf: false,
      itemCode: "LED005",
      market: "KRX",
      ownerId: 2,
      stockName: "증권사별 삭제 검증",
    } as const;
    const kiwoomBuy = await createTrade(
      {
        ...common,
        brokerageCode: "264",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 5n,
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
        quantity: 100n,
        side: "BUY",
        unitPrice: 300n,
      },
      database,
    );
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

    // When: the Kiwoom buy that backs its later sell is deleted.
    const deletion = deleteTrades({ ids: [BigInt(kiwoomBuy.id)], side: "BUY" }, database);

    // Then: Samsung inventory cannot cover Kiwoom and the deletion rolls back.
    await expect(deletion).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });
    const history = await listTradeHistory(
      "BUY",
      { brokerageCode: "264", q: "증권사별 삭제 검증" },
      database,
    );
    expect(history.rows).toHaveLength(1);
    await expect(
      getPositionAverage({ brokerageCode: "240", itemCode: "LED005", ownerId: 2 }, database),
    ).resolves.toMatchObject({ heldQuantity: "100" });
  });

  it("keeps legacy null brokerage trades in their own ledger", async () => {
    // Given: a legacy null-brokerage lot is sold and a named brokerage holds separate inventory.
    await createTrade(
      {
        brokerageCode: "264",
        executedAt: "2026-08-01T01:00:00Z",
        isEtf: false,
        itemCode: "LED006",
        market: "KRX",
        ownerId: 3,
        quantity: 100n,
        side: "BUY",
        stockName: "기존 미지정 증권사",
        unitPrice: 300n,
      },
      database,
    );
    const [legacyBuy] = await database<{ readonly id: string }[]>`
      INSERT INTO trades (
        owner_id, security_id, brokerage_id, side, executed_at, quantity, unit_price
      ) VALUES (
        3, (SELECT id FROM securities WHERE item_code = 'LED006'), NULL,
        'BUY', '2026-08-01T02:00:00Z', 5, 100
      ) RETURNING id::text AS id
    `;
    if (legacyBuy === undefined) {
      throw new Error("기존 미지정 증권사 매수 거래를 만들 수 없습니다.");
    }
    await database`
      INSERT INTO trades (
        owner_id, security_id, brokerage_id, side, executed_at, quantity, unit_price,
        realized_profit
      ) VALUES (
        3, (SELECT id FROM securities WHERE item_code = 'LED006'), NULL,
        'SELL', '2026-08-02T01:00:00Z', 5, 200, 500
      )
    `;

    // When: the legacy buy backing the legacy sell is deleted.
    const deletion = deleteTrades({ ids: [BigInt(legacyBuy.id)], side: "BUY" }, database);

    // Then: named-brokerage inventory cannot cover the null-brokerage sell.
    await expect(deletion).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });
  });
});
