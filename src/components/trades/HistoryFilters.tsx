"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import type { Brokerage } from "@/lib/domain/brokerages";
import { HistoryFilterFields } from "./HistoryFilterFields";
import {
  BASE_FILTER_KEYS,
  brokerageFilterName,
  FILTER_LABELS,
  ownerFilterName,
} from "./history-filter-config";
import styles from "./history-filters.module.css";
import type { StockSelection, TradeSide } from "./types";

interface HistoryFiltersProps {
  readonly brokerages: readonly Brokerage[];
  readonly stocks: readonly StockSelection[];
  readonly side: TradeSide;
}

interface ActiveFilter {
  readonly key: string;
  readonly value: string;
}

export function HistoryFilters({ brokerages, stocks, side }: HistoryFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const active: ActiveFilter[] = [];
  for (const key of BASE_FILTER_KEYS) {
    if (key === "from" || key === "to") continue;
    const value = searchParams.get(key);
    if (value) active.push({ key, value });
  }
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const period =
    from || to
      ? [
          {
            key: "period",
            value: `${from ?? "시작일"} ~ ${to ?? "종료일"}`,
          },
        ]
      : [];
  const activeFilters: readonly ActiveFilter[] = [...period, ...active];

  const navigate = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams();
    const nextFrom = String(data.get("from") ?? "");
    const nextTo = String(data.get("to") ?? "");
    if (nextFrom && nextTo && nextFrom > nextTo) {
      setError("시작일은 종료일보다 늦을 수 없습니다.");
      return;
    }
    for (const key of BASE_FILTER_KEYS) {
      const value = String(data.get(key) ?? "").trim();
      if (value) next.set(key, value);
      else next.delete(key);
    }
    next.delete("page");
    setError("");
    navigate(next);
  };

  const removeFilter = (key: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (key === "period") {
      next.delete("from");
      next.delete("to");
    } else {
      next.delete(key);
    }
    next.delete("page");
    navigate(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams();
    setError("");
    navigate(next);
  };

  return (
    <details className={`panel ${styles.filters}`} open>
      <summary>
        필터 <span className={styles.count}>{activeFilters.length}개 적용</span>
      </summary>
      <form
        key={searchParams.toString()}
        className={styles.form}
        onSubmit={handleSubmit}
        aria-busy={isPending}
      >
        <HistoryFilterFields
          brokerages={brokerages}
          stocks={stocks}
          value={(key) => searchParams.get(key) ?? ""}
        />
        <div className={styles.actions}>
          <button
            className="button button--secondary"
            type="button"
            onClick={clearAll}
            disabled={isPending || activeFilters.length === 0}
          >
            전체 초기화
          </button>
          <button className="button button--primary" type="submit" disabled={isPending}>
            {isPending ? "검색 중..." : "검색 적용"}
          </button>
        </div>
      </form>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      {activeFilters.length > 0 ? (
        <fieldset className={styles.chips}>
          <legend className="sr-only">적용된 필터</legend>
          {activeFilters.map(({ key, value }) => (
            <button
              key={key}
              className={styles.chip}
              type="button"
              onClick={() => removeFilter(key)}
            >
              {key === "period" ? "기간" : FILTER_LABELS[key]}:{" "}
              {key === "ownerId"
                ? ownerFilterName(value)
                : key === "brokerageCode"
                  ? brokerageFilterName(brokerages, value)
                  : key === "q"
                    ? (stocks.find((stock) => stock.code === value)?.name ?? value)
                    : value}{" "}
              <span aria-hidden="true">×</span>
              <span className="sr-only"> 필터 제거</span>
            </button>
          ))}
        </fieldset>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {isPending ? `${side === "BUY" ? "매수" : "매도"} 검색 결과 갱신 중` : ""}
      </p>
    </details>
  );
}
