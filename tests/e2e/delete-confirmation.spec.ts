import { type APIRequestContext, expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("삭제 확인 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

interface BuyFixture {
  readonly brokerageCode: "240" | "264";
  readonly executedAt: string;
  readonly itemCode: string;
  readonly stockName: string;
}

const fixtures = [
  {
    brokerageCode: "240",
    executedAt: "2026-08-09T08:15",
    itemCode: "DEL001",
    stockName: "삭제확인 삼성 종목",
  },
  {
    brokerageCode: "264",
    executedAt: "2026-08-09T09:30",
    itemCode: "DEL002",
    stockName: "삭제확인 키움 종목",
  },
] as const satisfies readonly BuyFixture[];

const createdTradeIds: string[] = [];

async function createBuy(request: APIRequestContext, fixture: BuyFixture): Promise<void> {
  const response = await request.post("/api/trades", {
    data: {
      brokerageCode: fixture.brokerageCode,
      executedAt: fixture.executedAt,
      isEtf: false,
      itemCode: fixture.itemCode,
      market: "KOSPI",
      ownerId: 1,
      quantity: "1",
      securityName: fixture.stockName,
      side: "BUY",
      unitPrice: "100000",
    },
  });
  expect(response.ok()).toBe(true);
  const body: unknown = await response.json();
  if (typeof body !== "object" || body === null || !("id" in body) || typeof body.id !== "string") {
    throw new Error("생성한 매수 기록 ID를 읽지 못했습니다.");
  }
  createdTradeIds.push(body.id);
}

test.beforeEach(async ({ request }) => {
  createdTradeIds.length = 0;
  for (const fixture of fixtures) await createBuy(request, fixture);
});

test.afterEach(async ({ request }) => {
  if (createdTradeIds.length === 0) return;
  const response = await request.delete("/api/trades", {
    data: { ids: createdTradeIds, side: "BUY" },
  });
  expect(response.ok()).toBe(true);
});

test("선택 삭제 경고는 매수 일시와 종목명, 증권사를 기록별로 보여준다", async ({ page }) => {
  // Given: two selected buy histories from different brokerages.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/buy-history");
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  for (const fixture of fixtures) {
    await page
      .getByRole("row", { name: new RegExp(fixture.stockName) })
      .getByRole("checkbox")
      .check();
  }

  // When: the deletion confirmation opens.
  await page.getByRole("button", { name: "선택 삭제" }).click();

  // Then: every deletion target is identifiable before confirmation.
  const dialog = page.getByRole("dialog", { name: "매수 기록 삭제" });
  const list = dialog.getByRole("list", { name: "삭제할 매수 기록" });
  await expect(list.getByRole("listitem")).toHaveCount(2);

  const samsung = list.getByRole("listitem").filter({ hasText: fixtures[0].stockName });
  await expect(samsung).toContainText("2026. 8. 9. 오전 8:15");
  await expect(samsung).toContainText("삼성증권");

  const kiwoom = list.getByRole("listitem").filter({ hasText: fixtures[1].stockName });
  await expect(kiwoom).toContainText("2026. 8. 9. 오전 9:30");
  await expect(kiwoom).toContainText("키움증권");

  await page.setViewportSize({ width: 375, height: 812 });
  await expect(list).toBeVisible();
  const overflow = await dialog.evaluate((element) => element.scrollWidth - element.clientWidth);
  expect(overflow).toBe(0);
});
