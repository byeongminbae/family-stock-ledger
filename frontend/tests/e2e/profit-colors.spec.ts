import { type APIRequestContext, expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("손익 색상 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const scenarios = [
  {
    background: "rgb(255, 237, 240)",
    code: "CLR001",
    name: "색상검증 이익",
    profitClass: ".positive",
    sellPrice: "120000",
    textColor: "rgb(189, 38, 58)",
    tone: "gain",
  },
  {
    background: "rgb(232, 241, 255)",
    code: "CLR002",
    name: "색상검증 손실",
    profitClass: ".negative",
    sellPrice: "80000",
    textColor: "rgb(20, 86, 192)",
    tone: "loss",
  },
] as const;

const neutralScenario = {
  code: "CLR003",
  name: "색상검증 보합",
  sellPrice: "100000",
} as const;

interface TradeFixture {
  readonly code: string;
  readonly executedAt: string;
  readonly name: string;
  readonly side: "BUY" | "SELL";
  readonly unitPrice: string;
}

const createdTradeIds: Record<TradeFixture["side"], string[]> = { BUY: [], SELL: [] };

async function createTrade(request: APIRequestContext, fixture: TradeFixture): Promise<void> {
  const response = await request.post("/api/v1/trades", {
    data: {
      brokerageCode: "240",
      executedAt: fixture.executedAt,
      isEtf: false,
      itemCode: fixture.code,
      market: "KOSPI",
      ownerId: 1,
      quantity: fixture.side === "BUY" ? "2" : "1",
      securityName: fixture.name,
      side: fixture.side,
      unitPrice: fixture.unitPrice,
    },
  });
  expect(response.ok()).toBe(true);
  const payload: unknown = await response.json();
  const data =
    typeof payload === "object" && payload !== null && "data" in payload ? payload.data : null;
  if (typeof data !== "object" || data === null || !("id" in data) || typeof data.id !== "string") {
    throw new Error("생성된 거래 ID를 읽지 못했습니다.");
  }
  createdTradeIds[fixture.side].push(data.id);
}

test.beforeEach(async ({ request }) => {
  createdTradeIds.BUY = [];
  createdTradeIds.SELL = [];
  const fixtures = [...scenarios, neutralScenario];
  for (const [index, scenario] of fixtures.entries()) {
    await createTrade(request, {
      code: scenario.code,
      executedAt: `2026-08-09T09:${String(index).padStart(2, "0")}`,
      name: scenario.name,
      side: "BUY",
      unitPrice: "100000",
    });
  }
  for (const [index, scenario] of fixtures.entries()) {
    await createTrade(request, {
      code: scenario.code,
      executedAt: `2026-08-09T10:${String(index).padStart(2, "0")}`,
      name: scenario.name,
      side: "SELL",
      unitPrice: scenario.sellPrice,
    });
  }
});

test.afterEach(async ({ request }) => {
  for (const side of ["SELL", "BUY"] as const) {
    const ids = createdTradeIds[side];
    if (ids.length === 0) continue;
    const response = await request.delete("/api/v1/trades", { data: { ids, side } });
    expect(response.ok()).toBe(true);
  }
});

test("매도 손익은 이익을 빨간색, 손실을 파란색으로 표시하고 행 전체를 은은하게 강조한다", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto("/sell-history");

  for (const scenario of scenarios) {
    const row = page.getByRole("row", { name: new RegExp(scenario.name) });
    await expect(row).toHaveAttribute("data-profit-tone", scenario.tone);
    await expect(row).toHaveCSS("background-color", scenario.background);
    await expect(row.locator(scenario.profitClass)).toHaveCSS("color", scenario.textColor);
  }

  const neutralRow = page.getByRole("row", { name: new RegExp(neutralScenario.name) });
  expect(await neutralRow.getAttribute("data-profit-tone")).toBeNull();
  await expect(neutralRow.locator(".positive, .negative")).toHaveCount(0);

  await page.setViewportSize({ width: 375, height: 812 });
  for (const scenario of scenarios) {
    const card = page
      .locator('article[aria-labelledby^="trade-card-"]')
      .filter({ hasText: scenario.name });
    await expect(card).toHaveAttribute("data-profit-tone", scenario.tone);
    await expect(card).toHaveCSS("background-color", scenario.background);
    await expect(card.locator(scenario.profitClass)).toHaveCSS("color", scenario.textColor);
  }

  const neutralCard = page
    .locator('article[aria-labelledby^="trade-card-"]')
    .filter({ hasText: neutralScenario.name });
  expect(await neutralCard.getAttribute("data-profit-tone")).toBeNull();
  await expect(neutralCard.locator(".positive, .negative")).toHaveCount(0);
});
