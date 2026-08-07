import Decimal from "decimal.js";

type ProfitKind = "positive" | "negative" | "neutral";

const koreanDateTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});

const groupDigits = (value: string): string => {
  const [integer = "0", fraction] = value.split(".");
  const sign = integer.startsWith("-") ? "-" : "";
  const digits = sign === "-" ? integer.slice(1) : integer;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return fraction === undefined ? `${sign}${grouped}` : `${sign}${grouped}.${fraction}`;
};

export const formatDecimal = (value: string, decimalPlaces = 0): string =>
  groupDigits(new Decimal(value).toFixed(decimalPlaces));

export const formatWon = (value: string | null): string => {
  if (value === null) return "-";
  return `${groupDigits(new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0))}원`;
};

export const formatQuantity = (value: string): string => `${formatDecimal(value)}주`;

export const formatPercent = (value: string | null): string => {
  if (value === null) return "-";
  return `${formatDecimal(value, 2)}%`;
};

export const profitLabel = (
  value: string | null,
): { readonly kind: ProfitKind; readonly text: string } => {
  if (value === null) return { kind: "neutral", text: "조회 불가" };
  const amount = new Decimal(value);
  if (amount.isPositive()) return { kind: "positive", text: `이익 +${formatWon(value)}` };
  if (amount.isNegative()) return { kind: "negative", text: `손실 ${formatWon(value)}` };
  return { kind: "neutral", text: "손익 0원" };
};

export const formatKoreanDateTime = (value: string | Date): string =>
  koreanDateTimeFormatter.format(typeof value === "string" ? new Date(value) : value);
