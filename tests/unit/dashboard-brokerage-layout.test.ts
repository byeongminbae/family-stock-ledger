import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OwnerSection } from "../../src/components/dashboard/owner-section";
import { PositionCards } from "../../src/components/dashboard/position-cards";
import { PositionTable } from "../../src/components/dashboard/position-table";
import type {
  BrokeragePositionGroup,
  DashboardPosition,
  OwnerTotals,
} from "../../src/components/dashboard/types";

const samsungPosition: DashboardPosition = {
  ownerId: 1,
  ownerName: "병민",
  brokerageCode: "240",
  brokerageName: "삼성증권",
  itemCode: "005930",
  stockName: "삼성전자",
  heldQuantity: "2",
  averageBuyPrice: "70000",
  costBasis: "140000",
  portfolioWeight: "20",
  currentPrice: "80000",
  valuation: "160000",
  unrealizedProfit: "20000",
  returnRate: "14.2857",
};

const groups: readonly BrokeragePositionGroup[] = [
  {
    brokerageCode: "240",
    brokerageName: "삼성증권",
    positions: [
      samsungPosition,
      {
        ...samsungPosition,
        itemCode: "000660",
        portfolioWeight: "30",
        stockName: "SK하이닉스",
      },
    ],
    totals: {
      stockCount: 2,
      costBasis: "280000",
      portfolioWeight: "100",
      currentPrice: null,
      valuation: "320000",
      unrealizedProfit: "40000",
    },
  },
];

const totals: OwnerTotals = {
  stockCount: 2,
  costBasis: "280000",
  portfolioWeight: null,
  currentPrice: null,
  valuation: "320000",
  unrealizedProfit: "40000",
};

describe("dashboard brokerage layout", () => {
  it("shows a unique stock count for an owner holding the same stock at two brokerages", () => {
    // Given: the owner's Samsung Electronics position is split between two brokerages.
    const duplicatedStockGroups: readonly BrokeragePositionGroup[] = [
      {
        brokerageCode: "240",
        brokerageName: "삼성증권",
        positions: [samsungPosition],
        totals: {
          stockCount: 1,
          costBasis: "140000",
          portfolioWeight: "100",
          currentPrice: null,
          valuation: "160000",
          unrealizedProfit: "20000",
        },
      },
      {
        brokerageCode: "264",
        brokerageName: "키움증권",
        positions: [{ ...samsungPosition, brokerageCode: "264", brokerageName: "키움증권" }],
        totals: {
          stockCount: 1,
          costBasis: "140000",
          portfolioWeight: "100",
          currentPrice: null,
          valuation: "160000",
          unrealizedProfit: "20000",
        },
      },
    ];

    // When: the owner's dashboard section is rendered with a one-stock owner total.
    const markup = renderToStaticMarkup(
      createElement(OwnerSection, {
        ownerName: "병민",
        groups: duplicatedStockGroups,
        totals: { ...totals, stockCount: 1 },
      }),
    );

    // Then: the owner heading reports two brokerages but only one unique stock.
    expect(markup).toContain("2개 증권사, 1개 종목 보유");
    expect(markup).toContain("전체 합계 (1종목)");
  });

  it("renders brokerage as a compact table column", () => {
    // Given: one brokerage containing two aggregated stock positions.
    const table = createElement(PositionTable, {
      ownerName: "병민",
      groups,
      totals,
      sortField: "stockName",
      sortDirection: "asc",
      onSort: () => undefined,
    });

    // When: the wide dashboard table is rendered.
    const markup = renderToStaticMarkup(table);

    // Then: brokerage occupies one row-spanning column instead of a full-width band.
    expect(markup).toContain(">증권사</th>");
    expect(markup).toMatch(/<th[^>]*rowSpan="2"[^>]*scope="rowgroup"/u);
    expect(markup).not.toContain('colSpan="9" scope="rowgroup"');
    expect(markup).toContain("삼성증권 합계 (2종목)");
    expect(markup).toContain("증권사 비중");
    expect(markup.match(/100\.00%/gu)).toHaveLength(1);
    expect(markup).toContain("증권사 비중은 전체 합계에서 표시하지 않습니다");
  });

  it("renders brokerage metadata inside every compact stock card", () => {
    // Given: two stock cards from the same brokerage.
    const cards = createElement(PositionCards, { ownerName: "병민", groups, totals });

    // When: the compact dashboard cards are rendered.
    const markup = renderToStaticMarkup(cards);

    // Then: each card identifies its brokerage without an oversized brokerage section.
    expect(markup).toContain('aria-label="병민의 삼성증권 보유 종목 현황"');
    expect(markup.match(/<strong>삼성증권<\/strong>/gu)).toHaveLength(2);
    expect(markup).toContain("삼성증권 합계 (2종목)");
    expect(markup).toContain("증권사 비중");
    expect(markup.match(/100\.00%/gu)).toHaveLength(1);
    expect(markup).toContain("증권사 비중은 전체 합계에서 표시하지 않습니다");
    expect(markup).not.toContain('aria-labelledby="brokerage-');
  });
});
