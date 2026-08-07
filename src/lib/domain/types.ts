import { z } from "zod";

export const ownerIdSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export type OwnerId = z.infer<typeof ownerIdSchema>;

export const tradeSideSchema = z.enum(["BUY", "SELL"]);
export type TradeSide = z.infer<typeof tradeSideSchema>;

export const itemCodeSchema = z
  .string()
  .regex(/^[0-9A-Z]{6}$/, "국내 종목 코드는 영문 대문자와 숫자 6자리여야 합니다.");

export const nonNegativeIntegerTextSchema = z
  .string()
  .regex(/^(0|[1-9]\d*)$/, "0 이상 정수여야 합니다.");

export const financeTextSchema = z.string().regex(/^-?(0|[1-9]\d*)(\.\d+)?$/);
