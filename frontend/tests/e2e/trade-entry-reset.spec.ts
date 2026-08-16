import { expect, test } from "@playwright/test";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("거래 저장 E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const scenarios = [{ label: "매수" }, { label: "매도" }] as const;

test.beforeEach(async ({ page }) => {
  await page.route("**/api/v1/stocks/search**", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: [{ code: "005930", isEtf: false, market: "KOSPI", name: "삼성전자" }],
        success: true,
        timestamp: "2026-08-14T00:00:00",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/v1/trades/preview", async (route) => {
    const hasPosition = !route.request().postData()?.includes('"brokerageCode":"264"');
    await route.fulfill({
      body: JSON.stringify({
        data: {
          amount: hasPosition ? "777" : "70000",
          averageBuyPrice: hasPosition ? "70000" : null,
          expectedProfit: hasPosition ? "-222" : null,
          heldQuantity: hasPosition ? "10" : "0",
          quantityError: hasPosition ? null : "선택한 증권사에 보유 수량이\u00a0없습니다.",
        },
        success: true,
        timestamp: "2026-08-14T00:00:00",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.route("**/api/v1/trades", async (route) => {
    await route.fulfill({
      body: JSON.stringify({
        data: { id: "1" },
        success: true,
        timestamp: "2026-08-14T00:00:00",
      }),
      contentType: "application/json",
      status: 200,
    });
  });
});

test("매도 입력은 preview 응답의 금액과 예상 손익을 표시한다", async ({ page }) => {
  // Given: a sell form with a selected stock and valid numeric inputs.
  await page.goto("/record");
  const form = page.getByRole("region", { name: "매도 기록 추가" });
  const combobox = form.getByRole("combobox", { name: /종목명/ });
  await combobox.fill("삼성");
  await form.getByRole("option", { name: /삼성전자/ }).click();
  await form.getByLabel("증권사 (필수)").selectOption("240");
  await form.getByLabel("매도 수량 (필수)").fill("1");

  // When: the unit price completes a preview request.
  await form.getByLabel("매도 당시 단가 (필수)").fill("70000");

  // Then: the server-provided values, not a browser calculation, are rendered.
  await expect(form.getByText("777원", { exact: true })).toBeVisible();
  await expect(form.getByText("-222원", { exact: true })).toBeVisible();
});

for (const scenario of scenarios) {
  test(`${scenario.label} 저장 성공 후 종목명과 자동완성 목록을 초기화한다`, async ({ page }) => {
    // Given: a valid create form with a stock selected from autocomplete.
    await page.goto("/record");
    const form = page.getByRole("region", { name: `${scenario.label} 기록 추가` });
    const combobox = form.getByRole("combobox", { name: /종목명/ });
    await combobox.fill("삼성");
    await form.getByRole("option", { name: /삼성전자/ }).click();
    await form.getByLabel("증권사 (필수)").selectOption("240");
    await form.getByLabel(`${scenario.label} 수량 (필수)`).fill("1");
    await form.getByLabel(`${scenario.label} 당시 단가 (필수)`).fill("70000");

    // When: the create request succeeds.
    await form.getByRole("button", { name: `${scenario.label} 기록 저장` }).click();

    // Then: the stock field returns to its closed, empty state.
    await expect(form.getByText(`${scenario.label} 기록이 저장되었습니다.`)).toBeVisible();
    await expect(combobox).toHaveValue("");
    await expect(combobox).toHaveAttribute("aria-expanded", "false");
    await expect(form.getByRole("listbox")).toHaveCount(0);
    await expect(form.getByText(/선택: 삼성전자/)).toHaveCount(0);
  });
}

test("기록 페이지는 매수와 매도 입력 영역을 순서대로 노출한다", async ({ page }) => {
  // Given: the record page is opened.
  await page.goto("/record");
  const recordRegions = page.locator("main").getByRole("region");

  // When: the page is inspected.
  const recordLink = page.getByRole("link", { name: "기록하기", exact: true });

  // Then: the navigation is current and the forms are exposed in order.
  await expect(recordLink).toHaveAttribute("aria-current", "page");
  await expect(recordRegions).toHaveCount(2);
  await expect(recordRegions.nth(0)).toHaveAccessibleName("매수 기록 추가");
  await expect(recordRegions.nth(1)).toHaveAccessibleName("매도 기록 추가");
});

test("매수 히스토리는 입력 없이 검색 책임만 유지한다", async ({ page }) => {
  // Given: the buy history page is opened.
  await page.goto("/buy-history");

  // When: its actions are inspected.
  const createAction = page.getByRole("button", { name: "매수 기록 저장" });

  // Then: search remains available without the create action.
  await expect(createAction).toHaveCount(0);
  await expect(page.getByRole("button", { name: "검색 적용" })).toBeVisible();
});

test("매도 히스토리는 입력 없이 검색 책임만 유지한다", async ({ page }) => {
  // Given: the sell history page is opened.
  await page.goto("/sell-history");

  // When: its actions are inspected.
  const createAction = page.getByRole("button", { name: "매도 기록 저장" });

  // Then: search remains available without the create action.
  await expect(createAction).toHaveCount(0);
  await expect(page.getByRole("button", { name: "검색 적용" })).toBeVisible();
});

test("매도 수량 초안은 매수 저장 성공 후에도 독립적으로 유지된다", async ({ page }) => {
  // Given: the sell form contains an unsaved quantity draft.
  await page.goto("/record");
  const buyForm = page.getByRole("region", { name: "매수 기록 추가" });
  const sellForm = page.getByRole("region", { name: "매도 기록 추가" });
  await sellForm.getByLabel("매도 수량 (필수)").fill("3");

  // When: a valid buy record is submitted successfully.
  const buyCombobox = buyForm.getByRole("combobox", { name: /종목명/ });
  await buyCombobox.fill("삼성");
  await buyForm.getByRole("option", { name: /삼성전자/ }).click();
  await buyForm.getByLabel("증권사 (필수)").selectOption("240");
  await buyForm.getByLabel("매수 수량 (필수)").fill("1");
  await buyForm.getByLabel("매수 당시 단가 (필수)").fill("70000");
  await buyForm.getByRole("button", { name: "매수 기록 저장" }).click();

  // Then: the buy succeeds and the sell draft is unchanged.
  await expect(buyForm.getByText("매수 기록이 저장되었습니다.")).toBeVisible();
  await expect(sellForm.getByLabel("매도 수량 (필수)")).toHaveValue("3");
});

test("매수하지 않은 증권사에서는 매도 저장을 막는다", async ({ page }) => {
  // Given: the owner selects a stock at a brokerage where the position endpoint reports zero.
  await page.goto("/record");
  const sellForm = page.getByRole("region", { name: "매도 기록 추가" });
  const combobox = sellForm.getByRole("combobox", { name: /종목명/ });
  await combobox.fill("삼성");
  await sellForm.getByRole("option", { name: /삼성전자/ }).click();
  await sellForm.getByLabel("증권사 (필수)").selectOption("264");
  await sellForm.getByLabel("매도 수량 (필수)").fill("1");
  await sellForm.getByLabel("매도 당시 단가 (필수)").fill("70000");

  // When: the brokerage-scoped position finishes loading and the form is submitted.
  await expect(sellForm.getByText(/보유 0주 · 평균\s+-/)).toBeVisible();
  let tradeRequestCount = 0;
  page.on("request", (request) => {
    if (request.method() === "POST" && request.url().endsWith("/api/v1/trades")) {
      tradeRequestCount += 1;
    }
  });
  await sellForm.getByRole("button", { name: "매도 기록 저장" }).click();

  // Then: the client reports the missing brokerage inventory without sending a trade.
  await expect(sellForm.getByText("선택한 증권사에 보유 수량이 없습니다.")).toBeVisible();
  expect(tradeRequestCount).toBe(0);
});
