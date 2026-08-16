"use client";

import ky from "ky";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { seoulDateTimeLocalNow } from "./format";
import { type StockSelection, sideLabel, type TradeSide } from "./types";

const ownerIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/, "소유주를 선택해 주세요.")
  .refine((value) => Number(value) <= 32_767, "소유주를 선택해 주세요.");

const inputSchema = z.object({
  brokerageCode: z.string().min(1, "증권사를 선택해 주세요."),
  executedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "거래 일시를 입력해 주세요."),
  ownerId: ownerIdSchema,
  quantity: z.string().regex(/^[1-9]\d*$/, "수량은 1 이상의 정수여야 합니다."),
  unitPrice: z.string().regex(/^[1-9]\d*$/, "단가는 1원 이상의 정수여야 합니다."),
});

const tradeResponseSchema = z.discriminatedUnion("success", [
  z.object({ success: z.literal(true), timestamp: z.string(), data: z.object({ id: z.string() }) }),
  z.object({
    success: z.literal(false),
    timestamp: z.string(),
    statusCode: z.string(),
    message: z.string(),
    fieldErrors: z.record(z.string(), z.string()).nullable().optional(),
  }),
]);

const previewRequestSchema = z.object({
  brokerageCode: z.string().regex(/^\d{3}$/),
  itemCode: z.string().regex(/^[0-9A-Z]{6}$/),
  ownerId: z.number().int().min(1).max(32_767),
  quantity: z.string().regex(/^[1-9]\d*$/),
  side: z.enum(["BUY", "SELL"]),
  unitPrice: z.string().regex(/^[1-9]\d*$/),
});

const previewResponseSchema = z.object({
  success: z.literal(true),
  timestamp: z.string(),
  data: z.object({
    amount: z.string().regex(/^\d+$/),
    averageBuyPrice: z.string().nullable(),
    expectedProfit: z.string().nullable(),
    heldQuantity: z.string().regex(/^\d+$/),
    quantityError: z.string().nullable(),
  }),
});

export type TradeFieldName =
  | "brokerageCode"
  | "executedAt"
  | "stock"
  | "ownerId"
  | "quantity"
  | "unitPrice";
type TradeFieldErrors = Partial<Record<TradeFieldName, string>>;

const normalizeField = (name: string): TradeFieldName | null => {
  if (["itemCode", "securityName", "market", "isEtf"].includes(name)) return "stock";
  if (["brokerageCode", "executedAt", "stock", "ownerId", "quantity", "unitPrice"].includes(name)) {
    return name as TradeFieldName;
  }
  return null;
};

export interface TradeEntryInitialValues {
  readonly brokerageCode: string;
  readonly executedAt: string;
  readonly ownerId: string;
  readonly stock: StockSelection;
  readonly quantity: string;
  readonly unitPrice: string;
}

export interface TradeEntryFormOptions {
  readonly defaultOwnerId?: string | undefined;
  readonly side: TradeSide;
  readonly initialValues?: TradeEntryInitialValues | undefined;
  readonly tradeId?: string | undefined;
  readonly onSaved?: ((tradeId: string) => void) | undefined;
}

