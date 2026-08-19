import { describe, expect, it } from "vitest";

import { dashboardResponseSchema } from "../../src/components/dashboard/types";

const validDashboardResponse = {
  stockCount: 1,
  quotedStockCount: 1,
  costBasis: "140000",
  valuation: "160000",
  unrealizedProfit: "20000",
  owners: [
    {
      id: 1,
      name: "병민",
      stockCount: 1,
      costBasis: "140000",
      valuation: "160000",
      unrealizedProfit: "20000",
      brokerages: [
        {
          brokerageCode: "240",
          brokerageName: "삼성증권",
          stockCount: 1,
          costBasis: "140000",
          valuation: "160000",
          unrealizedProfit: "20000",
          stocks: [
            {
              itemCode: "005930",
              stockName: "삼성전자",
              heldQuantity: "2",
              averageBuyPrice: "70000",
              costBasis: "140000",
              brokerageWeight: "100",
              currentPrice: "80000",
              valuation: "160000",
              unrealizedProfit: "20000",
              returnRate: "14.2857",
            },
          ],
        },
      ],
    },
  ],
  quoteFetchedAt: "2026-08-20T15:30:00+09:00",
  valuationSessions: ["REGULAR_MARKET"],
};

describe("dashboard response contract", () => {
  it("parses a fully nested dashboard response", () => {
    // Given: the API supplies root totals, owners, brokerages, and stocks in their nested locations.
    const response = validDashboardResponse;

    // When: the dashboard boundary parses the response.
    const parsed = dashboardResponseSchema.safeParse(response);

    // Then: the complete nested response is accepted.
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
});
