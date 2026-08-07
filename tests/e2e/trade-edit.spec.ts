import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("거래 수정 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const evidenceDirectory = path.resolve(".omo/evidence/trade-edit-20260807");

const stockSearchResponse = {
  items: [
    { code: "005930", isEtf: false, market: "KOSPI", name: "삼성전자" },
    { code: "000660", isEtf: false, market: "KOSPI", name: "SK하이닉스" },
  ],
} as const;
const createdTradeIds: Record<"BUY" | "SELL", string[]> = { BUY: [], SELL: [] };

async function selectStock(page: Page, name: string): Promise<void> {
  const combobox = page.getByRole("combobox", { name: /종목명/ });
  await combobox.fill(name.slice(0, 2));
  await expect(page.getByRole("option", { name: new RegExp(name) }).first()).toBeVisible();
  await combobox.press("Enter");
  await expect(page.getByText(new RegExp(`선택: ${name}`))).toBeVisible();
}

async function addTrade(
  page: Page,
  side: "매수" | "매도",
  executedAt: string,
  quantity: string,
  unitPrice: string,
): Promise<void> {
  const historyRows = page.locator("table tbody tr");
  const previousRowCount = await historyRows.count();
  await page.getByLabel(`${side} 일시 (필수)`).fill(executedAt);
  await selectStock(page, "삼성전자");
  await page.getByLabel(`${side} 수량 (필수)`).fill(quantity);
  await page.getByLabel(`${side} 당시 단가 (필수)`).fill(unitPrice);
  const responsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" && new URL(response.url()).pathname === "/api/trades",
  );
  await page.getByRole("button", { name: `${side} 기록 저장` }).click();
  const payload: unknown = await (await responsePromise).json();
  if (
    typeof payload !== "object" ||
    payload === null ||
    !("id" in payload) ||
    typeof payload.id !== "string"
  ) {
    throw new Error("생성된 거래 ID를 읽을 수 없습니다.");
  }
  createdTradeIds[side === "매수" ? "BUY" : "SELL"].push(payload.id);
  await expect(page.getByText(`${side} 기록이 저장되었습니다.`)).toBeVisible();
  await expect(historyRows).toHaveCount(previousRowCount + 1);
}

async function screenshot(page: Page, name: string, fullPage = true): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  const captureStyle = fullPage
    ? await page.addStyleTag({ content: ".app-header { position: static !important; }" })
    : null;
  try {
    if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ fullPage, path: path.join(evidenceDirectory, name) });
  } finally {
    await captureStyle?.evaluate((element) => element.parentNode?.removeChild(element));
  }
}

function editAction(row: Locator): Locator {
  return row.getByRole("button", { name: "수정" });
}

test.beforeEach(async ({ page }) => {
  createdTradeIds.BUY = [];
  createdTradeIds.SELL = [];
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      body: JSON.stringify(stockSearchResponse),
      contentType: "application/json",
      status: 200,
    });
  });
});

test.afterEach(async ({ request }) => {
  for (const side of ["SELL", "BUY"] as const) {
    const ids = createdTradeIds[side];
    if (ids.length === 0) continue;
    const response = await request.delete("/api/trades", { data: { ids, side } });
    expect(response.ok()).toBe(true);
  }
});

