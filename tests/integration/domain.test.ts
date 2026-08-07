import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/lib/db";
import { listTradeHistory } from "@/lib/domain/history";
import {
  createTrade,
  deleteTrades,
  getPositionAverage,
  type TradeInput,
  updateTrade,
} from "@/lib/domain/trades";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined) {
  throw new Error("통합 테스트에는 운영 DB가 아닌 TEST_DATABASE_URL을 명시해야 합니다.");
}
const database = createDatabase(testDatabaseUrl);
const testCodes = [
  "TST001",
  "TST002",
  "TST003",
  "TST004",
  "TST005",
  "TST006",
  "TST007",
  "TST008",
  "TST009",
  "TST010",
];

function day(number: number): string {
  return `2026-08-${number.toString().padStart(2, "0")}T01:00:00Z`;
}

function tradeCommon(itemCode: string, ownerId: 1 | 2 | 3, stockName: string) {
  return {
    itemCode,
    stockName,
    market: "KRX",
    isEtf: false,
    ownerId,
    brokerageCode: "264",
  } as const;
}

async function clearTestTrades() {
  await database`DELETE FROM trades WHERE security_id IN (SELECT id FROM securities WHERE item_code IN ${database(testCodes)})`;
  await database`DELETE FROM securities WHERE item_code IN ${database(testCodes)}`;
}

beforeEach(clearTestTrades);
afterAll(async () => {
  await clearTestTrades();
  await database.end({ timeout: 5 });
});

