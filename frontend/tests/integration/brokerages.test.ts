import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/lib/db";
import { listBrokerages } from "@/lib/domain/brokerages";
import { getBaseDashboardPositions } from "@/lib/domain/dashboard";
import { listTradeHistory } from "@/lib/domain/history";
import { createTrade, updateTrade } from "@/lib/domain/trades";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined) {
  throw new Error("통합 테스트에는 운영 DB가 아닌 TEST_DATABASE_URL을 명시해야 합니다.");
}
const database = createDatabase(testDatabaseUrl);
const testCodes = ["BRK001", "BRK002", "BRK003", "BRK004"] as const;

function day(number: number): string {
  return `2026-08-${number.toString().padStart(2, "0")}T01:00:00Z`;
}

function tradeCommon(itemCode: string, stockName: string) {
  return {
    brokerageCode: "264",
    isEtf: false,
    itemCode,
    market: "KRX",
    ownerId: 1,
    stockName,
  } as const;
}

async function clearTestTrades(): Promise<void> {
  await database`DELETE FROM trades WHERE security_id IN (SELECT id FROM securities WHERE item_code IN ${database(testCodes)})`;
  await database`DELETE FROM securities WHERE item_code IN ${database(testCodes)}`;
}

beforeEach(clearTestTrades);
afterAll(async () => {
  await clearTestTrades();
  await database.end({ timeout: 5 });
});

describe("brokerage integration", () => {
  it("lists the exact Korean Payments & Settlement reference data by code", async () => {
    await expect(listBrokerages(database)).resolves.toEqual([
      { code: "209", name: "유안타증권" },
      { code: "218", name: "KB증권" },
      { code: "227", name: "KTB투자증권(다올투자증권)" },
      { code: "238", name: "미래에셋증권" },
      { code: "240", name: "삼성증권" },
      { code: "243", name: "한국투자증권" },
      { code: "247", name: "NH투자증권" },
      { code: "261", name: "교보증권" },
      { code: "262", name: "아이엠증권" },
      { code: "263", name: "현대차증권" },
      { code: "264", name: "키움증권" },
      { code: "266", name: "SK증권" },
      { code: "267", name: "대신증권" },
      { code: "269", name: "한화투자증권" },
      { code: "270", name: "하나금융투자" },
      { code: "271", name: "토스증권" },
      { code: "278", name: "신한금융투자" },
      { code: "279", name: "DB금융투자" },
      { code: "280", name: "유진투자증권" },
      { code: "287", name: "메리츠증권" },
      { code: "288", name: "카카오페이증권" },
      { code: "290", name: "부국증권" },
      { code: "291", name: "신영증권" },
      { code: "292", name: "LIG투자증권" },
      { code: "294", name: "펀드온라인코리아(한국포스증권)" },
    ]);
  });

  it("writes brokerage codes on create and update and filters history counts and rows", async () => {
    const first = await createTrade(
      {
        ...tradeCommon("BRK001", "증권사 필터 하나"),
        executedAt: day(1),
        quantity: 1n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...tradeCommon("BRK002", "증권사 필터 둘"),
        brokerageCode: "240",
        executedAt: day(2),
        quantity: 1n,
        side: "BUY",
        unitPrice: 200n,
      },
      database,
    );

    const beforeUpdate = await listTradeHistory(
      "BUY",
      { brokerageCode: "264", q: "증권사 필터" },
      database,
    );
    expect(beforeUpdate.total).toBe(1);
    expect(beforeUpdate.rows[0]).toMatchObject({
      brokerageCode: "264",
      brokerageName: "키움증권",
    });

    await updateTrade(
      {
        ...tradeCommon("BRK001", "증권사 필터 하나"),
        brokerageCode: "240",
        executedAt: day(1),
        id: BigInt(first.id),
        quantity: 1n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );

    const afterUpdate = await listTradeHistory(
      "BUY",
      { brokerageCode: "240", q: "증권사 필터" },
      database,
    );
    expect(afterUpdate.total).toBe(2);
    expect(afterUpdate.rows).toSatisfy(
      (rows: readonly { readonly brokerageCode: string | null }[]) =>
        rows.every((row) => row.brokerageCode === "240"),
    );
  });

  it("returns null brokerage fields for a legacy trade", async () => {
    await database`
      INSERT INTO securities (item_code, stock_name, market, is_etf)
      VALUES ('BRK003', '레거시 거래', 'KRX', false)
    `;
    await database`
      INSERT INTO trades (owner_id, security_id, side, executed_at, quantity, unit_price)
      VALUES (1, (SELECT id FROM securities WHERE item_code = 'BRK003'), 'BUY', ${day(1)}, 1, 100)
    `;

    const history = await listTradeHistory("BUY", { q: "레거시 거래" }, database);
    expect(history.rows[0]).toMatchObject({ brokerageCode: null, brokerageName: null });
  });

  it("aggregates dashboard positions once per owner brokerage and stock", async () => {
    // Given: repeated buys at one brokerage, the same stock at another, and another owner's holding.
    await createTrade(
      {
        ...tradeCommon("BRK001", "증권사별 집계 하나"),
        executedAt: day(1),
        quantity: 1n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...tradeCommon("BRK001", "증권사별 집계 하나"),
        executedAt: day(2),
        quantity: 1n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...tradeCommon("BRK001", "증권사별 집계 하나"),
        brokerageCode: "240",
        executedAt: day(3),
        quantity: 2n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...tradeCommon("BRK002", "증권사별 집계 둘"),
        executedAt: day(4),
        quantity: 4n,
        side: "BUY",
        unitPrice: 100n,
      },
      database,
    );
    await createTrade(
      {
        ...tradeCommon("BRK002", "다른 소유주 집계"),
        executedAt: day(5),
        ownerId: 2,
        quantity: 1n,
        side: "BUY",
        unitPrice: 10_000n,
      },
      database,
    );

    // When: dashboard positions are loaded from PostgreSQL.
    const positions = (await getBaseDashboardPositions(database)).filter((position) =>
      testCodes.some((itemCode) => itemCode === position.itemCode),
    );

    // Then: duplicate buys collapse inside a brokerage and each brokerage's weights total 100%.
    const ownerPositions = positions.filter((position) => position.ownerId === 1);
    expect(ownerPositions).toHaveLength(3);
    expect(ownerPositions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          brokerageCode: "264",
          itemCode: "BRK001",
          quantity: "2",
          portfolioWeightPercent: "33.333333333333333333",
        }),
        expect.objectContaining({
          brokerageCode: "240",
          itemCode: "BRK001",
          quantity: "2",
          portfolioWeightPercent: "100",
        }),
        expect.objectContaining({
          brokerageCode: "264",
          itemCode: "BRK002",
          quantity: "4",
          portfolioWeightPercent: "66.666666666666666667",
        }),
      ]),
    );
    expect(positions.find((position) => position.ownerId === 2)).toMatchObject({
      portfolioWeightPercent: "100",
    });
  });

  it("rejects a well-shaped brokerage code that is not in the reference table", async () => {
    await expect(
      createTrade(
        {
          ...tradeCommon("BRK004", "알 수 없는 증권사"),
          brokerageCode: "999",
          executedAt: day(1),
          quantity: 1n,
          side: "BUY",
          unitPrice: 100n,
        },
        database,
      ),
    ).rejects.toMatchObject({ code: "INVALID_TRADE" });
  });
});
