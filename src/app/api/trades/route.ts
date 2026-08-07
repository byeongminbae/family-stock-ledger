import { NextResponse } from "next/server";
import { z } from "zod";
import { createTrade, deleteTrades, TradeDomainError, updateTrade } from "@/lib/domain/trades";

const MAX_BIGINT = 9_223_372_036_854_775_807n;
const positiveBigIntSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "1 이상의 정수를 입력해 주세요.")
  .refine((value) => BigInt(value) <= MAX_BIGINT, "입력값이 너무 큽니다.");
const tradeRequestSchema = z.strictObject({
  brokerageCode: z.string().regex(/^\d{3}$/, "증권사를 선택해 주세요."),
  executedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  isEtf: z.boolean(),
  itemCode: z.string().regex(/^[0-9A-Z]{6}$/),
  market: z.string().trim().min(1).max(30),
  ownerId: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  quantity: positiveBigIntSchema,
  securityName: z.string().trim().min(1).max(100),
  side: z.enum(["BUY", "SELL"]),
  unitPrice: positiveBigIntSchema,
});
const deleteRequestSchema = z.strictObject({
  ids: z
    .array(positiveBigIntSchema)
    .min(1, "삭제할 거래를 하나 이상 선택해 주세요.")
    .max(25, "한 번에 최대 25건까지 삭제할 수 있습니다.")
    .refine((ids) => new Set(ids).size === ids.length, "중복된 거래를 선택할 수 없습니다."),
  side: z.enum(["BUY", "SELL"]),
});
const updateRequestSchema = tradeRequestSchema.extend({ id: positiveBigIntSchema });

export async function POST(request: Request): Promise<NextResponse> {
  const body = await readJson(request);
  const parsed = tradeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return invalidTradeResponse(toClientFieldErrors(parsed.error));
  }

  const executedAt = parseKoreanLocalDateTime(parsed.data.executedAt);
  if (executedAt === null) {
    return invalidTradeResponse({
      executedAt: "올바른 한국시간 거래일시를 입력해 주세요.",
    });
  }

  try {
    const trade = await createTrade({
      brokerageCode: parsed.data.brokerageCode,
      executedAt,
      isEtf: parsed.data.isEtf,
      itemCode: parsed.data.itemCode,
      market: parsed.data.market,
      ownerId: parsed.data.ownerId,
      quantity: BigInt(parsed.data.quantity),
      side: parsed.data.side,
      stockName: parsed.data.securityName,
      unitPrice: BigInt(parsed.data.unitPrice),
    });

    return NextResponse.json({ id: trade.id, ok: true }, { status: 201 });
  } catch (error) {
    if (error instanceof TradeDomainError) {
      const status = error.code === "INSUFFICIENT_HOLDING" ? 409 : 400;
      const fieldErrors =
        error.code === "INSUFFICIENT_HOLDING" ? { quantity: error.message } : undefined;
      return NextResponse.json({ fieldErrors, message: error.message, ok: false }, { status });
    }

    return NextResponse.json(
      { message: "거래를 저장하지 못했습니다. 잠시 후 다시 시도해 주세요.", ok: false },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request): Promise<NextResponse> {
  const body = await readJson(request);
  const parsed = deleteRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { message: "삭제할 거래 선택을 확인해 주세요.", ok: false },
      { status: 400 },
    );
  }

  try {
    const result = await deleteTrades({
      ids: parsed.data.ids.map((id) => BigInt(id)),
      side: parsed.data.side,
    });
    return NextResponse.json({ deletedCount: result.deletedCount, ok: true });
  } catch (error) {
    if (error instanceof TradeDomainError) {
      const status = deleteStatus(error.code);
      return NextResponse.json({ message: error.message, ok: false }, { status });
    }

    return NextResponse.json(
      { message: "거래를 삭제하지 못했습니다. 잠시 후 다시 시도해 주세요.", ok: false },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request): Promise<NextResponse> {
  const body = await readJson(request);
  const parsed = updateRequestSchema.safeParse(body);
  if (!parsed.success) {
    return invalidTradeResponse(toClientFieldErrors(parsed.error));
  }
  const executedAt = parseKoreanLocalDateTime(parsed.data.executedAt);
  if (executedAt === null) {
    return invalidTradeResponse({ executedAt: "올바른 한국시간 거래일시를 입력해 주세요." });
  }

  try {
    const trade = await updateTrade({
      brokerageCode: parsed.data.brokerageCode,
      executedAt,
      id: BigInt(parsed.data.id),
      isEtf: parsed.data.isEtf,
      itemCode: parsed.data.itemCode,
      market: parsed.data.market,
      ownerId: parsed.data.ownerId,
      quantity: BigInt(parsed.data.quantity),
      side: parsed.data.side,
      stockName: parsed.data.securityName,
      unitPrice: BigInt(parsed.data.unitPrice),
    });
    return NextResponse.json({ id: trade.id, ok: true });
  } catch (error) {
    if (error instanceof TradeDomainError) {
      const fieldErrors =
        error.code === "INSUFFICIENT_HOLDING" ? { quantity: error.message } : undefined;
      return NextResponse.json(
        { fieldErrors, message: error.message, ok: false },
        { status: tradeErrorStatus(error.code) },
      );
    }
    return NextResponse.json(
      { message: "거래를 수정하지 못했습니다. 잠시 후 다시 시도해 주세요.", ok: false },
      { status: 500 },
    );
  }
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function invalidTradeResponse(fieldErrors?: Readonly<Record<string, string>>): NextResponse {
  return NextResponse.json(
    {
      fieldErrors,
      message: "입력값을 확인해 주세요.",
      ok: false,
    },
    { status: 400 },
  );
}

function toClientFieldErrors(error: z.ZodError): Readonly<Record<string, string>> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const rawField = issue.path[0];
    if (typeof rawField !== "string") continue;
    const field = ["isEtf", "itemCode", "market", "securityName"].includes(rawField)
      ? "stock"
      : rawField;
    fieldErrors[field] ??= issue.message;
  }
  return fieldErrors;
}

function parseKoreanLocalDateTime(value: string): Date | null {
  const instant = new Date(`${value}:00+09:00`);
  if (Number.isNaN(instant.getTime())) return null;

  const koreanTime = new Date(instant.getTime() + 9 * 60 * 60 * 1_000);
  const normalized = [
    koreanTime.getUTCFullYear().toString().padStart(4, "0"),
    (koreanTime.getUTCMonth() + 1).toString().padStart(2, "0"),
    koreanTime.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
  const time = [
    koreanTime.getUTCHours().toString().padStart(2, "0"),
    koreanTime.getUTCMinutes().toString().padStart(2, "0"),
  ].join(":");

  return `${normalized}T${time}` === value ? instant : null;
}

function deleteStatus(code: TradeDomainError["code"]): 400 | 404 | 409 {
  return tradeErrorStatus(code);
}

function tradeErrorStatus(code: TradeDomainError["code"]): 400 | 404 | 409 {
  switch (code) {
    case "INSUFFICIENT_HOLDING":
      return 409;
    case "TRADE_NOT_FOUND":
      return 404;
    case "INVALID_TRADE":
      return 400;
  }
}
