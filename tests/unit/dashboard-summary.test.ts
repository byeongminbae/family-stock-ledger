import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SummaryStrip } from "../../src/components/dashboard/summary-strip";
import type { DashboardPosition } from "../../src/components/dashboard/types";

const samsungPosition: DashboardPosition = {
  ownerId: 1,
  ownerName: "병민",
  brokerageCode: "240",
  brokerageName: "삼성증권",
  itemCode: "005930",
  stockName: "삼성전자",
  heldQuantity: "1",
  averageBuyPrice: "70000",
  costBasis: "70000",
  portfolioWeight: "100",
  currentPrice: "80000",
  valuation: "80000",
  unrealizedProfit: "10000",
  returnRate: "14.2857",
};

describe("dashboard summary", () => {
  it("shows the Korean market sessions immediately after the holding count", () => {
    // Given: the evaluated positions use every supported market session.
    const summary = createElement(SummaryStrip, {
      positions: [],
      quoteFetchedAt: null,
      valuationSessions: ["BEFORE_MARKET", "REGULAR", "AFTER_MARKET"],
      refreshing: false,
      onRefresh: () => undefined,
    });

    // When: the portfolio summary is rendered.
    const markup = renderToStaticMarkup(summary);

    // Then: the basis follows the holding count and uses Korean market names.
    expect(markup.indexOf("보유 종목")).toBeLessThan(markup.indexOf("평가 기준"));
    expect(markup).toContain("장전 · 정규장 · 장후");
  });

  it("counts each stock once across owners and brokerages", () => {
    // Given: two owners hold Samsung Electronics across four brokerage positions.
    const summary = createElement(SummaryStrip, {
      positions: [
        samsungPosition,
        { ...samsungPosition, brokerageCode: "264", brokerageName: "키움증권" },
        { ...samsungPosition, ownerId: 2, ownerName: "할머니" },
        {
          ...samsungPosition,
          ownerId: 2,
          ownerName: "할머니",
          brokerageCode: "264",
          brokerageName: "키움증권",
        },
      ],
      quoteFetchedAt: "2026-08-13T15:30:00+09:00",
      valuationSessions: ["REGULAR"],
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
