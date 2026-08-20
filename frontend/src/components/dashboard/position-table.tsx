import styles from "./dashboard.module.css";
import {
  formatDashboardPercent,
  formatDashboardQuantity,
  formatDashboardWon,
  formatSignedPercent,
  formatSignedWon,
  profitLabel,
} from "./format";
import type { DashboardBrokerage, DashboardOwner, SortDirection, SortField } from "./types";

const columns: readonly Readonly<{
  field: SortField;
  label: string;
}>[] = [
  { field: "stockName", label: "종목" },
  { field: "quantity", label: "보유 수량" },
  { field: "averageBuyPrice", label: "매수평균단가" },
  { field: "totalBuyAmount", label: "매입액" },
  { field: "brokerageWeight", label: "증권사 비중" },
  { field: "currentPrice", label: "현재가" },
  { field: "unrealizedProfit", label: "평가 손익" },
  { field: "valuation", label: "평가액" },
  { field: "returnRate", label: "수익률" },
];

type PositionTableProps = Readonly<{
  owner: DashboardOwner;
  brokerages: readonly DashboardBrokerage[];
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

function PositionTotalCells({
  aggregate,
}: Readonly<{ aggregate: DashboardBrokerage | DashboardOwner }>) {
  const profitState = profitLabel(aggregate.unrealizedProfit);
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
      <td className="money">{formatDashboardWon(aggregate.totalBuyAmount)}</td>
      <td className="money">
        -<span className="sr-only">증권사 비중은 종목별로만 표시합니다</span>
      </td>
      <td className="money">
        -<span className="sr-only">현재가는 합산하지 않습니다</span>
      </td>
      <td className={`money ${profitClass}`}>
        <span className="sr-only">{profitState} </span>
        {formatSignedWon(aggregate.unrealizedProfit)}
      </td>
      <td className="money">{formatDashboardWon(aggregate.valuation)}</td>
      <td className="money">
        -<span className="sr-only">수익률은 합산하지 않습니다</span>
      </td>
    </>
  );
}

export function PositionTable({
  owner,
  brokerages,
  sortField,
  sortDirection,
  onSort,
}: PositionTableProps) {
  return (
    <div className={`desktop-only ${styles.tableWrap}`}>
      <table className={styles.table}>
        <caption className="sr-only">{owner.ownerName}의 보유 종목 현황</caption>
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
        {brokerages.map((brokerage) => (
          <tbody key={brokerage.brokerageCode}>
            {brokerage.stocks.map((stock, stockIndex) => {
              const profitState = profitLabel(stock.unrealizedProfit);
              const profitClass =
                profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
              return (
                <tr key={`${brokerage.brokerageCode}-${stock.stockCode}`}>
                  {stockIndex === 0 ? (
                    <th
                      className={styles.brokerageCell}
                      rowSpan={brokerage.stocks.length}
                      scope="rowgroup"
                    >
                      <span className={styles.brokerageName}>{brokerage.brokerageName}</span>
                      <span className={styles.brokerageCode}>{brokerage.brokerageCode}</span>
                    </th>
                  ) : null}
                  <th scope="row">
                    <span className={styles.stockName}>{stock.stockName}</span>
                    <span className={styles.stockCode}>{stock.stockCode}</span>
                  </th>
                  <td className="money">{formatDashboardQuantity(stock.quantity)}</td>
                  <td className="money">{formatDashboardWon(stock.averageBuyPrice)}</td>
                  <td className="money">{formatDashboardWon(stock.totalBuyAmount)}</td>
                  <td className="money">{formatDashboardPercent(stock.brokerageWeight)}</td>
                  <td className="money">{formatDashboardWon(stock.currentPrice)}</td>
                  <td className={`money ${profitClass}`}>
                    <span className="sr-only">{profitState} </span>
                    {formatSignedWon(stock.unrealizedProfit)}
                  </td>
                  <td className="money">{formatDashboardWon(stock.valuation)}</td>
                  <td className={`money ${profitClass}`}>
                    <span className="sr-only">{profitState} </span>
                    {formatSignedPercent(stock.returnRate)}
                  </td>
                </tr>
              );
            })}
            <tr className={styles.brokerageTotalRow}>
              <th colSpan={2} scope="row">
                {brokerage.brokerageName} 합계 ({brokerage.stockCount}종목)
              </th>
              <PositionTotalCells aggregate={brokerage} />
            </tr>
          </tbody>
        ))}
        <tfoot>
          <tr className={styles.ownerTotalRow}>
            <th colSpan={2} scope="row">
              전체 합계 ({owner.stockCount}종목)
            </th>
            <PositionTotalCells aggregate={owner} />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
