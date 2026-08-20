import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SummaryStrip } from "../../src/components/dashboard/summary-strip";

describe("dashboard summary", () => {
  it("shows the Korean market session immediately after the holding count", () => {
    // Given: the evaluated positions use the regular market session.
    const summary = createElement(SummaryStrip, {
      dashboard: {
        stockCount: 1,
        checkedStockCount: 1,
        totalBuyAmount: 0,
        valuation: 0,
        unrealizedProfit: 0,
        owners: [],
        quoteFetchedAt: "2026-08-20T15:30:00+09:00",
        valuationSession: "REGULAR_MARKET",
      },
      refreshing: false,
      onRefresh: () => undefined,
    });

    // When: the portfolio summary is rendered.
    const markup = renderToStaticMarkup(summary);

    // Then: the basis follows the holding count and uses Korean market names.
    expect(markup.indexOf("보유 종목")).toBeLessThan(markup.indexOf("평가 기준"));
    expect(markup).toContain("정규장");
    expect(markup).not.toContain("개장 전");
  });

  it("keeps only quote metadata nullable for an empty dashboard", () => {
    // Given: the empty dashboard has zero-valued finance fields and no quote metadata.
    const summary = createElement(SummaryStrip, {
      dashboard: {
        stockCount: 0,
        checkedStockCount: 0,
        totalBuyAmount: 0,
        valuation: 0,
        unrealizedProfit: 0,
        owners: [],
        quoteFetchedAt: null,
        valuationSession: null,
      },
      refreshing: false,
      onRefresh: () => undefined,
    });

    // When: the portfolio summary is rendered.
    const markup = renderToStaticMarkup(summary);

    // Then: metadata uses its empty state while financial values remain concrete zeroes.
    expect(markup).toContain("조회 시각 없음");
    expect(markup).toMatch(/<dt>평가 기준<\/dt><dd[^>]*>-<\/dd>/u);
    expect(markup.match(/0원/gu)).toHaveLength(3);
    expect(markup).not.toContain("일부 가격을 불러오지 못해");
  });

  it("counts each stock once across owners and brokerages", () => {
    // Given: two owners hold Samsung Electronics across four brokerage positions.
    const summary = createElement(SummaryStrip, {
      dashboard: {
        stockCount: 1,
        checkedStockCount: 1,
        totalBuyAmount: 280000,
        valuation: 320000,
        unrealizedProfit: 40000,
        owners: [],
        quoteFetchedAt: "2026-08-13T15:30:00+09:00",
        valuationSession: "REGULAR_MARKET",
      },
      refreshing: false,
      onRefresh: () => undefined,
    });

    // When: the portfolio summary is rendered.
    const markup = renderToStaticMarkup(summary);

    // Then: both the holding total and quote coverage use the one unique stock code.
    expect(markup).toMatch(/<dt>보유 종목<\/dt><dd>1개<\/dd>/u);
    expect(markup).toContain("1/1개 종목 가격 확인");
  });
});
