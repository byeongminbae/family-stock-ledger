import Decimal from "decimal.js";

import { formatKoreanDateTime, formatPercent, formatQuantity, formatWon } from "@/lib/format";

export { formatPercent, formatQuantity, formatWon };

export function formatSignedWon(value: string | null): string {
  if (value === null) return "-";
  const decimal = new Decimal(value);
  const prefix = decimal.isPositive() ? "+" : "";
  return `${prefix}${formatWon(value)}`;
}

export function formatSignedPercent(value: string | null): string {
  if (value === null) return "-";
  const decimal = new Decimal(value);
  const prefix = decimal.isPositive() ? "+" : "";
  return `${prefix}${formatPercent(value)}`;
}

export function formatQuoteTime(value: string | null): string {
  if (value === null) return "조회 시각 없음";
  try {
    return `${formatKoreanDateTime(value)} 기준`;
  } catch {
    return "조회 시각 없음";
  }
}

export function profitLabel(value: string | null): string {
  if (value === null) return "가격 조회 실패";
  const decimal = new Decimal(value);
  if (decimal.isZero()) return "보합";
  return decimal.isPositive() ? "이익" : "손실";
}
