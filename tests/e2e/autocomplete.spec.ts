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
