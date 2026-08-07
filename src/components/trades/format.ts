import Decimal from "decimal.js";

const integerPattern = /^-?\d+$/;
const decimalPattern = /^-?\d+(?:\.\d+)?$/;
const seoulDisplayFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  dateStyle: "medium",
  timeStyle: "short",
});
const seoulInputFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export const formatInteger = (value: string): string => {
  if (!integerPattern.test(value)) {
    return "-";
  }
  return BigInt(value).toLocaleString("ko-KR");
};

export const formatWon = (value: string): string => {
  if (!decimalPattern.test(value)) return "-";
  const rounded = new Decimal(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toFixed(0);
  return `${BigInt(rounded).toLocaleString("ko-KR")}원`;
};

export const numericSign = (value: string): -1 | 0 | 1 | null => {
  if (!decimalPattern.test(value)) return null;
  const decimal = new Decimal(value);
  if (decimal.isZero()) return 0;
  return decimal.isNegative() ? -1 : 1;
};

export const multiplyIntegers = (left: string, right: string): string | null => {
  if (!/^\d+$/.test(left) || !/^\d+$/.test(right)) {
    return null;
  }
  return new Decimal(left).times(right).toFixed(0);
};

export const formatSeoulDateTime = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return seoulDisplayFormatter.format(date);
};

export const isoInstantToSeoulDateTimeLocal = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = seoulInputFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
};

export const seoulDateTimeLocalNow = (): string => {
  const parts = seoulInputFormatter.formatToParts(new Date());
  const read = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "00";
  return `${read("year")}-${read("month")}-${read("day")}T${read("hour")}:${read("minute")}`;
};
