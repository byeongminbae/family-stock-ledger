"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { HistoryFilterFields } from "./HistoryFilterFields";
import {
  BASE_FILTER_KEYS,
  FILTER_LABELS,
  FILTER_RANGES,
  ownerFilterName,
  PROFIT_RANGE,
} from "./history-filter-config";
import styles from "./history-filters.module.css";
import type { TradeSide } from "./types";

interface HistoryFiltersProps {
  readonly side: TradeSide;
}

export function HistoryFilters({ side }: HistoryFiltersProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const keys = side === "SELL" ? [...BASE_FILTER_KEYS, "profitMin", "profitMax"] : BASE_FILTER_KEYS;
  const active = keys.flatMap((key) => {
    const value = searchParams.get(key);
    return value ? [{ key, value }] : [];
  });

  const navigate = (params: URLSearchParams) => {
    const query = params.toString();
    startTransition(() => router.push(query ? `${pathname}?${query}` : pathname));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const next = new URLSearchParams(searchParams.toString());
    const validationGroups = [...FILTER_RANGES, ...(side === "SELL" ? [PROFIT_RANGE] : [])];
    for (const group of validationGroups) {
      const minimum = String(data.get(group.min) ?? "").trim();
      const maximum = String(data.get(group.max) ?? "").trim();
      const integerPattern = group.signed ? /^-?\d+$/ : /^\d+$/;
      if (
        (minimum && !integerPattern.test(minimum)) ||
        (maximum && !integerPattern.test(maximum))
      ) {
        setError(`${group.legend} 범위는 정수로 입력해 주세요.`);
        return;
      }
      if (minimum && maximum && BigInt(minimum) > BigInt(maximum)) {
        setError(`${group.legend} 최솟값은 최댓값보다 클 수 없습니다.`);
        return;
      }
    }
    const from = String(data.get("from") ?? "");
    const to = String(data.get("to") ?? "");
    if (from && to && from > to) {
      setError("시작 일시는 종료 일시보다 늦을 수 없습니다.");
      return;
    }
    for (const key of keys) {
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
    next.delete(key);
    next.delete("page");
    navigate(next);
  };

  const clearAll = () => {
    const next = new URLSearchParams(searchParams.toString());
    for (const key of keys) next.delete(key);
    next.delete("page");
    setError("");
    navigate(next);
  };

  return (
    <details className={`panel ${styles.filters}`} open>
      <summary>
        필터 <span className={styles.count}>{active.length}개 적용</span>
      </summary>
      <form
        key={searchParams.toString()}
        className={styles.form}
        onSubmit={handleSubmit}
        aria-busy={isPending}
      >
        <HistoryFilterFields side={side} value={(key) => searchParams.get(key) ?? ""} />
        <div className={styles.actions}>
          <button
            className="button button--secondary"
            type="button"
            onClick={clearAll}
            disabled={isPending || active.length === 0}
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
      {active.length > 0 ? (
        <fieldset className={styles.chips}>
          <legend className="sr-only">적용된 필터</legend>
          {active.map(({ key, value }) => (
            <button
              key={key}
              className={styles.chip}
              type="button"
              onClick={() => removeFilter(key)}
            >
              {FILTER_LABELS[key]}: {key === "ownerId" ? ownerFilterName(value) : value}{" "}
              <span aria-hidden="true">×</span>
              <span className="sr-only"> 필터 제거</span>
            </button>
          ))}
        </fieldset>
      ) : null}
      <p className="sr-only" role="status" aria-live="polite">
        {isPending ? "검색 결과 갱신 중" : ""}
      </p>
    </details>
  );
}
