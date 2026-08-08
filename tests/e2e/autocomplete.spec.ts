import { expect, test } from "@playwright/test";

const stockSearchResponse = {
  items: [
    {
      code: "005930",
      isEtf: false,
      market: "KOSPI",
      name: "삼성전자",
    },
  ],
} as const;

async function enterComposingKorean(locator: import("@playwright/test").Locator): Promise<void> {
  await locator.dispatchEvent("compositionstart", { data: "" });
  await locator.evaluate((element) => {
    if (!(element instanceof HTMLInputElement)) {
      throw new TypeError("종목 검색 입력을 찾지 못했습니다.");
    }
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value");
    descriptor?.set?.call(element, "삼성");
    element.dispatchEvent(
      new InputEvent("input", {
        bubbles: true,
        data: "성",
        inputType: "insertCompositionText",
        isComposing: true,
      }),
    );
  });
}

test.beforeEach(async ({ page }) => {
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({
      body: JSON.stringify(stockSearchResponse),
      contentType: "application/json",
      status: 200,
    });
  });
  await page.goto("/buy-history");
});

test("한글을 조합하는 동안 검색하고 Enter가 폼을 제출하지 않는다", async ({ page }) => {
  const combobox = page.getByRole("combobox", { name: /종목명/ });
  await enterComposingKorean(combobox);

  await expect(page.getByRole("option", { name: /삼성전자/ })).toBeVisible();
  await combobox.press("Enter");
  await expect(page.getByText("입력 내용을 확인해 주세요.")).toHaveCount(0);
  await expect(page.getByText(/선택: 삼성전자/)).toHaveCount(0);

  await combobox.dispatchEvent("compositionend", { data: "삼성" });
  await combobox.press("Enter");
  await expect(page.getByText(/선택: 삼성전자/)).toBeVisible();
});

test("한글 종목 선택 뒤 거래 숫자 필드가 IME 입력 힌트를 바꾸지 않는다", async ({ page }) => {
  const combobox = page.getByRole("combobox", { name: /종목명/ });
  await combobox.fill("삼성");
  await page.getByRole("option", { name: /삼성전자/ }).click();

  const quantity = page.getByLabel("매수 수량 (필수)");
  const unitPrice = page.getByLabel("매수 당시 단가 (필수)");
  for (const field of [quantity, unitPrice]) {
    await expect(field).toHaveAttribute("type", "text");
    expect(await field.getAttribute("inputmode")).toBeNull();
    expect(await field.getAttribute("min")).toBeNull();
    expect(await field.getAttribute("step")).toBeNull();
  }

  await quantity.click();
  await expect(quantity).toBeFocused();
  await quantity.fill("10");
  await unitPrice.click();
  await expect(unitPrice).toBeFocused();
  await unitPrice.fill("70000");

  await expect(quantity).toHaveValue("10");
  await expect(unitPrice).toHaveValue("70000");
  await expect(page.getByText("700,000원", { exact: true })).toBeVisible();
});

test("검색 범위 숫자 필드도 IME 입력 힌트 없이 기존 정수 검증을 유지한다", async ({ page }) => {
  const rangeInputs = page.locator('input[name$="Min"], input[name$="Max"]');
  await expect(rangeInputs).toHaveCount(6);
  const attributes = await rangeInputs.evaluateAll((elements) =>
    elements.map((element) => ({
      inputMode: element.getAttribute("inputmode"),
      min: element.getAttribute("min"),
      step: element.getAttribute("step"),
      type: element.getAttribute("type"),
    })),
  );
  expect(attributes).toEqual(
    Array.from({ length: 6 }, () => ({ inputMode: null, min: null, step: null, type: "text" })),
  );

  await page.locator('input[name="quantityMin"]').fill("한글");
  await page.getByRole("button", { name: "검색 적용" }).click();

  await expect(
    page.getByRole("alert").filter({ hasText: "수량 범위는 정수로 입력해 주세요." }),
  ).toHaveText("수량 범위는 정수로 입력해 주세요.");
  await expect(page).toHaveURL(/\/buy-history$/);
});

test("새 검색 응답을 기다리는 Enter는 보이는 첫 종목을 선택한다", async ({ page }) => {
  const combobox = page.getByRole("combobox", { name: /종목명/ });
  await combobox.fill("삼성");
  await expect(page.getByRole("option", { name: /삼성전자/ })).toBeVisible();

  await combobox.fill("삼성전");
  await combobox.press("Enter");

  await expect(page.getByText("입력 내용을 확인해 주세요.")).toHaveCount(0);
  await expect(page.getByText(/선택: 삼성전자/)).toHaveCount(0);
  await expect(page.getByRole("option", { name: /삼성전자/ })).toBeVisible();

  await combobox.press("Enter");
  await expect(page.getByText(/선택: 삼성전자/)).toBeVisible();
});

test("검색 실패 상태에서도 combobox 연결과 안내를 유지한다", async ({ page }) => {
  await page.unroute("**/api/stocks/search**");
  await page.route("**/api/stocks/search**", async (route) => {
    await route.fulfill({ body: "{}", contentType: "application/json", status: 500 });
  });

  const combobox = page.getByRole("combobox", { name: /종목명/ });
  await combobox.fill("삼성");

  const describedBy = await combobox.getAttribute("aria-describedby");
  const statusId = describedBy?.split(/\s+/).at(-1);
  expect(statusId).toBeTruthy();
  await expect(page.locator(`[id="${statusId}"]`)).toContainText("종목 검색에 실패했습니다.");

  const controlledId = await combobox.getAttribute("aria-controls");
  expect(controlledId).not.toBeNull();
  await expect(page.locator(`[id="${controlledId}"]`)).toHaveAttribute("role", "listbox");
});
