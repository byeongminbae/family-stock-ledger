import { OWNERS } from "./types";

export const BASE_FILTER_KEYS = [
  "from",
  "to",
  "q",
  "ownerId",
  "quantityMin",
  "quantityMax",
  "unitPriceMin",
  "unitPriceMax",
  "amountMin",
  "amountMax",
] as const;

export const FILTER_RANGES = [
  { legend: "수량", min: "quantityMin", max: "quantityMax", unit: "주", signed: false },
  { legend: "당시 단가", min: "unitPriceMin", max: "unitPriceMax", unit: "원", signed: false },
  { legend: "거래액", min: "amountMin", max: "amountMax", unit: "원", signed: false },
] as const;

export const PROFIT_RANGE = {
  legend: "손익",
  min: "profitMin",
  max: "profitMax",
  unit: "원",
  signed: true,
} as const;

export const FILTER_LABELS: Readonly<Record<string, string>> = {
  from: "시작 일시",
  to: "종료 일시",
  q: "종목",
  ownerId: "소유주",
  quantityMin: "수량 최소",
  quantityMax: "수량 최대",
  unitPriceMin: "단가 최소",
  unitPriceMax: "단가 최대",
  amountMin: "거래액 최소",
  amountMax: "거래액 최대",
  profitMin: "손익 최소",
  profitMax: "손익 최대",
};

export const ownerFilterName = (value: string): string =>
  OWNERS.find((owner) => String(owner.id) === value)?.name ?? value;
