import Decimal from "decimal.js";

import { formatKoreanDateTime, formatPercent, formatQuantity, formatWon } from "@/lib/format";

export { formatPercent, formatQuantity, formatWon };

export function formatSignedWon(value: number): string {
  const decimal = new Decimal(value);
  const prefix = decimal.isPositive() ? "+" : "";
  return `${prefix}${formatWon(String(value))}`;
}

export function formatSignedPercent(value: number): string {
  const decimal = new Decimal(value);
  const prefix = decimal.isPositive() ? "+" : "";
  return `${prefix}${formatPercent(String(value))}`;
}

export function formatDashboardWon(value: number): string {
  return formatWon(String(value));
}

export function formatDashboardQuantity(value: number): string {
  return formatQuantity(String(value));
}

export function formatDashboardPercent(value: number): string {
  return formatPercent(String(value));
}

export function formatQuoteTime(value: string | null): string {
  if (value === null) return "조회 시각 없음";
  try {
    return `${formatKoreanDateTime(value)} 기준`;
  } catch {
    return "조회 시각 없음";
  }
}

export function profitLabel(value: number): string {
  const decimal = new Decimal(value);
  if (decimal.isZero()) return "보합";
  return decimal.isPositive() ? "이익" : "손실";
}