export function useTradeEntryForm({
  defaultOwnerId,
  initialValues,
  onSaved,
  side,
  tradeId,
}: TradeEntryFormOptions) {
  const router = useRouter();
  const summaryRef = useRef<HTMLDivElement>(null);
  const [executedAt, setExecutedAt] = useState(initialValues?.executedAt ?? "");
  const [brokerageCode, setBrokerageCode] = useState(initialValues?.brokerageCode ?? "");
  const [ownerId, setOwnerId] = useState(initialValues?.ownerId ?? defaultOwnerId ?? "");
  const [stock, setStock] = useState<StockSelection | null>(initialValues?.stock ?? null);
  const [quantity, setQuantity] = useState(initialValues?.quantity ?? "");
  const [unitPrice, setUnitPrice] = useState(initialValues?.unitPrice ?? "");
  const [errors, setErrors] = useState<TradeFieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | null>(null);
  const [preview, setPreview] = useState<z.infer<typeof previewResponseSchema>["data"] | null>(
    null,
  );
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const editing = tradeId !== undefined;

  useEffect(() => {
    if (!editing) setExecutedAt(seoulDateTimeLocalNow());
  }, [editing]);

  useEffect(() => {
    const parsed = previewRequestSchema.safeParse({
      brokerageCode,
      itemCode: stock?.code,
      ownerId: Number(ownerId),
      quantity,
      side,
      unitPrice,
    });
    if (!parsed.success) {
      setPreview(null);
      setPreviewUnavailable(false);
      return;
    }
    const controller = new AbortController();
    setPreview(null);
    setPreviewUnavailable(false);
    void ky
      .post("/api/v1/trades/preview", {
        json: parsed.data,
        signal: controller.signal,
        timeout: 8_000,
      })
      .json<unknown>()
      .then((payload) => setPreview(previewResponseSchema.parse(payload).data))
      .catch(() => {
        if (!controller.signal.aborted) setPreviewUnavailable(true);
      });
    return () => controller.abort();
  }, [brokerageCode, ownerId, quantity, side, stock, unitPrice]);

  const amount = preview?.amount ?? null;
  const expectedProfit = preview?.expectedProfit ?? null;
  const focusSummary = () => window.requestAnimationFrame(() => summaryRef.current?.focus());
  const fail = (text: string) => {
    setMessage(text);
    setMessageTone("error");
    focusSummary();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage("");
    setMessageTone(null);
    const parsed = inputSchema.safeParse({
      brokerageCode,
      executedAt,
      ownerId,
      quantity,
      unitPrice,
    });
    const nextErrors: TradeFieldErrors = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = normalizeField(String(issue.path[0] ?? ""));
        if (field) nextErrors[field] ??= issue.message;
      }
    }
    if (stock === null) nextErrors.stock = "검색 결과에서 종목을 선택해 주세요.";
    if (!editing && side === "SELL" && preview?.quantityError) {
      nextErrors.quantity = preview.quantityError;
    }
    if (!parsed.success || stock === null || Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      fail("입력 내용을 확인해 주세요.");
      return;
    }

    setErrors({});
    setSubmitting(true);
    const payload = {
      side,
      brokerageCode: parsed.data.brokerageCode,
      executedAt: parsed.data.executedAt,
      itemCode: stock.code,
      securityName: stock.name,
      market: stock.market,
      isEtf: stock.isEtf,
      ownerId: Number(parsed.data.ownerId),
      quantity: parsed.data.quantity,
      unitPrice: parsed.data.unitPrice,
    };
    try {
      const response = editing
        ? await ky.patch("/api/v1/trades", {
            throwHttpErrors: false,
            timeout: 10_000,
            json: { id: tradeId, ...payload },
          })
        : await ky.post("/api/v1/trades", {
            throwHttpErrors: false,
            timeout: 10_000,
            json: payload,
          });
      const result = tradeResponseSchema.parse(await response.json<unknown>());
      if (!response.ok || !result.success) {
        if (!result.success && result.fieldErrors) {
          const mapped: TradeFieldErrors = {};
          for (const [name, text] of Object.entries(result.fieldErrors)) {
            const field = normalizeField(name);
            if (field) mapped[field] = text;
          }
          setErrors(mapped);
        }
        fail(result.success ? "저장하지 못했습니다. 다시 시도해 주세요." : result.message);
        return;
      }
      const label = sideLabel(side);
      setMessage(editing ? `${label} 기록을 수정했습니다.` : `${label} 기록이 저장되었습니다.`);
      setMessageTone("success");
      if (!editing) {
        setStock(null);
        setQuantity("");
        setUnitPrice("");
      }
      onSaved?.(result.data.id);
      router.refresh();
    } catch {
      fail(`저장하지 못했습니다. 입력값을 유지했으니 다시 시도해 주세요.`);
    } finally {
      setSubmitting(false);
    }
  };

  return {
    summaryRef,
    executedAt,
    setExecutedAt,
    brokerageCode,
    setBrokerageCode,
    ownerId,
    setOwnerId,
    stock,
    setStock,
    quantity,
    setQuantity,
    unitPrice,
    setUnitPrice,
    errors,
    submitting,
    message,
    messageTone,
    preview,
    previewUnavailable,
    amount,
    expectedProfit,
    editing,
    handleSubmit,
  } as const;
}
