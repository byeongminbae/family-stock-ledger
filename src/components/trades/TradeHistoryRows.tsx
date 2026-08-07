import { Button } from "@/components/ui/button";

import { formatInteger, formatSeoulDateTime, formatWon, numericSign } from "./format";
import styles from "./trade-history.module.css";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";

interface ProfitProps {
  readonly value: string | null;
}

function Profit({ value }: ProfitProps) {
  if (value === null) return <span className={styles.muted}>계산 불가</span>;
  const sign = numericSign(value);
  if (sign === null) return <span className={styles.muted}>계산 불가</span>;
  const negative = sign === -1;
  const zero = sign === 0;
  const visible = `${negative || zero ? "" : "+"}${formatWon(value)}`;
  return (
    <span className={negative ? "money negative" : "money positive"}>
      <span className="sr-only">{negative ? "손실" : zero ? "손익 없음" : "이익"} </span>
      {visible}
    </span>
  );
}

interface SelectionCheckboxProps {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly row: TradeHistoryRow;
  readonly onToggle: (id: string) => void;
}

function SelectionCheckbox({ checked, disabled, row, onToggle }: SelectionCheckboxProps) {
  return (
    <label className={styles.checkboxLabel}>
      <input
        checked={checked}
        disabled={disabled}
        onChange={() => onToggle(row.id)}
        type="checkbox"
      />
      <span className="sr-only">{row.stockName} 거래 선택</span>
    </label>
  );
}

interface TradeHistoryRowsProps {
  readonly deleting: boolean;
  readonly rows: readonly TradeHistoryRow[];
  readonly selectedIds: ReadonlySet<string>;
  readonly selectionMode: boolean;
  readonly side: TradeSide;
  readonly onEdit: (row: TradeHistoryRow, trigger: HTMLButtonElement) => void;
  readonly onToggle: (id: string) => void;
}

export function TradeHistoryTable({
  deleting,
  onEdit,
  onToggle,
  rows,
  selectedIds,
  selectionMode,
  side,
}: TradeHistoryRowsProps) {
  const label = sideLabel(side);
  return (
    <div className={styles.tableWrap}>
      <table>
        <caption>{label} 거래 내역, 최신 거래순</caption>
        <thead>
          <tr>
            {selectionMode ? <th scope="col">선택</th> : null}
            <th scope="col">{label} 일시</th>
            <th scope="col">종목명</th>
            <th scope="col">종목코드</th>
            <th scope="col">소유주</th>
            <th scope="col">수량</th>
            <th scope="col">당시 단가</th>
            <th scope="col">{label}액</th>
            {side === "SELL" ? <th scope="col">손익</th> : null}
            {!selectionMode ? <th scope="col">관리</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {selectionMode ? (
                <td>
                  <SelectionCheckbox
                    checked={selectedIds.has(row.id)}
                    disabled={deleting}
                    onToggle={onToggle}
                    row={row}
                  />
                </td>
              ) : null}
              <td>
                <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
              </td>
              <th scope="row">
                <span className={styles.stockName}>{row.stockName}</span>
              </th>
              <td className="money">{row.itemCode}</td>
              <td>{row.ownerName}</td>
              <td className="money">{formatInteger(row.quantity)}주</td>
              <td className="money">{formatWon(row.unitPrice)}</td>
              <td className="money">{formatWon(row.amount)}</td>
              {side === "SELL" ? (
                <td>
                  <Profit value={row.profit} />
                </td>
              ) : null}
              {!selectionMode ? (
                <td className={styles.rowActions}>
                  <Button onClick={(event) => onEdit(row, event.currentTarget)} variant="secondary">
                    수정
                  </Button>
                </td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TradeHistoryCards({
  deleting,
  onEdit,
  onToggle,
  rows,
  selectedIds,
  selectionMode,
  side,
}: TradeHistoryRowsProps) {
  const label = sideLabel(side);
  return (
    <ul className={styles.cards}>
      {rows.map((row) => (
        <li key={row.id}>
          <article className={styles.card} aria-labelledby={`trade-card-${row.id}`}>
            <header>
              <div>
                <h3 id={`trade-card-${row.id}`}>{row.stockName}</h3>
                <p>{row.itemCode}</p>
              </div>
              <div className={styles.cardMeta}>
                {selectionMode ? (
                  <SelectionCheckbox
                    checked={selectedIds.has(row.id)}
                    disabled={deleting}
                    onToggle={onToggle}
                    row={row}
                  />
                ) : null}
                <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
                {!selectionMode ? (
                  <Button onClick={(event) => onEdit(row, event.currentTarget)} variant="secondary">
                    수정
                  </Button>
                ) : null}
              </div>
            </header>
            <dl>
              <div>
                <dt>소유주</dt>
                <dd>{row.ownerName}</dd>
              </div>
              <div>
                <dt>{label} 수량</dt>
                <dd className="money">{formatInteger(row.quantity)}주</dd>
              </div>
              <div>
                <dt>{label} 당시 단가</dt>
                <dd className="money">{formatWon(row.unitPrice)}</dd>
              </div>
              <div>
                <dt>{label}액</dt>
                <dd className="money">{formatWon(row.amount)}</dd>
              </div>
              {side === "SELL" ? (
                <div>
                  <dt>손익</dt>
                  <dd>
                    <Profit value={row.profit} />
                  </dd>
                </div>
              ) : null}
            </dl>
          </article>
        </li>
      ))}
    </ul>
  );
}
