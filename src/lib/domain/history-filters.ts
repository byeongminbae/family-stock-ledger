import { historyBoundary } from "@/lib/domain/time";
import { financeTextSchema, nonNegativeIntegerTextSchema, ownerIdSchema } from "@/lib/domain/types";

export type RawSearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

export interface HistoryFilters {
  readonly q: string | null;
  readonly from: string | null;
  readonly to: string | null;
  readonly stockName: string | null;
  readonly itemCode: string | null;
  readonly ownerId: 1 | 2 | 3 | null;
  readonly quantityMin: string | null;
  readonly quantityMax: string | null;
  readonly unitPriceMin: string | null;
  readonly unitPriceMax: string | null;
  readonly amountMin: string | null;
  readonly amountMax: string | null;
  readonly profitMin: string | null;
  readonly profitMax: string | null;
  readonly page: number;
}

function firstValue(params: RawSearchParams, key: string): string {
  const value = params[key];
  if (typeof value === "string") {
    return value.trim();
  }
  return value?.[0]?.trim() ?? "";
}

function textFilter(params: RawSearchParams, key: string): string | null {
  const value = firstValue(params, key);
  return value.length > 0 ? value.slice(0, 120) : null;
}

function integerFilter(params: RawSearchParams, key: string): string | null {
  const result = nonNegativeIntegerTextSchema.safeParse(firstValue(params, key));
  return result.success ? result.data : null;
}

function signedFinanceFilter(params: RawSearchParams, key: string): string | null {
  const result = financeTextSchema.safeParse(firstValue(params, key));
  return result.success ? result.data : null;
}

function dateFilter(params: RawSearchParams, key: string): string | null {
  const value = textFilter(params, key);
  return historyBoundary(value, key === "to" ? "end" : "start") === null ? null : value;
}

export function parseTradeFilters(params: RawSearchParams): HistoryFilters {
  const ownerResult = ownerIdSchema.safeParse(Number(firstValue(params, "ownerId")));
  const pageValue = Number(firstValue(params, "page"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    q: textFilter(params, "q"),
    from: dateFilter(params, "from"),
    to: dateFilter(params, "to"),
    stockName: textFilter(params, "stockName"),
    itemCode: textFilter(params, "itemCode"),
    ownerId: ownerResult.success ? ownerResult.data : null,
    quantityMin: integerFilter(params, "quantityMin"),
    quantityMax: integerFilter(params, "quantityMax"),
    unitPriceMin: integerFilter(params, "unitPriceMin"),
    unitPriceMax: integerFilter(params, "unitPriceMax"),
    amountMin: integerFilter(params, "amountMin"),
    amountMax: integerFilter(params, "amountMax"),
    profitMin: signedFinanceFilter(params, "profitMin"),
    profitMax: signedFinanceFilter(params, "profitMax"),
    page,
  };
}

export function filtersAreActive(filters: HistoryFilters): boolean {
  return Object.entries(filters).some(([key, value]) => key !== "page" && value !== null);
}
