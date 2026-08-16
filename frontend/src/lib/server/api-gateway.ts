import "server-only";

import ky from "ky";
import { NextResponse } from "next/server";

import { internalApiBaseUrl } from "./internal-api";

const requestTimeoutMs = 10_000;
const forwardedRequestHeaders = ["accept", "content-type"] as const;

export function backendApiUrl(
  request: Request,
  path: readonly string[],
  internalApiBaseUrlValue: string | undefined = process.env.INTERNAL_API_BASE_URL,
): URL | null {
  const baseUrl = internalApiBaseUrl(internalApiBaseUrlValue);
  if (baseUrl === null || path.length === 0) return null;

  const target = new URL(`/api/v1/${path.map(encodeURIComponent).join("/")}`, baseUrl);
  target.search = new URL(request.url).search;
  return target;
}

export async function relayApiRequest(
  request: Request,
  path: readonly string[],
): Promise<Response> {
  const target = backendApiUrl(request, path);
  if (target === null) {
    return NextResponse.json({ message: "내부 API 연결을 사용할 수 없습니다." }, { status: 503 });
  }

  const headers = new Headers();
  for (const name of forwardedRequestHeaders) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  const canHaveBody = request.method !== "GET" && request.method !== "HEAD";

  try {
    const upstream = await ky(target, {
      ...(canHaveBody ? { body: await request.arrayBuffer() } : {}),
      headers,
      method: request.method,
      retry: { limit: 0 },
      throwHttpErrors: false,
      timeout: requestTimeoutMs,
    });
    const responseHeaders = new Headers(upstream.headers);
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");
    return new Response(upstream.body, { headers: responseHeaders, status: upstream.status });
  } catch (error) {
    if (!(error instanceof Error)) throw error;
    return NextResponse.json({ message: "내부 API 요청에 실패했습니다." }, { status: 502 });
  }
}
