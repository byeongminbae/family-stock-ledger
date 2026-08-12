import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { SummaryStrip } from "../../src/components/dashboard/summary-strip";

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
});
