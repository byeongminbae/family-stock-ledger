import { afterEach, describe, expect, it, vi } from "vitest";
import { getNaverMarketPrices, NaverProviderError, searchNaverStocks } from "@/lib/naver/client";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

const afterMarketResponse = (tradingDate: string): Response =>
  jsonResponse({
    isSuccess: true,
    result: {
      datas: [
        {
          closePriceRaw: "255500",
          itemCode: "005930",
          localTradedAt: `${tradingDate}T15:30:00+09:00`,
          marketStatus: "CLOSE",
          overMarketPriceInfo: {
            localTradedAt: `${tradingDate}T20:00:00.000000+09:00`,
            overPrice: "258,000",
            tradingSessionType: "AFTER_MARKET",
          },
          stockName: "삼성전자",
        },
      ],
    },
  });

describe("Naver stock provider", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("keeps only valid Korean stock results and maps the market name", async () => {
    const fetchMock = vi.fn<typeof fetch>(async () =>
      jsonResponse({
        isSuccess: true,
        result: {
          items: [
            {
              category: "stock",
              code: "005930",
              isEtf: false,
              name: "삼성전자",
              nationCode: "KOR",
              typeCode: "KOSPI",
              typeName: "코스피",
              url: "/domestic/stock/005930/total",
            },
            {
              category: "stock",
              code: "AAPL",
              isEtf: false,
              name: "Apple",
              nationCode: "USA",
              typeCode: "NASDAQ",
              typeName: "나스닥",
              url: "/worldstock/stock/AAPL/total",
            },
            {
              category: "fund",
              code: "K55101EU2400",
              isEtf: null,
              name: "테스트 펀드",
              nationCode: null,
              typeCode: "FUND",
              typeName: "펀드",
              url: "/domestic/fund/K55101EU2400/total",
            },
          ],
        },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(searchNaverStocks("삼성")).resolves.toEqual([
      {
        code: "005930",
        isEtf: false,
        market: "코스피",
        name: "삼성전자",
      },
    ]);

    const request = fetchMock.mock.calls[0]?.[0];
    expect(request).toBeInstanceOf(Request);
    if (request instanceof Request) {
      expect(request.cache).toBe("no-store");
      expect(new URL(request.url).searchParams.get("q")).toBe("삼성");
    }
  });

  it("turns an invalid search response into a controlled provider error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ isSuccess: true })),
    );

    await expect(searchNaverStocks("삼성")).rejects.toBeInstanceOf(NaverProviderError);
  });

  it("returns null for a requested code omitted by the market response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          isSuccess: true,
          result: {
            datas: [
              {
                closePriceRaw: "230500",
                itemCode: "005930",
                localTradedAt: "2026-08-06T15:30:00+09:00",
                marketStatus: "CLOSE",
                stockName: "삼성전자",
              },
            ],
          },
        }),
      ),
    );

    await expect(getNaverMarketPrices(["005930", "000660"])).resolves.toEqual({
      "000660": null,
      "005930": {
        itemCode: "005930",
        localTradedAt: "2026-08-06T15:30:00+09:00",
        marketStatus: "CLOSE",
        price: "230500",
        stockName: "삼성전자",
      },
    });
  });

  it("selects the current price for regular, before-market, and after-market sessions", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-12T19:45:00+09:00"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          isSuccess: true,
          result: {
            datas: [
              {
                closePriceRaw: "240000",
                itemCode: "005930",
                localTradedAt: "2026-08-12T10:00:00+09:00",
                marketStatus: "OPEN",
                overMarketPriceInfo: {
                  localTradedAt: "2026-08-12T08:50:00+09:00",
                  overPrice: "239,000",
                  tradingSessionType: "REGULAR",
                },
                stockName: "삼성전자",
              },
              {
                closePriceRaw: "230000",
                itemCode: "000660",
                localTradedAt: "2026-08-11T15:30:00+09:00",
                marketStatus: "CLOSE",
                overMarketPriceInfo: {
                  localTradedAt: "2026-08-12T08:20:00+09:00",
                  overPrice: "234,500",
                  tradingSessionType: "BEFORE_MARKET",
                },
                stockName: "SK하이닉스",
              },
              {
                closePriceRaw: "175000",
                itemCode: "035420",
                localTradedAt: "2026-08-12T15:30:00+09:00",
                marketStatus: "CLOSE",
                overMarketPriceInfo: {
                  localTradedAt: "2026-08-12T19:45:00+09:00",
                  overPrice: "178,500",
                  tradingSessionType: "AFTER_MARKET",
                },
                stockName: "NAVER",
              },
            ],
          },
        }),
      ),
    );

    await expect(getNaverMarketPrices(["005930", "000660", "035420"])).resolves.toEqual({
      "000660": {
        itemCode: "000660",
        localTradedAt: "2026-08-12T08:20:00+09:00",
        marketStatus: "CLOSE",
        price: "234500",
        stockName: "SK하이닉스",
      },
      "005930": {
        itemCode: "005930",
        localTradedAt: "2026-08-12T10:00:00+09:00",
        marketStatus: "OPEN",
        price: "240000",
        stockName: "삼성전자",
      },
      "035420": {
        itemCode: "035420",
        localTradedAt: "2026-08-12T19:45:00+09:00",
        marketStatus: "CLOSE",
        price: "178500",
        stockName: "NAVER",
      },
    });
  });

  it("keeps the previous trading day's after-market price until 02:59:59 KST", async () => {
    // Given: Naver still reports Wednesday's closed after-market quote just before the cutoff.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T02:59:59+09:00"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => afterMarketResponse("2026-08-12")),
    );

    // When: the dashboard provider selects the current valuation price.
    const prices = await getNaverMarketPrices(["005930"]);

    // Then: the after-market price and timestamp remain active.
    expect(prices["005930"]).toMatchObject({
      localTradedAt: "2026-08-12T20:00:00.000000+09:00",
      price: "258000",
    });
  });

  it("uses the regular close from 03:00 KST while Naver still reports after-market", async () => {
    // Given: the same closed after-market object remains at the exact cutoff.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T03:00:00+09:00"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => afterMarketResponse("2026-08-12")),
    );

    // When: the dashboard provider selects the current valuation price.
    const prices = await getNaverMarketPrices(["005930"]);

    // Then: it falls back to Wednesday's regular close and timestamp.
    expect(prices["005930"]).toMatchObject({
      localTradedAt: "2026-08-12T15:30:00+09:00",
      price: "255500",
    });
  });

  it("does not revive Friday's after-market price during the weekend", async () => {
    // Given: Naver still exposes Friday's after-market object on Saturday morning.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T07:59:00+09:00"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => afterMarketResponse("2026-08-14")),
    );

    // When: the dashboard provider selects the current valuation price.
    const prices = await getNaverMarketPrices(["005930"]);

    // Then: Friday's regular close remains the valuation price.
    expect(prices["005930"]).toMatchObject({
      localTradedAt: "2026-08-14T15:30:00+09:00",
      price: "255500",
    });
  });

  it("isolates a failed price batch instead of inventing a zero price", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, 503)),
    );

    await expect(getNaverMarketPrices(["005930"])).resolves.toEqual({
      "005930": null,
    });
  });
});
