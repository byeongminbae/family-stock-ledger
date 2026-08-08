"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import styles from "./dashboard.module.css";
import { PositionCards } from "./position-cards";
import { PositionTable } from "./position-table";
import { sortPositions } from "./sort";
import type {
  BrokeragePositionGroup,
  OwnerName,
  OwnerTotals,
  SortDirection,
  SortField,
} from "./types";

const sortOptions: readonly Readonly<{
  value: SortField;
  label: string;
}>[] = [
  { value: "stockName", label: "종목명" },
  { value: "heldQuantity", label: "보유 수량" },
  { value: "averageBuyPrice", label: "매수평균단가" },
  { value: "costBasis", label: "매입액" },
  { value: "portfolioWeight", label: "증권사 비중" },
  { value: "currentPrice", label: "현재가" },
  { value: "unrealizedProfit", label: "평가 손익" },
  { value: "valuation", label: "평가액" },
  { value: "returnRate", label: "수익률" },
];

type OwnerSectionProps = Readonly<{
  ownerName: OwnerName;
  groups: readonly BrokeragePositionGroup[];
  totals: OwnerTotals;
}>;

function selectedSortField(value: string): SortField | null {
  return sortOptions.find((option) => option.value === value)?.value ?? null;
}

function sortedGroups(
  groups: readonly BrokeragePositionGroup[],
  sortField: SortField,
  sortDirection: SortDirection,
): readonly BrokeragePositionGroup[] {
  return groups.map((group) => ({
    ...group,
    positions: sortPositions(group.positions, sortField, sortDirection),
  }));
}

export function OwnerSection({ ownerName, groups, totals }: OwnerSectionProps) {
  const [sortField, setSortField] = useState<SortField>("costBasis");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const sorted = useMemo(
    () => sortedGroups(groups, sortField, sortDirection),
    [groups, sortDirection, sortField],
  );
  const positionCount = groups.reduce((total, group) => total + group.positions.length, 0);
  const headingId = `owner-${ownerName}`;
  const activeLabel = sortOptions.find((option) => option.value === sortField)?.label ?? "매입액";

  function changeSortField(value: string) {
    const next = selectedSortField(value);
    if (next !== null) setSortField(next);
  }

  function sortFromHeader(field: SortField) {
    if (field === sortField) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }
    setSortField(field);
    setSortDirection("desc");
  }

  return (
    <section className={styles.ownerSection} data-owner={ownerName} aria-labelledby={headingId}>
      <div className={styles.ownerHeader}>
        <div>
          <p className={styles.ownerEyebrow}>소유주</p>
          <h2 id={headingId}>{ownerName}</h2>
          <p>
            {groups.length}개 증권사, {positionCount}개 종목 보유
          </p>
        </div>
        <div className={styles.sortControls}>
          <label htmlFor={`${headingId}-sort`}>{ownerName} 정렬 기준</label>
          <select
            id={`${headingId}-sort`}
            className="control"
            value={sortField}
            onChange={(event) => changeSortField(event.currentTarget.value)}
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="button button--secondary"
            onClick={() => setSortDirection((current) => (current === "asc" ? "desc" : "asc"))}
            aria-label={`${ownerName} 정렬 방향, 현재 ${
              sortDirection === "asc" ? "오름차순" : "내림차순"
            }`}
          >
            {sortDirection === "asc" ? "오름차순 ↑" : "내림차순 ↓"}
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {ownerName} 목록을 {activeLabel} {sortDirection === "asc" ? "오름차순" : "내림차순"}으로
        정렬했습니다.
      </p>

      {positionCount === 0 ? (
        <div className={styles.ownerEmpty}>
          <p>현재 보유 중인 종목이 없습니다.</p>
          <Link className="button button--secondary" href="/buy-history">
            매수 기록 추가
          </Link>
        </div>
      ) : (
        <>
          <PositionTable
            ownerName={ownerName}
            groups={sorted}
            totals={totals}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={sortFromHeader}
          />
          <PositionCards ownerName={ownerName} groups={sorted} totals={totals} />
        </>
      )}
    </section>
  );
}
