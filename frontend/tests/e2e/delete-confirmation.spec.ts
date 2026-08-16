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
  const response = await request.post("/api/v1/trades", {
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
  const data = typeof body === "object" && body !== null && "data" in body ? body.data : null;
  if (typeof data !== "object" || data === null || !("id" in data) || typeof data.id !== "string") {
    throw new Error("생성한 매수 기록 ID를 읽지 못했습니다.");
  }
  createdTradeIds.push(data.id);
}

test.beforeEach(async ({ request }) => {
  createdTradeIds.length = 0;
  for (const fixture of fixtures) await createBuy(request, fixture);
});

test.afterEach(async ({ request }) => {
  if (createdTradeIds.length === 0) return;
  const response = await request.delete("/api/v1/trades", {
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

test("삭제 문구가 정확하지 않으면 선택 기록 삭제를 허용하지 않는다", async ({ page }) => {
  // Given: one selected buy history in the deletion confirmation dialog.
  await page.goto("/buy-history");
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const targetRow = page.getByRole("row", { name: new RegExp(fixtures[0].stockName) });
  await targetRow.getByRole("checkbox").check();
  await page.getByRole("button", { name: "선택 삭제" }).click();
  const dialog = page.getByRole("dialog", { name: "매수 기록 삭제" });
  const deleteButton = dialog.getByRole("button", { name: "삭제", exact: true });

  // When: the confirmation includes a trailing space.
  await dialog.getByLabel("삭제 확인").fill("삭제 ");

  // Then: deletion remains unavailable and the selected row remains.
  await expect(deleteButton).toBeDisabled();
  await expect(targetRow).toBeVisible();
});

test("삭제 문구를 정확히 입력하면 선택 기록을 삭제한다", async ({ page }) => {
  // Given: one selected buy history and an open deletion confirmation dialog.
  await page.goto("/buy-history");
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const targetRow = page.getByRole("row", { name: new RegExp(fixtures[0].stockName) });
  await targetRow.getByRole("checkbox").check();
  await page.getByRole("button", { name: "선택 삭제" }).click();
  const dialog = page.getByRole("dialog", { name: "매수 기록 삭제" });
  await dialog.getByLabel("삭제 확인").fill("삭제");

  // When: the enabled confirmation button is pressed.
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "DELETE" && response.url().endsWith("/api/v1/trades"),
  );
  await dialog.getByRole("button", { name: "삭제", exact: true }).click();

  // Then: one deletion request succeeds and the selected row disappears.
  await expect((await responsePromise).ok()).toBe(true);
  await expect(page.getByText("매수 기록 1건을 삭제했습니다.")).toBeVisible();
  await expect(targetRow).toHaveCount(0);
  createdTradeIds.splice(0, 1);
});
