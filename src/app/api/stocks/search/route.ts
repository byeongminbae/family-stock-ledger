import { NextResponse } from "next/server";
import { z } from "zod";
import { NaverProviderError, searchNaverStocks } from "@/lib/naver/client";

const querySchema = z.string().trim().min(2).max(80);
const noStoreHeaders = { "cache-control": "no-store" } as const;

export async function GET(request: Request): Promise<NextResponse> {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  if (query.trim().length < 2) {
    return NextResponse.json({ items: [] }, { headers: noStoreHeaders });
  }

  const parsed = querySchema.safeParse(query);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "검색어는 2자 이상 80자 이하로 입력해 주세요." },
      { headers: noStoreHeaders, status: 400 },
    );
  }

  try {
    const items = await searchNaverStocks(parsed.data);
    return NextResponse.json({ items }, { headers: noStoreHeaders });
  } catch (error) {
    const status = error instanceof NaverProviderError ? 502 : 500;
    return NextResponse.json(
      { message: "종목 검색을 잠시 사용할 수 없습니다." },
      { headers: noStoreHeaders, status },
    );
  }
}
