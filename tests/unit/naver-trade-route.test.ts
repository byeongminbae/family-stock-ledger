import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/domain/trades", () => ({
  createTrade: vi.fn(),
  deleteTrades: vi.fn(),
  getPositionAverage: vi.fn(),
  updateTrade: vi.fn(),
  TradeDomainError: class TradeDomainError extends Error {
    readonly code: "INVALID_TRADE" | "INSUFFICIENT_HOLDING" | "TRADE_NOT_FOUND";

    constructor(
      code: "INVALID_TRADE" | "INSUFFICIENT_HOLDING" | "TRADE_NOT_FOUND",
      message: string,
    ) {
      super(message);
      this.code = code;
    }
  },
}));

import { DELETE, PATCH, POST } from "@/app/api/trades/route";
import { createTrade, deleteTrades, TradeDomainError, updateTrade } from "@/lib/domain/trades";

const createTradeMock = vi.mocked(createTrade);
const deleteTradesMock = vi.mocked(deleteTrades);
const updateTradeMock = vi.mocked(updateTrade);
const validTrade = {
  executedAt: "2026-08-07T10:30",
  isEtf: false,
  itemCode: "005930",
  market: "코스피",
  ownerId: 1,
  quantity: "3",
  securityName: "삼성전자",
  side: "BUY",
  unitPrice: "230500",
} as const;

const tradeRequest = (body: unknown): Request =>
  new Request("http://localhost/api/trades", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "POST",
  });

const deleteRequest = (body: unknown): Request =>
  new Request("http://localhost/api/trades", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "DELETE",
  });

const patchRequest = (body: unknown): Request =>
  new Request("http://localhost/api/trades", {
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
    method: "PATCH",
  });

describe("POST /api/trades", () => {
  beforeEach(() => {
    createTradeMock.mockReset();
    deleteTradesMock.mockReset();
  });

  it("converts Korean local time and integer strings at the server boundary", async () => {
    createTradeMock.mockResolvedValue({ id: "42" });

    const response = await POST(tradeRequest(validTrade));

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ id: "42", ok: true });
    expect(createTradeMock).toHaveBeenCalledWith({
      executedAt: new Date("2026-08-07T10:30:00+09:00"),
      isEtf: false,
      itemCode: "005930",
      market: "코스피",
      ownerId: 1,
      quantity: 3n,
      side: "BUY",
      stockName: "삼성전자",
      unitPrice: 230500n,
    });
  });

  it("rejects an impossible calendar date before touching the database", async () => {
    const response = await POST(tradeRequest({ ...validTrade, executedAt: "2026-02-30T10:30" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      fieldErrors: {
        executedAt: "올바른 한국시간 거래일시를 입력해 주세요.",
      },
      message: "입력값을 확인해 주세요.",
      ok: false,
    });
    expect(createTradeMock).not.toHaveBeenCalled();
  });

  it("returns a field-level conflict without exposing internal errors", async () => {
    createTradeMock.mockRejectedValue(
      new TradeDomainError("INSUFFICIENT_HOLDING", "보유 수량 2주를 초과할 수 없습니다."),
    );

    const response = await POST(tradeRequest({ ...validTrade, side: "SELL" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      fieldErrors: { quantity: "보유 수량 2주를 초과할 수 없습니다." },
      message: "보유 수량 2주를 초과할 수 없습니다.",
      ok: false,
    });
  });
});

describe("PATCH /api/trades", () => {
  beforeEach(() => {
    updateTradeMock.mockReset();
  });

  it("parses the complete edit payload and delegates a side-scoped update", async () => {
    updateTradeMock.mockResolvedValue({ id: "42" });

    const response = await PATCH(patchRequest({ ...validTrade, id: "42", side: "SELL" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ id: "42", ok: true });
    expect(updateTradeMock).toHaveBeenCalledWith({
      executedAt: new Date("2026-08-07T10:30:00+09:00"),
      id: 42n,
      isEtf: false,
      itemCode: "005930",
      market: "코스피",
      ownerId: 1,
      quantity: 3n,
      side: "SELL",
      stockName: "삼성전자",
      unitPrice: 230500n,
    });
  });

  it("rejects a malformed ID before touching the domain", async () => {
    const response = await PATCH(patchRequest({ ...validTrade, id: "0" }));

    expect(response.status).toBe(400);
    expect(updateTradeMock).not.toHaveBeenCalled();
  });

  it("returns not found when the ID is absent or belongs to the other side", async () => {
    updateTradeMock.mockRejectedValue(
      new TradeDomainError("TRADE_NOT_FOUND", "수정할 거래를 찾을 수 없습니다."),
    );

    const response = await PATCH(patchRequest({ ...validTrade, id: "42" }));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });

  it("returns conflict when an edit makes the replayed ledger invalid", async () => {
    updateTradeMock.mockRejectedValue(
      new TradeDomainError("INSUFFICIENT_HOLDING", "거래 수정 후 보유 수량이 부족합니다."),
    );

    const response = await PATCH(patchRequest({ ...validTrade, id: "42" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
  });
});

describe("DELETE /api/trades", () => {
  beforeEach(() => {
    deleteTradesMock.mockReset();
  });

  it("parses strict string IDs and delegates a side-scoped bulk deletion", async () => {
    deleteTradesMock.mockResolvedValue({ deletedCount: 2 });

    const response = await DELETE(deleteRequest({ ids: ["42", "84"], side: "BUY" }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ deletedCount: 2, ok: true });
    expect(deleteTradesMock).toHaveBeenCalledWith({ ids: [42n, 84n], side: "BUY" });
  });

  it("rejects duplicate selection IDs before touching the domain", async () => {
    const response = await DELETE(deleteRequest({ ids: ["42", "42"], side: "BUY" }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false });
    expect(deleteTradesMock).not.toHaveBeenCalled();
  });

  it("returns a conflict when deleting a buy would invalidate a later sale", async () => {
    deleteTradesMock.mockRejectedValue(
      new TradeDomainError(
        "INSUFFICIENT_HOLDING",
        "선택한 매수를 삭제하면 이후 매도 시점의 보유 수량이 부족해집니다.",
      ),
    );

    const response = await DELETE(deleteRequest({ ids: ["42"], side: "BUY" }));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "선택한 매수를 삭제하면 이후 매도 시점의 보유 수량이 부족해집니다.",
      ok: false,
    });
  });
});
