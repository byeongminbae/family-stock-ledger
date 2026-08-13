import { afterAll, beforeEach, describe, expect, it } from "vitest";

import { createDatabase } from "@/lib/db";
import { listPurchasedStocks } from "@/lib/domain/history";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (testDatabaseUrl === undefined) {
  throw new Error("통합 테스트에는 운영 DB가 아닌 TEST_DATABASE_URL을 명시해야 합니다.");
}
const database = createDatabase(testDatabaseUrl);
const testCodes = ["HIS001", "HIS002", "HIS003"] as const;

async function clearTestStocks(): Promise<void> {
  await database`DELETE FROM trades WHERE security_id IN (SELECT id FROM securities WHERE item_code IN ${database(testCodes)})`;
  await database`DELETE FROM securities WHERE item_code IN ${database(testCodes)}`;
}

beforeEach(clearTestStocks);
afterAll(async () => {
  await clearTestStocks();
  await database.end({ timeout: 5 });
});

describe("history stock search integration", () => {
  it("lists each purchased stock once and excludes securities without a buy", async () => {
    // Given: repeated buys, a sell, and a security that only has a sell.
    await database`
      INSERT INTO securities (item_code, stock_name, market, is_etf)
      VALUES
        ('HIS001', '가나다 매수 종목', 'KRX', false),
        ('HIS002', '나다라 매수 종목', 'KOSDAQ', true),
        ('HIS003', '매수 없는 종목', 'KRX', false)
    `;
    await database`
      INSERT INTO trades (owner_id, security_id, side, executed_at, quantity, unit_price, realized_profit)
      VALUES
        (1, (SELECT id FROM securities WHERE item_code = 'HIS001'), 'BUY', '2026-08-01T00:00:00Z', 1, 100, NULL),
        (2, (SELECT id FROM securities WHERE item_code = 'HIS001'), 'BUY', '2026-08-02T00:00:00Z', 1, 200, NULL),
        (1, (SELECT id FROM securities WHERE item_code = 'HIS001'), 'SELL', '2026-08-03T00:00:00Z', 1, 300, 200),
        (1, (SELECT id FROM securities WHERE item_code = 'HIS002'), 'BUY', '2026-08-04T00:00:00Z', 1, 400, NULL),
        (1, (SELECT id FROM securities WHERE item_code = 'HIS003'), 'SELL', '2026-08-05T00:00:00Z', 1, 500, 100)
    `;

    // When: the history stock search options are loaded.
    const stocks = await listPurchasedStocks(database);

    // Then: only bought securities appear once in readable stock-name order.
    expect(stocks.filter((stock) => stock.code.startsWith("HIS"))).toEqual([
      { code: "HIS001", name: "가나다 매수 종목", market: "KRX", isEtf: false },
      { code: "HIS002", name: "나다라 매수 종목", market: "KOSDAQ", isEtf: true },
    ]);
  });
});
