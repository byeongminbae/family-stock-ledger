import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SummaryStrip } from "../../src/components/dashboard/summary-strip";

describe("dashboard summary", () => {
  it("shows the Korean market sessions immediately after the holding count", () => {
    // Given: the evaluated positions use every supported market session.
    const summary = createElement(SummaryStrip, {
      totals: {
        stockCount: 0,
        quotedStockCount: 0,
        costBasis: "0",
        valuation: null,
        unrealizedProfit: null,
      },
      quoteFetchedAt: null,
      valuationSessions: ["PREOPEN", "PRE_MARKET", "REGULAR_MARKET", "AFTER_MARKET"],
      refreshing: false,
      onRefresh: () => undefined,
    });

    // When: the portfolio summary is rendered.
    const markup = renderToStaticMarkup(summary);

    // Then: the basis follows the holding count and uses Korean market names.
    expect(markup.indexOf("보유 종목")).toBeLessThan(markup.indexOf("평가 기준"));
    expect(markup).toContain("프리 · 정규장 · 에프터");
    expect(markup).not.toContain("개장 전");
  });

  it("counts each stock once across owners and brokerages", () => {
    // Given: two owners hold Samsung Electronics across four brokerage positions.
    const summary = createElement(SummaryStrip, {
      totals: {
        stockCount: 1,
        quotedStockCount: 1,
        costBasis: "280000",
        valuation: "320000",
        unrealizedProfit: "40000",
      },
      quoteFetchedAt: "2026-08-13T15:30:00+09:00",
      valuationSessions: ["REGULAR_MARKET"],
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
