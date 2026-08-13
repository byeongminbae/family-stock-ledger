import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/domain/trades", () => ({
  getPositionAverage: vi.fn(),
}));

import { GET } from "@/app/api/positions/average/route";
import { getPositionAverage } from "@/lib/domain/trades";

const getPositionAverageMock = vi.mocked(getPositionAverage);

describe("GET /api/positions/average", () => {
  beforeEach(() => {
    getPositionAverageMock.mockReset();
  });

  it("forwards owner brokerage and stock as one position key", async () => {
    // Given: a valid brokerage-scoped position query.
    getPositionAverageMock.mockResolvedValue({ averageBuyPrice: "100", heldQuantity: "10" });
    const request = new Request(
      "http://localhost/api/positions/average?ownerId=1&brokerageCode=264&itemCode=005930",
    );

    // When: the route reads the position.
    const response = await GET(request);

    // Then: all three key dimensions reach the domain.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ averageBuyPrice: "100", heldQuantity: "10" });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(getPositionAverageMock).toHaveBeenCalledWith({
      brokerageCode: "264",
      itemCode: "005930",
      ownerId: 1,
    });
  });

  it("rejects a position query without a brokerage", async () => {
    // Given: owner and stock are present without a brokerage code.
    const request = new Request("http://localhost/api/positions/average?ownerId=1&itemCode=005930");

    // When: the route validates the incomplete key.
    const response = await GET(request);

    // Then: no owner-wide position lookup reaches the domain.
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "소유주, 증권사, 종목코드를 확인해 주세요.",
    });
    expect(getPositionAverageMock).not.toHaveBeenCalled();
  });

  it("rejects a position query with a malformed brokerage code", async () => {
    // Given: owner and stock are present with a non-three-digit brokerage code.
    const request = new Request(
      "http://localhost/api/positions/average?ownerId=1&brokerageCode=12A&itemCode=005930",
    );

    // When: the route validates the malformed key.
    const response = await GET(request);

    // Then: no malformed position lookup reaches the domain.
    expect(response.status).toBe(400);
    expect(getPositionAverageMock).not.toHaveBeenCalled();
  });

  it("returns an empty position without changing its domain response", async () => {
    // Given: the domain reports no held position.
    getPositionAverageMock.mockResolvedValue({ averageBuyPrice: null, heldQuantity: "0" });
    const request = new Request(
      "http://localhost/api/positions/average?ownerId=1&brokerageCode=264&itemCode=005930",
    );

    // When: the route reads the position.
    const response = await GET(request);

    // Then: the empty position is returned with the private-cache policy.
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ averageBuyPrice: null, heldQuantity: "0" });
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("hides unexpected domain errors behind a generic server response", async () => {
    // Given: the domain lookup fails unexpectedly.
    getPositionAverageMock.mockRejectedValue(new Error("database details"));
    const request = new Request(
      "http://localhost/api/positions/average?ownerId=1&brokerageCode=264&itemCode=005930",
    );

    // When: the route attempts to read the position.
    const response = await GET(request);

    // Then: the internal error is not exposed to the caller.
    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: "보유 정보를 불러오지 못했습니다." });
  });
});
