import type { Owner } from "@/lib/api-contracts";

export const BASE_FILTER_KEYS = ["from", "to", "q", "ownerId", "brokerageCode"] as const;

export const PERIOD_PRESETS = ["당일", "당월", "1주일", "1개월", "1년", "기간선택"] as const;

export const FILTER_LABELS: Readonly<Record<string, string>> = {
  q: "종목",
  ownerId: "소유주",
  brokerageCode: "증권사",
};

export const ownerFilterName = (owners: readonly Owner[], value: string): string =>
  owners.find((owner) => String(owner.id) === value)?.name ?? value;

export const brokerageFilterName = (
  brokerages: readonly { readonly code: string; readonly name: string }[],
  value: string,
): string => brokerages.find((brokerage) => brokerage.code === value)?.name ?? value;
