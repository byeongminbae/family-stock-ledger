import { afterEach, describe, expect, it, vi } from "vitest";
import { NaverProviderError, searchNaverStocks } from "@/lib/naver/client";

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    status,
  });

describe("Naver stock search provider", () => {
  afterEach(() => {
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
});
