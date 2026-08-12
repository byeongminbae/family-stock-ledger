import { mkdir } from "node:fs/promises";
import path from "node:path";
import { expect, type Locator, type Page, test } from "@playwright/test";

import { openDeletionConfirmation, submitDeletionConfirmation } from "./helpers/trade-deletion";

if (process.env.PLAYWRIGHT_BASE_URL === undefined) {
  throw new Error("실데이터를 변경하는 journal E2E에는 격리된 PLAYWRIGHT_BASE_URL이 필요합니다.");
}

const evidenceDirectory = path.resolve(".omo/evidence/jusik-autocomplete-delete-qa-final");

const routes = [
  { name: "dashboard", path: "/" },
  { name: "record", path: "/record" },
  { name: "buy-history", path: "/buy-history" },
  { name: "sell-history", path: "/sell-history" },
] as const;

const viewports = [
  { name: "mobile-375", width: 375, height: 812 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1280", width: 1280, height: 900 },
] as const;

async function waitForRouteReady(page: Page, route: (typeof routes)[number]): Promise<void> {
  await expect(page.locator("h1")).toBeVisible();
  if (route.path === "/") {
    await expect(page.getByText("전체 보유 현황")).toBeVisible();
    return;
  }

  if (route.path === "/record") {
    await expect(page.getByRole("region", { name: "매수 기록 추가" })).toBeVisible();
    await expect(page.getByRole("region", { name: "매도 기록 추가" })).toBeVisible();
    return;
  }

  await expect(page.getByRole("button", { name: "검색 적용" })).toBeVisible();
  await expect(page.getByRole("button", { name: /기록 저장/ })).toHaveCount(0);
}

function tradeRegion(page: Page, side: "매수" | "매도"): Locator {
  return page.getByRole("region", { name: `${side} 기록 추가` });
}

async function selectStock(region: Locator, query: string, expectedName: string) {
  const combobox = region.getByRole("combobox", { name: /종목명/ });
  await combobox.fill(query);
  await expect(
    region.getByRole("option", { name: new RegExp(expectedName) }).first(),
  ).toBeVisible();
  await combobox.press("ArrowDown");
  await combobox.press("ArrowUp");
  await combobox.press("Enter");
  await expect(region.getByText(new RegExp(`선택: ${expectedName}`))).toBeVisible();
}

async function capture(page: Page, name: string, fullPage = true) {
  await page.evaluate(() => document.fonts.ready);
  const captureStyle = fullPage
    ? await page.addStyleTag({ content: ".app-header { position: static !important; }" })
    : null;
  try {
    if (fullPage) await page.evaluate(() => window.scrollTo(0, 0));
    await page.screenshot({ fullPage, path: path.join(evidenceDirectory, name) });
  } finally {
    await captureStyle?.evaluate((element) => {
      element.parentNode?.removeChild(element);
    });
  }
}

async function addTrade(
  page: Page,
  side: "매수" | "매도",
  stock: { readonly query: string; readonly name: string },
  quantity: string,
  price: string,
  owner: "병민" | "할머니" | "아빠" = "병민",
) {
  const region = tradeRegion(page, side);
  await selectStock(region, stock.query, stock.name);
  await region.getByLabel("증권사 (필수)").selectOption("240");
  await region.getByLabel("소유주 (필수)").selectOption({ label: owner });
  await region.getByLabel(`${side} 수량 (필수)`).fill(quantity);
  await region.getByLabel(`${side} 당시 단가 (필수)`).fill(price);
  await region.getByRole("button", { name: `${side} 기록 저장` }).click();
  await expect(region.getByText(`${side} 기록이 저장되었습니다.`)).toBeVisible();
}

test("real journal flow and complete responsive capture set", async ({ page }) => {
  test.setTimeout(90_000);
  await mkdir(evidenceDirectory, { recursive: true });

  await page.setViewportSize({ width: 1280, height: 900 });
  for (const route of routes) {
    await page.goto(route.path);
    await waitForRouteReady(page, route);
    await capture(page, `${route.name}-empty-1280.png`);
  }

  await page.goto("/record");
  const buyRegion = tradeRegion(page, "매수");
  await buyRegion.getByRole("button", { name: "매수 기록 저장" }).click();
  await expect(page.getByText("입력 내용을 확인해 주세요.")).toBeVisible();
  await capture(page, "record-validation-error-1280.png");

  await page.goto("/record");
  await buyRegion.getByLabel("매수 일시 (필수)").fill("2026-08-07T10:30");
  const stockSearch = buyRegion.getByRole("combobox", { name: /종목명/ });
  await stockSearch.fill("삼성");
  await expect(buyRegion.getByRole("option", { name: /삼성전자/ }).first()).toBeVisible();
  await capture(page, "record-stock-search-popover-1280.png");
  await stockSearch.fill("");
  await addTrade(page, "매수", { query: "삼성", name: "삼성전자" }, "10", "70000");
  await capture(page, "record-buy-submission-success-1280.png");
  await page.goto("/buy-history");
  await expect(page.getByRole("row", { name: /삼성전자.*삼성증권/ })).toBeVisible();
  await page.goto("/record");
  await addTrade(page, "매수", { query: "하이닉스", name: "SK하이닉스" }, "5", "100000");
  await addTrade(page, "매수", { query: "삼성", name: "삼성전자" }, "3", "80000", "할머니");

  const sellRegion = tradeRegion(page, "매도");
  await sellRegion.getByLabel("매도 일시 (필수)").fill("2026-08-07T11:00");
  await addTrade(page, "매도", { query: "삼성", name: "삼성전자" }, "2", "90000");
  await page.goto("/sell-history");
  await expect(page.getByText(/이익 \+40,000원/).first()).toBeVisible();

  await page.goto("/record");
  await selectStock(sellRegion, "삼성", "삼성전자");
  await sellRegion.getByLabel("증권사 (필수)").selectOption("240");
  await sellRegion.getByLabel("매도 수량 (필수)").fill("99");
  await sellRegion.getByLabel("매도 당시 단가 (필수)").fill("90000");
  await sellRegion.getByRole("button", { name: "매도 기록 저장" }).click();
  await expect(sellRegion.getByText(/보유 수량 8주를 초과할 수 없습니다/)).toBeVisible();
  await capture(page, "record-sell-oversell-error-1280.png");

  await page.goto("/buy-history");
  await page.getByLabel("증권사", { exact: true }).selectOption("240");
  await page.getByRole("button", { name: "검색 적용" }).click();
  await expect(page).toHaveURL(/brokerageCode=240/);
  await expect(page.getByRole("button", { name: /증권사: 삼성증권/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /삼성증권/ })).toHaveCount(3);
  await page.getByRole("button", { name: "전체 초기화" }).click();
  await expect(page).toHaveURL(/\/buy-history$/);
  await page.getByLabel("종목명 또는 종목코드").fill("하이닉스");
  await page.getByRole("button", { name: "검색 적용" }).click();
  await expect(page.getByText("검색 결과 1건")).toBeVisible();
  await expect(page.getByRole("row", { name: /SK하이닉스/ })).toBeVisible();
  await page.goto("/buy-history?q=하이닉스");
  await expect(page.getByText("검색 결과 1건")).toBeVisible();
  await capture(page, "buy-history-filter-applied-1280.png");
  await page.getByRole("button", { name: "전체 초기화" }).click();
  await expect(page.getByText("전체 3건")).toBeVisible();
  await page.goto("/buy-history");
  await expect(page.getByText("전체 3건")).toBeVisible();
  await capture(page, "buy-history-filter-cleared-1280.png");

  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const oversoldBuy = page.getByRole("row", { name: /삼성전자.*병민.*10주/ });
  await oversoldBuy.getByRole("checkbox").check();
  const rejectedBuyDialog = await openDeletionConfirmation({
    count: 1,
    page,
    side: "매수",
    trigger: page.getByRole("button", { name: "선택 삭제" }),
  });
  await capture(page, "buy-history-delete-confirmation-1280.png", false);
  await submitDeletionConfirmation(rejectedBuyDialog);
  await expect(
    page.getByText(/삭제에 실패했습니다. 어떤 기록도 삭제되지 않았습니다/),
  ).toBeVisible();
  await expect(page.getByText(/이후 매도 시점의 보유 수량이 부족/)).toBeVisible();
  await expect(oversoldBuy).toBeVisible();
  await capture(page, "buy-history-delete-rollback-error-1280.png");
  await page.getByRole("button", { name: "취소" }).click();

  await page.getByRole("button", { name: "삭제", exact: true }).click();
  const hynixBuy = page.getByRole("row", { name: /SK하이닉스.*병민.*5주/ });
  await hynixBuy.getByRole("checkbox").check();
  await capture(page, "buy-history-delete-selection-1280.png");
  const dismissedBuyTrigger = page.getByRole("button", { name: "선택 삭제" });
  const dismissedBuyDialog = await openDeletionConfirmation({
    count: 1,
    page,
    side: "매수",
    trigger: dismissedBuyTrigger,
  });
  await page.keyboard.press("Escape");
  await expect(dismissedBuyDialog).toBeHidden();
  await expect(dismissedBuyTrigger).toBeFocused();
  await expect(page.getByText("1건 선택됨")).toBeVisible();
  await capture(page, "buy-history-delete-confirmation-dismissed-1280.png");
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.getByRole("checkbox", { name: /SK하이닉스 거래 선택/ })).toBeChecked();
  await capture(page, "buy-history-delete-selection-mobile-375.png");
  await page.setViewportSize({ width: 1280, height: 900 });
  const acceptedBuyDialog = await openDeletionConfirmation({
    count: 1,
    page,
    side: "매수",
    trigger: page.getByRole("button", { name: "선택 삭제" }),
  });
  await submitDeletionConfirmation(acceptedBuyDialog);
  await expect(page.getByText("매수 기록 1건을 삭제했습니다.")).toBeVisible();
  await expect(page.getByRole("row", { name: /SK하이닉스/ })).toHaveCount(0);

  await page.goto("/sell-history");
  await page.getByRole("button", { name: "삭제", exact: true }).click();
  await page
    .getByRole("row", { name: /삼성전자.*병민.*2주/ })
    .getByRole("checkbox")
    .check();
  await capture(page, "sell-history-delete-selection-1280.png");
  const acceptedSellDialog = await openDeletionConfirmation({
    count: 1,
    page,
    side: "매도",
    trigger: page.getByRole("button", { name: "선택 삭제" }),
  });
  await capture(page, "sell-history-delete-confirmation-1280.png", false);
  await submitDeletionConfirmation(acceptedSellDialog);
  await expect(page.getByText("매도 기록 1건을 삭제했습니다.")).toBeVisible();
  await expect(page.getByText("아직 매도 기록이 없습니다.")).toBeVisible();
  await capture(page, "sell-history-deletion-success-1280.png");

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "병민", exact: true })).toBeVisible();
  await expect(page.getByText("삼성전자", { exact: true }).first()).toBeVisible();
  await page.getByLabel("병민 정렬 기준").selectOption("stockName");
  await page.getByRole("button", { name: /병민 정렬 방향/ }).click();
  await expect(page.getByLabel("할머니 정렬 기준")).toHaveValue("costBasis");
  await expect(page.getByLabel("아빠 정렬 기준")).toHaveValue("costBasis");
  const byeongminTotal = page.locator('section[data-owner="병민"] tfoot tr');
  await expect(byeongminTotal).toContainText("합계 (1종목)");
  await expect(byeongminTotal).toContainText("10주");
  await expect(byeongminTotal).toContainText("70,000원");
  await expect(byeongminTotal).toContainText("700,000원");
  await capture(page, "dashboard-independent-sort-1280.png");

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    for (const route of routes) {
      await page.goto(route.path);
      await waitForRouteReady(page, route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${route.name} ${viewport.name} horizontal overflow`).toBe(0);
      if (route.path === "/" && viewport.width < 1120) {
        await expect(page.locator('aside[aria-label="병민 합계"]')).toBeVisible();
      }
      const screenshotName =
        route.name === "sell-history" && viewport.name === "desktop-1280"
          ? "sell-history-page-shell-final-8f62c1-1280.png"
          : `${route.name}-${viewport.name}.png`;
      await capture(page, screenshotName);
    }
  }

  await page.setViewportSize({ width: 1586, height: 992 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "대시보드" })).toBeVisible();
  await expect(page.getByText("전체 보유 현황")).toBeVisible();
  await capture(page, "dashboard-reference-size.png", false);
  expect(await page.locator('script[src*="react-scan"], script[src*="react-grab"]').count()).toBe(
    0,
  );
});