// allow: SIZE_OK — one shared PostgreSQL lifecycle keeps fixed-code ledger scenarios sequential.
describe("trade ledger integration", () => {
  it("rejects a sell that makes any chronological balance negative", async () => {
    await createTrade(
      {
        side: "BUY",
        executedAt: "2026-08-02T01:00:00.000Z",
        itemCode: "TST001",
        stockName: "타임라인 검증",
        market: "KRX",
        isEtf: false,
        ownerId: 1,
        brokerageCode: "264",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );

    await expect(
      createTrade(
        {
          side: "SELL",
          executedAt: "2026-08-01T01:00:00.000Z",
          itemCode: "TST001",
          stockName: "타임라인 검증",
          market: "KRX",
          isEtf: false,
          ownerId: 1,
          brokerageCode: "264",
          quantity: 1n,
          unitPrice: 120n,
        },
        database,
      ),
    ).rejects.toMatchObject({
      code: "INSUFFICIENT_HOLDING",
    });
  });

  it("serializes concurrent sells for one owner and item", async () => {
    await createTrade(
      {
        side: "BUY",
        executedAt: "2026-08-01T01:00:00.000Z",
        itemCode: "TST002",
        stockName: "동시성 검증",
        market: "KRX",
        isEtf: false,
        ownerId: 2,
        brokerageCode: "264",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );
    const sell = () =>
      createTrade(
        {
          side: "SELL",
          executedAt: "2026-08-02T01:00:00.000Z",
          itemCode: "TST002",
          stockName: "동시성 검증",
          market: "KRX",
          isEtf: false,
          ownerId: 2,
          brokerageCode: "264",
          quantity: 7n,
          unitPrice: 120n,
        },
        database,
      );

    const outcomes = await Promise.allSettled([sell(), sell()]);
    expect(outcomes.filter((outcome) => outcome.status === "fulfilled")).toHaveLength(1);
    expect(outcomes.filter((outcome) => outcome.status === "rejected")).toHaveLength(1);
    await expect(
      getPositionAverage({ ownerId: 2, itemCode: "TST002" }, database),
    ).resolves.toMatchObject({ heldQuantity: "3" });
  });

  it("keeps a past sell profit unchanged when a later buy changes the current average", async () => {
    const common: Pick<
      TradeInput,
      "itemCode" | "stockName" | "market" | "isEtf" | "ownerId" | "brokerageCode"
    > = {
      itemCode: "TST003",
      stockName: "평균단가 검증",
      market: "KRX",
      isEtf: false,
      ownerId: 3,
      brokerageCode: "264",
    };
    await createTrade(
      {
        ...common,
        side: "BUY",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );

    await createTrade(
      {
        ...common,
        side: "SELL",
        executedAt: "2026-08-02T01:00:00Z",
        quantity: 5n,
        unitPrice: 150n,
      },
      database,
    );
    const beforeLaterBuy = await listTradeHistory("SELL", { q: "평균단가" }, database);
    expect(beforeLaterBuy.rows[0]).toMatchObject({ profit: "250" });
    await createTrade(
      {
        ...common,
        side: "BUY",
        executedAt: "2026-08-03T01:00:00Z",
        quantity: 10n,
        unitPrice: 300n,
      },
      database,
    );

    await expect(getPositionAverage({ ownerId: 3, itemCode: "TST003" }, database)).resolves.toEqual(
      { heldQuantity: "15", averageBuyPrice: "233.3333333333333333" },
    );
    const history = await listTradeHistory("SELL", { q: "평균단가" }, database);
    expect(history.rows).toHaveLength(1);
    expect(history.rows[0]).toMatchObject({ profit: "250" });
  });

  it("uses the weighted current cost basis for a partial sell", async () => {
    const common = tradeCommon("TST006", 1, "부분 매도 검증");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 10n, unitPrice: 100n },
      database,
    );
    await createTrade(
      { ...common, side: "BUY", executedAt: day(2), quantity: 10n, unitPrice: 200n },
      database,
    );
    await createTrade(
      { ...common, side: "SELL", executedAt: day(3), quantity: 5n, unitPrice: 300n },
      database,
    );

    await expect(getPositionAverage({ ownerId: 1, itemCode: "TST006" }, database)).resolves.toEqual(
      {
        heldQuantity: "15",
        averageBuyPrice: "150.0000000000000000",
      },
    );
    const history = await listTradeHistory("SELL", { q: "부분 매도" }, database);
    expect(history.rows[0]).toMatchObject({ profit: "750" });
  });

  it("stores exact whole-won profit when the average cost is recurring", async () => {
    const common = tradeCommon("TST010", 1, "반복소수 손익 검증");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 1n, unitPrice: 2n },
      database,
    );
    await createTrade(
      { ...common, side: "BUY", executedAt: day(2), quantity: 2n, unitPrice: 1n },
      database,
    );
    const sell = await createTrade(
      { ...common, side: "SELL", executedAt: day(3), quantity: 3n, unitPrice: 1_000_002n },
      database,
    );

    await updateTrade(
      {
        ...common,
        id: BigInt(sell.id),
        side: "SELL",
        executedAt: day(3),
        quantity: 3n,
        unitPrice: 1_000_003n,
      },
      database,
    );

    const history = await listTradeHistory("SELL", { q: "반복소수" }, database);
    expect(history.rows[0]).toMatchObject({ profit: "3000005" });
  });

  it("orders a buy before a later-created sell at the same timestamp by ID", async () => {
    const common = tradeCommon("TST009", 1, "동일 시각 검증");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 5n, unitPrice: 100n },
      database,
    );

    await createTrade(
      { ...common, side: "SELL", executedAt: day(1), quantity: 2n, unitPrice: 150n },
      database,
    );

    const history = await listTradeHistory("SELL", { q: "동일 시각" }, database);
    expect(history.rows[0]).toMatchObject({ profit: "100" });
  });

  it("recalculates the edited sell and downstream sells after price time and quantity change", async () => {
    const common = tradeCommon("TST007", 1, "수정 연쇄 검증");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 10n, unitPrice: 100n },
      database,
    );
    const edited = await createTrade(
      { ...common, side: "SELL", executedAt: day(2), quantity: 5n, unitPrice: 150n },
      database,
    );
    await createTrade(
      { ...common, side: "BUY", executedAt: day(3), quantity: 10n, unitPrice: 300n },
      database,
    );
    await createTrade(
      { ...common, side: "SELL", executedAt: day(4), quantity: 5n, unitPrice: 400n },
      database,
    );

    await updateTrade(
      {
        ...common,
        id: BigInt(edited.id),
        side: "SELL",
        executedAt: "2026-08-03T12:00:00Z",
        quantity: 10n,
        unitPrice: 200n,
      },
      database,
    );

    const history = await listTradeHistory("SELL", { q: "수정 연쇄" }, database);
    expect(history.rows.map((row) => row.profit)).toEqual(["1000", "0"]);
  });

  it("replays both ledgers when an edit moves owner and security", async () => {
    const oldLedger = tradeCommon("TST008", 1, "이전 원장");
    const newLedger = tradeCommon("TST009", 2, "새 원장");
    await createTrade(
      { ...oldLedger, side: "BUY", executedAt: day(1), quantity: 10n, unitPrice: 100n },
      database,
    );
    await createTrade(
      { ...newLedger, side: "BUY", executedAt: day(1), quantity: 10n, unitPrice: 300n },
      database,
    );
    const moved = await createTrade(
      { ...oldLedger, side: "SELL", executedAt: day(2), quantity: 5n, unitPrice: 200n },
      database,
    );

    await updateTrade(
      {
        ...newLedger,
        id: BigInt(moved.id),
        side: "SELL",
        executedAt: day(2),
        quantity: 5n,
        unitPrice: 400n,
      },
      database,
    );

    await expect(
      getPositionAverage({ ownerId: 1, itemCode: "TST008" }, database),
    ).resolves.toMatchObject({ heldQuantity: "10" });
    await expect(
      getPositionAverage({ ownerId: 2, itemCode: "TST009" }, database),
    ).resolves.toMatchObject({ heldQuantity: "5" });
    const history = await listTradeHistory("SELL", { q: "새 원장" }, database);
    expect(history.rows[0]).toMatchObject({ ownerId: 2, itemCode: "TST009", profit: "500" });
  });

  it("serializes concurrent edits of different sells in one ledger without deadlock", async () => {
    const common = tradeCommon("TST008", 3, "동시 수정 검증");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 20n, unitPrice: 100n },
      database,
    );
    const first = await createTrade(
      { ...common, side: "SELL", executedAt: day(2), quantity: 5n, unitPrice: 150n },
      database,
    );
    const second = await createTrade(
      { ...common, side: "SELL", executedAt: day(3), quantity: 5n, unitPrice: 160n },
      database,
    );

    await Promise.all([
      updateTrade(
        {
          ...common,
          id: BigInt(first.id),
          side: "SELL",
          executedAt: day(2),
          quantity: 5n,
          unitPrice: 170n,
        },
        database,
      ),
      updateTrade(
        {
          ...common,
          id: BigInt(second.id),
          side: "SELL",
          executedAt: day(3),
          quantity: 5n,
          unitPrice: 180n,
        },
        database,
      ),
    ]);

    const history = await listTradeHistory("SELL", { q: "동시 수정" }, database);
    expect(history.rows.map((row) => row.profit)).toEqual(["400", "350"]);
  });

  it("rolls back an edit that makes a ledger insufficient", async () => {
    const common = tradeCommon("TST006", 3, "수정 롤백");
    await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 5n, unitPrice: 100n },
      database,
    );
    const sell = await createTrade(
      { ...common, side: "SELL", executedAt: day(2), quantity: 3n, unitPrice: 200n },
      database,
    );

    await expect(
      updateTrade(
        {
          ...common,
          id: BigInt(sell.id),
          side: "SELL",
          executedAt: day(2),
          quantity: 6n,
          unitPrice: 200n,
        },
        database,
      ),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });

    await expect(
      getPositionAverage({ ownerId: 3, itemCode: "TST006" }, database),
    ).resolves.toMatchObject({ heldQuantity: "2" });
    const history = await listTradeHistory("SELL", { q: "수정 롤백" }, database);
    expect(history.rows[0]).toMatchObject({ quantity: "3", profit: "300" });
  });

  it("rolls back a buy deletion that would make a later sale oversold", async () => {
    const common: Pick<
      TradeInput,
      "itemCode" | "stockName" | "market" | "isEtf" | "ownerId" | "brokerageCode"
    > = {
      itemCode: "TST004",
      stockName: "삭제 잔고 검증",
      market: "KRX",
      isEtf: false,
      ownerId: 1,
      brokerageCode: "264",
    };
    const buy = await createTrade(
      {
        ...common,
        side: "BUY",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...common,
        side: "SELL",
        executedAt: "2026-08-02T01:00:00Z",
        quantity: 7n,
        unitPrice: 120n,
      },
      database,
    );

    await expect(
      deleteTrades({ ids: [BigInt(buy.id)], side: "BUY" }, database),
    ).rejects.toMatchObject({ code: "INSUFFICIENT_HOLDING" });

    await expect(getPositionAverage({ ownerId: 1, itemCode: "TST004" }, database)).resolves.toEqual(
      { heldQuantity: "3", averageBuyPrice: "100.0000000000000000" },
    );
  });

  it("recomputes downstream sell profit after deleting an earlier buy", async () => {
    const common = tradeCommon("TST007", 2, "삭제 손익 재계산");
    const firstBuy = await createTrade(
      { ...common, side: "BUY", executedAt: day(1), quantity: 10n, unitPrice: 100n },
      database,
    );
    await createTrade(
      { ...common, side: "BUY", executedAt: day(2), quantity: 20n, unitPrice: 200n },
      database,
    );
    await createTrade(
      { ...common, side: "SELL", executedAt: day(3), quantity: 10n, unitPrice: 250n },
      database,
    );

    await deleteTrades({ ids: [BigInt(firstBuy.id)], side: "BUY" }, database);

    const history = await listTradeHistory("SELL", { q: "삭제 손익" }, database);
    expect(history.rows[0]).toMatchObject({ profit: "500" });
  });

  it("deletes all selected rows of the requested side together", async () => {
    const common: Pick<
      TradeInput,
      "itemCode" | "stockName" | "market" | "isEtf" | "ownerId" | "brokerageCode"
    > = {
      itemCode: "TST005",
      stockName: "일괄 삭제 검증",
      market: "KRX",
      isEtf: false,
      ownerId: 2,
      brokerageCode: "264",
    };
    const firstBuy = await createTrade(
      {
        ...common,
        side: "BUY",
        executedAt: "2026-08-01T01:00:00Z",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );
    const secondBuy = await createTrade(
      {
        ...common,
        side: "BUY",
        executedAt: "2026-08-02T01:00:00Z",
        quantity: 5n,
        unitPrice: 200n,
      },
      database,
    );

    await expect(
      deleteTrades({ ids: [BigInt(firstBuy.id), BigInt(secondBuy.id)], side: "BUY" }, database),
    ).resolves.toEqual({ deletedCount: 2 });
    await expect(getPositionAverage({ ownerId: 2, itemCode: "TST005" }, database)).resolves.toEqual(
      { heldQuantity: "0", averageBuyPrice: null },
    );
  });

  it("rejects an ID that does not belong to the requested side without deleting anything", async () => {
    const trade = await createTrade(
      {
        side: "BUY",
        executedAt: "2026-08-01T01:00:00Z",
        itemCode: "TST005",
        stockName: "삭제 종류 검증",
        market: "KRX",
        isEtf: false,
        ownerId: 2,
        brokerageCode: "264",
        quantity: 10n,
        unitPrice: 100n,
      },
      database,
    );

    await expect(
      deleteTrades({ ids: [BigInt(trade.id)], side: "SELL" }, database),
    ).rejects.toMatchObject({ code: "TRADE_NOT_FOUND" });
    await expect(getPositionAverage({ ownerId: 2, itemCode: "TST005" }, database)).resolves.toEqual(
      { heldQuantity: "10", averageBuyPrice: "100.0000000000000000" },
    );
  });
});
