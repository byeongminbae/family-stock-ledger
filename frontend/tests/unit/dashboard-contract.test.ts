import { describe, expect, it } from "vitest";

import { dashboardResponseSchema } from "../../src/components/dashboard/types";

const stock = {
  stockCode: "005930",
  stockName: "삼성전자",
  quantity: 2,
  averageBuyPrice: 70000,
  totalBuyAmount: 140000,
  brokerageWeight: 100,
  currentPrice: 80000,
  valuation: 160000,
  unrealizedProfit: 20000,
  returnRate: 14.2857,
};

const brokerage = {
  brokerageCode: "240",
  brokerageName: "삼성증권",
  stockCount: 1,
  totalBuyAmount: 140000,
  valuation: 160000,
  unrealizedProfit: 20000,
  stocks: [stock],
};

const owner = {
  ownerId: 1,
  ownerName: "병민",
  stockCount: 1,
  totalBuyAmount: 140000,
  valuation: 160000,
  unrealizedProfit: 20000,
  brokerages: [brokerage],
};

const validDashboardResponse = {
  stockCount: 1,
  checkedStockCount: 1,
  totalBuyAmount: 140000,
  valuation: 160000,
  unrealizedProfit: 20000,
  owners: [owner],
  quoteFetchedAt: "2026-08-20T15:30:00+09:00",
  valuationSession: "REGULAR_MARKET",
};

const validEmptyDashboardResponse = {
  stockCount: 0,
  checkedStockCount: 0,
  totalBuyAmount: 0,
  valuation: 0,
  unrealizedProfit: 0,
  owners: [],
  quoteFetchedAt: null,
  valuationSession: null,
};

const responseWithOwner = (responseOwner: unknown): unknown => ({
  ...validDashboardResponse,
  owners: [responseOwner],
});

const nullableFinanceCases = [
  ["root valuation", { ...validDashboardResponse, valuation: null }],
  ["root unrealized profit", { ...validDashboardResponse, unrealizedProfit: null }],
  ["owner valuation", responseWithOwner({ ...owner, valuation: null })],
  ["owner unrealized profit", responseWithOwner({ ...owner, unrealizedProfit: null })],
  [
    "brokerage valuation",
    responseWithOwner({ ...owner, brokerages: [{ ...brokerage, valuation: null }] }),
  ],
  [
    "brokerage unrealized profit",
    responseWithOwner({ ...owner, brokerages: [{ ...brokerage, unrealizedProfit: null }] }),
  ],
  [
    "stock current price",
    responseWithOwner({
      ...owner,
      brokerages: [{ ...brokerage, stocks: [{ ...stock, currentPrice: null }] }],
    }),
  ],
  [
    "stock valuation",
    responseWithOwner({
      ...owner,
      brokerages: [{ ...brokerage, stocks: [{ ...stock, valuation: null }] }],
    }),
  ],
  [
    "stock unrealized profit",
    responseWithOwner({
      ...owner,
      brokerages: [{ ...brokerage, stocks: [{ ...stock, unrealizedProfit: null }] }],
    }),
  ],
  [
    "stock return rate",
    responseWithOwner({
      ...owner,
      brokerages: [{ ...brokerage, stocks: [{ ...stock, returnRate: null }] }],
    }),
  ],
] as const;

describe("dashboard response contract", () => {
  it("parses a fully nested dashboard response", () => {
    // Given: the API supplies root totals, owners, brokerages, and stocks in their nested locations.
    const response = validDashboardResponse;

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the complete nested response is accepted.
    expect(parsed.success).toBe(true);
  });

  it("parses an empty dashboard with absent quote metadata", () => {
    // Given: an empty dashboard has no checked stocks or quote metadata.
    const response = validEmptyDashboardResponse;

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the explicit empty variant is accepted.
    expect(parsed.success).toBe(true);
  });

  it("rejects the obsolete flat positions payload", () => {
    // Given: a response otherwise matching the new hierarchy includes the removed flat positions field.
    const response = { ...validDashboardResponse, positions: [] };

    // When: the dashboard boundary parses the obsolete response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the strict response schema rejects the removed field.
    expect(parsed.success).toBe(false);
  });

  it("rejects string-encoded financial numbers from the old contract", () => {
    // Given: the otherwise current response stringifies a native JSON number.
    const response = { ...validDashboardResponse, totalBuyAmount: "140000" };

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: strict native-number parsing rejects the old representation.
    expect(parsed.success).toBe(false);
  });

  it("rejects the removed valuation session list", () => {
    // Given: the response uses the removed multi-session field.
    const { valuationSession: _, ...currentResponse } = validDashboardResponse;
    const response = { ...currentResponse, valuationSessions: ["REGULAR_MARKET"] };

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the strict schema accepts only the singular session field.
    expect(parsed.success).toBe(false);
  });

  it("rejects an owner ID outside the JavaScript safe integer range", () => {
    // Given: the owner ID exceeds the largest integer JSON can represent safely in JavaScript.
    const response = {
      ...validDashboardResponse,
      owners: [{ ...validDashboardResponse.owners[0], ownerId: Number.MAX_SAFE_INTEGER + 1 }],
    };

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the unsafe owner ID is rejected before it can be used as a UI key.
    expect(parsed.success).toBe(false);
  });

  it.each(nullableFinanceCases)("rejects null for %s", (_label, response) => {
    // Given: one normal-response finance or quote value is null.

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: only empty-dashboard metadata may remain nullable.
    expect(parsed.success).toBe(false);
  });

  it.each([
    [
      "both quote fields missing for a populated dashboard",
      {
        ...validDashboardResponse,
        quoteFetchedAt: null,
        valuationSession: null,
      },
    ],
    ["only quote time missing", { ...validDashboardResponse, quoteFetchedAt: null }],
    ["only valuation session missing", { ...validDashboardResponse, valuationSession: null }],
    [
      "quote metadata present for an empty dashboard",
      {
        ...validEmptyDashboardResponse,
        quoteFetchedAt: "2026-08-20T15:30:00+09:00",
        valuationSession: "REGULAR_MARKET",
      },
    ],
  ])("rejects %s", (_label, response) => {
    // Given: quote metadata does not match the dashboard population variant.

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the mismatched metadata state is rejected.
    expect(parsed.success).toBe(false);
  });

  it("rejects incomplete quote coverage for a populated dashboard", () => {
    // Given: one of two held stocks is marked as checked.
    const response = { ...validDashboardResponse, stockCount: 2, checkedStockCount: 1 };

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: populated dashboards require all-or-error quote coverage.
    expect(parsed.success).toBe(false);
  });
});