test("creates chronological trades then edits buy and sell through the accessible history dialog", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await mkdir(evidenceDirectory, { recursive: true });
  await page.setViewportSize({ width: 1280, height: 900 });

  await page.goto("/buy-history");
  await addTrade(page, "매수", "2026-08-07T09:00", "100", "7000");
  await addTrade(page, "매수", "2026-08-07T10:00", "100", "8000");

  await page.goto("/sell-history");
  await addTrade(page, "매도", "2026-08-07T11:00", "50", "9000");
  await expect(page.getByText(/이익 \+75,000원/).first()).toBeVisible();

  await page.goto("/buy-history");
  const buyRow = page.getByRole("row", { name: /삼성전자.*100주.*7,000원/ });
  const buyEdit = editAction(buyRow);
  await expect(buyEdit).toBeVisible();
  await screenshot(page, "buy-history-edit-action-desktop-1280.png");

  await buyEdit.click();
  const buyDialog = page.getByRole("dialog", { name: "매수 기록 수정" });
  await expect(buyDialog).toBeVisible();
  await expect(buyDialog.getByLabel("매수 일시 (필수)")).toHaveValue("2026-08-07T09:00");
  await expect(buyDialog.getByText(/선택: 삼성전자/)).toBeVisible();
  await expect(buyDialog.getByLabel("소유주 (필수)")).toHaveValue("1");
  await expect(buyDialog.getByLabel("매수 수량 (필수)")).toHaveValue("100");
  await expect(buyDialog.getByLabel("매수 당시 단가 (필수)")).toHaveValue("7000");
  await expect(buyDialog.getByText("700,000원")).toBeVisible();
  await screenshot(page, "buy-edit-dialog-desktop-1280.png", false);
  await page.keyboard.press("Escape");
  await expect(buyDialog).toBeHidden();
  await expect(buyEdit).toBeFocused();

  await buyEdit.click();
  await buyDialog.getByLabel("매수 일시 (필수)").fill("2026-08-07T09:30");
  await buyDialog.getByLabel("매수 수량 (필수)").fill("120");
  await buyDialog.getByRole("button", { name: "매수 기록 수정" }).click();
  await expect(buyDialog).toBeHidden();
  await expect(page.getByText("매수 기록을 수정했습니다.", { exact: true })).toBeVisible();
  await expect(page.getByRole("row", { name: /삼성전자.*120주.*7,000원/ })).toBeVisible();

  await page.goto("/sell-history");
  await expect(page.getByText(/이익 \+77,273원/).first()).toBeVisible();
  const sellRow = page.getByRole("row", { name: /삼성전자.*50주.*9,000원/ });
  const sellEdit = editAction(sellRow);
  await sellEdit.click();
  const sellDialog = page.getByRole("dialog", { name: "매도 기록 수정" });
  await expect(sellDialog.getByText("손익 재계산")).toBeVisible();
  await expect(
    sellDialog.getByText(/저장 시 거래 시각 순으로 이 매도와 이후 손익을 다시 계산합니다/),
  ).toBeVisible();
  await sellDialog.getByLabel("매도 일시 (필수)").fill("2026-08-07T12:00");
  await sellDialog.getByLabel("매도 당시 단가 (필수)").fill("10000");
  await sellDialog.getByRole("button", { name: "매도 기록 수정" }).click();
  await expect(sellDialog).toBeHidden();
  await expect(page.getByRole("row", { name: /삼성전자.*50주.*10,000원/ })).toBeVisible();
  await expect(page.getByText(/이익 \+127,273원/).first()).toBeVisible();
  await screenshot(page, "sell-history-edited-desktop-1280.png");

  await page.goto("/buy-history");
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await expect(page.getByRole("button", { name: "수정" })).toHaveCount(0);
  await page.getByRole("button", { name: "취소" }).click();

  await page.setViewportSize({ width: 375, height: 812 });
  const mobileEdit = page.getByRole("button", { name: "수정" }).first();
  await expect(mobileEdit).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    ),
  ).toBe(0);
  await screenshot(page, "buy-history-edited-mobile-375.png");

  await page.setViewportSize({ width: 375, height: 1200 });
  await mobileEdit.click();
  await expect(buyDialog).toBeVisible();
  await expect(buyDialog.getByLabel("매수 일시 (필수)")).toBeFocused();
  const mobileCancel = buyDialog.getByRole("button", { name: "취소" });
  expect(await buyDialog.evaluate((dialog) => dialog.scrollWidth - dialog.clientWidth)).toBe(0);
  await screenshot(page, "buy-edit-dialog-mobile-375.png", false);
  await mobileCancel.click();
  await expect(mobileEdit).toBeFocused();
});
