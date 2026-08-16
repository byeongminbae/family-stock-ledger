import { describe, expect, it } from "vitest";
import { z } from "zod";

import { internalApiBaseUrl, parseSuccessEnvelope } from "@/lib/server/internal-api";

describe("internalApiBaseUrl", () => {
  it("Given an internal HTTP origin, When it is parsed, Then it remains an origin", () => {
    expect(internalApiBaseUrl("http://stock-backend:8080")?.toString()).toBe(
      "http://stock-backend:8080/",
    );
  });

  it("Given a malformed or path-bearing value, When it is parsed, Then it fails closed", () => {
    expect(internalApiBaseUrl("https://backend.example/path")).toBeNull();
    expect(internalApiBaseUrl("ftp://stock-backend:8080")).toBeNull();
    expect(internalApiBaseUrl(undefined)).toBeNull();
  });
});

describe("parseSuccessEnvelope", () => {
  it("Given a Watchtower success envelope, When it is parsed, Then it returns validated data", () => {
    const result = parseSuccessEnvelope(
      { data: { id: "42" }, success: true, timestamp: "2026-08-14T10:00:00" },
      z.strictObject({ id: z.string().regex(/^[1-9]\d*$/) }),
    );

    expect(result).toEqual({ id: "42" });
  });

  it("Given a non-envelope response, When it is parsed, Then it rejects the untrusted payload", () => {
    expect(() => parseSuccessEnvelope({ id: "42" }, z.strictObject({ id: z.string() }))).toThrow();
  });
});
