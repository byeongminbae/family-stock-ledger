import styles from "./dashboard.module.css";
import {
  formatPercent,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  profitLabel,
} from "./format";
import type { DashboardPosition, OwnerTotals, SortDirection, SortField } from "./types";

const columns: readonly Readonly<{
  field: SortField;
  label: string;
}>[] = [
  { field: "stockName", label: "종목" },
  { field: "heldQuantity", label: "보유 수량" },
  { field: "averageBuyPrice", label: "매수평균단가" },
  { field: "costBasis", label: "매입액" },
  { field: "portfolioWeight", label: "전체 비중" },
  { field: "currentPrice", label: "현재가" },
  { field: "unrealizedProfit", label: "평가 손익" },
  { field: "valuation", label: "평가액" },
  { field: "returnRate", label: "수익률" },
];

type PositionTableProps = Readonly<{
  ownerName: string;
  positions: readonly DashboardPosition[];
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

export function PositionTable({
  ownerName,
  positions,
  totals,
  sortField,
  sortDirection,
  onSort,
}: PositionTableProps) {
  const totalProfitState = profitLabel(totals.unrealizedProfit);
  const totalProfitClass =
    totalProfitState === "이익" ? "positive" : totalProfitState === "손실" ? "negative" : "";

  return (
    <div className={`desktop-only ${styles.tableWrap}`}>
      <table className={styles.table}>
        <caption className="sr-only">{ownerName}의 보유 종목 현황</caption>
        <thead>
          <tr>
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
        <tbody>
          {positions.map((position) => {
            const profitState = profitLabel(position.unrealizedProfit);
            const profitClass =
              profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
            return (
              <tr key={position.itemCode}>
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
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">합계 ({totals.stockCount}종목)</th>
            <td className="money">{formatQuantity(totals.heldQuantity)}</td>
            <td className="money">{formatWon(totals.averageBuyPrice)}</td>
            <td className="money">{formatWon(totals.costBasis)}</td>
            <td className="money">{formatPercent(totals.portfolioWeight)}</td>
            <td className="money">
              -<span className="sr-only">현재가는 합산하지 않습니다</span>
            </td>
            <td className={`money ${totalProfitClass}`}>
              <span className="sr-only">{totalProfitState} </span>
              {formatSignedWon(totals.unrealizedProfit)}
            </td>
            <td className="money">{formatWon(totals.valuation)}</td>
            <td className={`money ${totalProfitClass}`}>
              <span className="sr-only">{totalProfitState} </span>
              {formatSignedPercent(totals.returnRate)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
