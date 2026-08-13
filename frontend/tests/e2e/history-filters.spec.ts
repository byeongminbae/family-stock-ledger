import { type APIRequestContext, expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("히스토리 필터 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const createdTradeIds: string[] = [];
const boughtStocks = [
  { code: "FILT01", name: "필터검색가" },
  { code: "FILT02", name: "필터검색나" },
] as const;

async function createBuy(request: APIRequestContext, stock: (typeof boughtStocks)[number]) {
  const response = await request.post("/api/trades", {
    data: {
      brokerageCode: "240",
      executedAt: "2026-08-09T10:00",
      isEtf: false,
      itemCode: stock.code,
      market: "KOSPI",
      ownerId: 1,
      quantity: "1",
      securityName: stock.name,
      side: "BUY",
      unitPrice: "10000",
    },
  });
  expect(response.ok()).toBe(true);
  const payload: unknown = await response.json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    typeof payload.id !== "string"
  ) {
    throw new Error("생성된 매수 기록 ID를 읽지 못했습니다.");
  }
  createdTradeIds.push(payload.id);
}

test.beforeEach(async ({ request }) => {
  createdTradeIds.length = 0;
  for (const stock of boughtStocks) await createBuy(request, stock);
});

test.afterEach(async ({ request }) => {
  if (createdTradeIds.length === 0) return;
  const response = await request.delete("/api/trades", {
    data: { ids: createdTradeIds, side: "BUY" },
  });
  expect(response.ok()).toBe(true);
});

test("매수 종목만 로컬 콤보박스에서 검색하고 종목 코드로 히스토리를 적용한다", async ({ page }) => {
  let marketSearchCalls = 0;
  await page.route("**/api/stocks/search**", async (route) => {
    marketSearchCalls += 1;
    await route.abort();
  });
  await page.goto("/buy-history");

  const combobox = page.getByRole("combobox", { name: "종목명 또는 종목코드" });
  await combobox.click();
  await expect(page.getByRole("option", { name: /필터검색가/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /필터검색나/ })).toBeVisible();

  await combobox.fill("나");
  await expect(page.getByRole("option", { name: /필터검색나/ })).toBeVisible();
  await expect(page.getByRole("option", { name: /필터검색가/ })).toHaveCount(0);
  await page.getByRole("option", { name: /필터검색나/ }).click();
  await page.getByRole("button", { name: "검색 적용" }).click();

  await expect(page).toHaveURL(/q=FILT02/);
  await expect(page.getByRole("row", { name: /필터검색나/ })).toBeVisible();
  expect(marketSearchCalls).toBe(0);
});

test("기간선택은 하나의 날짜 범위로 검증하고 하나의 필터 칩으로 적용한다", async ({ page }) => {
  await page.goto("/sell-history");

  await expect(page.locator('input[name$="Min"], input[name$="Max"]')).toHaveCount(0);
  await page.getByRole("button", { name: "기간선택", exact: true }).click();
  await expect(page.getByLabel("시작일")).toBeFocused();
  await page.getByLabel("시작일").fill("2026-07-23");
  await page.getByLabel("종료일").fill("2026-07-02");
  await page.getByRole("button", { name: "검색 적용" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "시작일은 종료일보다 늦을 수 없습니다." }),
  ).toHaveText("시작일은 종료일보다 늦을 수 없습니다.");
  await expect(page).toHaveURL(/\/sell-history$/);

  await page.getByLabel("시작일").fill("2026-07-02");
  await page.getByRole("button", { name: "검색 적용" }).click();
  await expect(page).toHaveURL(/from=2026-07-02.*to=2026-07-02/);
  await expect(page.getByRole("button", { name: "기간: 2026-07-02 ~ 2026-07-02" })).toBeVisible();
  await expect(page.getByRole("button", { name: /기간:/ })).toHaveCount(1);
});
