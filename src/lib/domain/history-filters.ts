import { historyBoundary } from "@/lib/domain/time";
import { brokerageCodeSchema, ownerIdSchema } from "@/lib/domain/types";

export type RawSearchParams = Readonly<Record<string, string | readonly string[] | undefined>>;

export interface HistoryFilters {
  readonly q: string | null;
  readonly from: string | null;
  readonly to: string | null;
  readonly ownerId: 1 | 2 | 3 | null;
  readonly brokerageCode: string | null;
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

function dateFilter(params: RawSearchParams, key: string): string | null {
  const value = textFilter(params, key);
  return historyBoundary(value, key === "to" ? "end" : "start") === null ? null : value;
}

export function parseTradeFilters(params: RawSearchParams): HistoryFilters {
  const ownerResult = ownerIdSchema.safeParse(Number(firstValue(params, "ownerId")));
  const brokerageResult = brokerageCodeSchema.safeParse(firstValue(params, "brokerageCode"));
  const pageValue = Number(firstValue(params, "page"));
  const page = Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    q: textFilter(params, "q"),
    from: dateFilter(params, "from"),
    to: dateFilter(params, "to"),
    ownerId: ownerResult.success ? ownerResult.data : null,
    brokerageCode: brokerageResult.success ? brokerageResult.data : null,
    page,
  };
}

export function filtersAreActive(filters: HistoryFilters): boolean {
  return Object.entries(filters).some(([key, value]) => key !== "page" && value !== null);
}
