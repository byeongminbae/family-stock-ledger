import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/naver/client", () => ({
  NaverProviderError: class NaverProviderError extends Error {},
  searchNaverStocks: vi.fn(),
}));

import { GET } from "@/app/api/stocks/search/route";
import { NaverProviderError, searchNaverStocks } from "@/lib/naver/client";

const searchMock = vi.mocked(searchNaverStocks);

describe("GET /api/stocks/search", () => {
  beforeEach(() => {
    searchMock.mockReset();
  });

  it("does not call Naver before two search characters", async () => {
    const response = await GET(new Request("http://localhost/api/stocks/search?q=삼"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ items: [] });
    expect(searchMock).not.toHaveBeenCalled();
  });

  it("returns the stable UI result contract with no-store caching", async () => {
    searchMock.mockResolvedValue([
      {
        code: "005930",
        isEtf: false,
        market: "코스피",
        name: "삼성전자",
      },
    ]);

    const response = await GET(new Request("http://localhost/api/stocks/search?q=삼성"));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          code: "005930",
          isEtf: false,
          market: "코스피",
          name: "삼성전자",
        },
      ],
    });
  });

  it("hides provider details from a failed upstream request", async () => {
    searchMock.mockRejectedValue(new NaverProviderError());

    const response = await GET(new Request("http://localhost/api/stocks/search?q=삼성"));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      message: "종목 검색을 잠시 사용할 수 없습니다.",
    });
  });
});
