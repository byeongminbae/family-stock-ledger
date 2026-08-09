import { expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("거래 저장 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const scenarios = [
  { label: "매수", path: "/buy-history" },
  { label: "매도", path: "/sell-history" },
] as const;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        items: [{ code: "005930", isEtf: false, market: "KOSPI", name: "삼성전자" }],
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/positions/average**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ averageBuyPrice: "70000", heldQuantity: "10" }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/trades", async (route) => {
    await route.fulfill({
      body: JSON.stringify({ id: "1", ok: true }),
      contentType: "application/json",
      status: 200,
    });
  });
});

for (const scenario of scenarios) {
  test(`${scenario.label} 저장 성공 후 종목명과 자동완성 목록을 초기화한다`, async ({ page }) => {
    // Given: a valid create form with a stock selected from autocomplete.
    await page.goto(scenario.path);
    const combobox = page.getByRole("combobox", { name: /종목명/ });
    await combobox.fill("삼성");
    await page.getByRole("option", { name: /삼성전자/ }).click();
    await page.getByLabel("증권사 (필수)").selectOption("240");
    await page.getByLabel(`${scenario.label} 수량 (필수)`).fill("1");
    await page.getByLabel(`${scenario.label} 당시 단가 (필수)`).fill("70000");

    // When: the create request succeeds.
    await page.getByRole("button", { name: `${scenario.label} 기록 저장` }).click();

    // Then: the stock field returns to its closed, empty state.
    await expect(page.getByText(`${scenario.label} 기록이 저장되었습니다.`)).toBeVisible();
    await expect(combobox).toHaveValue("");
    await expect(combobox).toHaveAttribute("aria-expanded", "false");
    await expect(page.getByRole("listbox")).toHaveCount(0);
    await expect(page.getByText(/선택: 삼성전자/)).toHaveCount(0);
  });
}
