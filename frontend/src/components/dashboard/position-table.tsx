import styles from "./dashboard.module.css";
import {
  formatPercent,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  profitLabel,
} from "./format";
import type { BrokeragePositionGroup, OwnerTotals, SortDirection, SortField } from "./types";

const columns: readonly Readonly<{
  field: SortField;
  label: string;
}>[] = [
  { field: "stockName", label: "종목" },
  { field: "heldQuantity", label: "보유 수량" },
  { field: "averageBuyPrice", label: "매수평균단가" },
  { field: "costBasis", label: "매입액" },
  { field: "portfolioWeight", label: "증권사 비중" },
  { field: "currentPrice", label: "현재가" },
  { field: "unrealizedProfit", label: "평가 손익" },
  { field: "valuation", label: "평가액" },
  { field: "returnRate", label: "수익률" },
];

type PositionTableProps = Readonly<{
  ownerName: string;
  groups: readonly BrokeragePositionGroup[];
  totals: OwnerTotals;
  sortField: SortField;
  sortDirection: SortDirection;
  onSort: (field: SortField) => void;
}>;

function ariaSort(
  column: SortField,
  active: SortField,
  direction: SortDirection,
): "ascending" | "descending" | undefined {
  if (column !== active) return undefined;
  return direction === "asc" ? "ascending" : "descending";
}

function PositionTotalCells({ totals }: Readonly<{ totals: OwnerTotals }>) {
  const profitState = profitLabel(totals.unrealizedProfit);
  const profitClass =
    profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";

  return (
    <>
      <td className="money">
        -<span className="sr-only">보유 수량은 합산하지 않습니다</span>
      </td>
      <td className="money">
        -<span className="sr-only">매수평균단가는 합산하지 않습니다</span>
      </td>
      <td className="money">{formatWon(totals.costBasis)}</td>
      <td className="money">
        {formatPercent(totals.portfolioWeight)}
        {totals.portfolioWeight === null ? (
          <span className="sr-only">증권사 비중은 전체 합계에서 표시하지 않습니다</span>
        ) : null}
      </td>
      <td className="money">
        -<span className="sr-only">현재가는 합산하지 않습니다</span>
      </td>
      <td className={`money ${profitClass}`}>
        <span className="sr-only">{profitState} </span>
        {formatSignedWon(totals.unrealizedProfit)}
      </td>
      <td className="money">{formatWon(totals.valuation)}</td>
      <td className="money">
        -<span className="sr-only">수익률은 합산하지 않습니다</span>
      </td>
    </>
  );
}

export function PositionTable({
  ownerName,
  groups,
  totals,
  sortField,
  sortDirection,
  onSort,
}: PositionTableProps) {
  return (
    <div className={`desktop-only ${styles.tableWrap}`}>
      <table className={styles.table}>
        <caption className="sr-only">{ownerName}의 보유 종목 현황</caption>
        <thead>
          <tr>
            <th className={styles.brokerageColumn} scope="col">
              증권사
            </th>
            {columns.map((column) => (
              <th
                key={column.field}
                scope="col"
                aria-sort={ariaSort(column.field, sortField, sortDirection)}
              >
                <button type="button" onClick={() => onSort(column.field)}>
                  {column.label}
                  {column.field === sortField ? (
                    <span aria-hidden="true">{sortDirection === "asc" ? " ↑" : " ↓"}</span>
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.brokerageCode ?? "legacy"}>
            {group.positions.map((position, positionIndex) => {
              const profitState = profitLabel(position.unrealizedProfit);
              const profitClass =
                profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
              return (
                <tr key={`${position.brokerageCode ?? "legacy"}-${position.itemCode}`}>
                  {positionIndex === 0 ? (
                    <th
                      className={styles.brokerageCell}
                      rowSpan={group.positions.length}
                      scope="rowgroup"
                    >
                      <span className={styles.brokerageName}>
                        {group.brokerageName ?? "미지정"}
                      </span>
                      {group.brokerageCode === null ? null : (
                        <span className={styles.brokerageCode}>{group.brokerageCode}</span>
                      )}
                    </th>
                  ) : null}
                  <th scope="row">
                    <span className={styles.stockName}>{position.stockName}</span>
                    <span className={styles.stockCode}>{position.itemCode}</span>
                  </th>
                  <td className="money">{formatQuantity(position.heldQuantity)}</td>
                  <td className="money">{formatWon(position.averageBuyPrice)}</td>
                  <td className="money">{formatWon(position.costBasis)}</td>
                  <td className="money">{formatPercent(position.portfolioWeight)}</td>
                  <td className="money">
                    {formatWon(position.currentPrice)}
                    {position.currentPrice === null ? (
                      <span className="sr-only">가격 조회 실패</span>
                    ) : null}
                  </td>
                  <td className={`money ${profitClass}`}>
                    <span className="sr-only">{profitState} </span>
                    {formatSignedWon(position.unrealizedProfit)}
                  </td>
                  <td className="money">{formatWon(position.valuation)}</td>
                  <td className={`money ${profitClass}`}>
                    <span className="sr-only">{profitState} </span>
                    {formatSignedPercent(position.returnRate)}
                  </td>
                </tr>
              );
            })}
            <tr className={styles.brokerageTotalRow}>
              <th colSpan={2} scope="row">
                {group.brokerageName ?? "미지정 증권사"} 합계 ({group.totals.stockCount}종목)
              </th>
              <PositionTotalCells totals={group.totals} />
            </tr>
          </tbody>
        ))}
        <tfoot>
          <tr className={styles.ownerTotalRow}>
            <th colSpan={2} scope="row">
              전체 합계 ({totals.stockCount}종목)
            </th>
            <PositionTotalCells totals={totals} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
