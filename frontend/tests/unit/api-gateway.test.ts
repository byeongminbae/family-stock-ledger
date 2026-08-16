import { afterEach, describe, expect, it, vi } from "vitest";

import { backendApiUrl, relayApiRequest } from "@/lib/server/api-gateway";

describe("backendApiUrl", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("Given a nested v1 request with a query, When it is relayed, Then it preserves both path and query", () => {
    const request = new Request("http://frontend.local/api/v1/stocks/search?q=%EC%82%BC%EC%84%B1");

    const result = backendApiUrl(request, ["stocks", "search"], "http://stock-backend:8080");

    expect(result?.toString()).toBe(
      "http://stock-backend:8080/api/v1/stocks/search?q=%EC%82%BC%EC%84%B1",
    );
  });

  it("Given an invalid internal URL, When it is relayed, Then it creates no upstream target", () => {
    const request = new Request("http://frontend.local/api/v1/dashboard");

    expect(backendApiUrl(request, ["dashboard"], "https://backend.example/path")).toBeNull();
  });

  it("Given a browser mutation, When it is relayed, Then browser origin and cookies stay outside the backend", async () => {
    vi.stubEnv("INTERNAL_API_BASE_URL", "http://stock-backend:8080");
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "1" }, success: true }), {
        headers: { "content-type": "application/json" },
        status: 201,
      }),
    );
    const request = new Request("http://frontend.local/api/v1/trades", {
      body: JSON.stringify({ side: "BUY" }),
      headers: {
        accept: "application/json",
        "content-type": "application/json",
        cookie: "frontend-session=fixture",
        origin: "http://frontend.local",
        "x-browser-only": "fixture",
      },
      method: "POST",
    });

    const response = await relayApiRequest(request, ["trades"]);
    const call = fetchSpy.mock.calls[0];
    if (call === undefined) throw new Error("내부 백엔드 요청이 기록되지 않았습니다.");
    const [input, init] = call;
    const upstream = input instanceof Request ? input : new Request(input, init);

    expect(response.status).toBe(201);
    expect(upstream.headers.get("accept")).toBe("application/json");
    expect(upstream.headers.get("content-type")).toBe("application/json");
    expect(upstream.headers.get("cookie")).toBeNull();
    expect(upstream.headers.get("origin")).toBeNull();
    expect(upstream.headers.get("x-browser-only")).toBeNull();
  });
});
