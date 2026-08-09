import { NextResponse } from "next/server";
import { z } from "zod";

import { getPositionAverage } from "@/lib/domain/trades";
import { ownerIdSchema } from "@/lib/domain/types";

const positionQuerySchema = z.object({
  brokerageCode: z.string().regex(/^\d{3}$/),
  itemCode: z.string().regex(/^[0-9A-Z]{6}$/),
  ownerId: z.preprocess(
    (value) => (typeof value === "string" ? Number(value) : value),
    ownerIdSchema,
  ),
});

export async function GET(request: Request): Promise<NextResponse> {
  const searchParams = new URL(request.url).searchParams;
  const parsed = positionQuerySchema.safeParse({
    brokerageCode: searchParams.get("brokerageCode"),
    itemCode: searchParams.get("itemCode"),
    ownerId: searchParams.get("ownerId"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { message: "소유주, 증권사, 종목코드를 확인해 주세요." },
      { status: 400 },
    );
  }

  try {
    const position = await getPositionAverage(parsed.data);
    return NextResponse.json(position, {
      headers: { "cache-control": "no-store" },
    });
  } catch {
    return NextResponse.json({ message: "보유 정보를 불러오지 못했습니다." }, { status: 500 });
  }
}
