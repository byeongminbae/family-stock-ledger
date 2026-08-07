import { FILTER_RANGES, PROFIT_RANGE } from "./history-filter-config";
import styles from "./history-filters.module.css";
import { OWNERS, sideLabel, type TradeSide } from "./types";

interface RangeInputProps {
  readonly legend: string;
  readonly min: string;
  readonly max: string;
  readonly unit: string;
  readonly minValue: string;
  readonly maxValue: string;
  readonly signed?: boolean;
}

function RangeInput({
  legend,
  min,
  max,
  unit,
  minValue,
  maxValue,
  signed = false,
}: RangeInputProps) {
  const mode = signed ? "text" : "numeric";
  return (
    <fieldset className={styles.range}>
      <legend>{legend}</legend>
      <label className={styles.rangeField} htmlFor={`filter-${min}`}>
        <span>최소</span>
        <input
          id={`filter-${min}`}
          className="control"
          name={min}
          type="number"
          inputMode={mode}
          min={signed ? undefined : "0"}
          step="1"
          defaultValue={minValue}
          placeholder={`최소 ${unit}`}
        />
      </label>
      <span aria-hidden="true">-</span>
      <label className={styles.rangeField} htmlFor={`filter-${max}`}>
        <span>최대</span>
        <input
          id={`filter-${max}`}
          className="control"
          name={max}
          type="number"
          inputMode={mode}
          min={signed ? undefined : "0"}
          step="1"
          defaultValue={maxValue}
          placeholder={`최대 ${unit}`}
        />
      </label>
    </fieldset>
  );
}

interface HistoryFilterFieldsProps {
  readonly side: TradeSide;
  readonly value: (key: string) => string;
}

export function HistoryFilterFields({ side, value }: HistoryFilterFieldsProps) {
  return (
    <>
      <div className="field">
        <label className="field-label" htmlFor="filter-from">
          {sideLabel(side)} 시작 일시
        </label>
        <input
          id="filter-from"
          className="control"
          name="from"
          type="datetime-local"
          defaultValue={value("from")}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="filter-to">
          {sideLabel(side)} 종료 일시
        </label>
        <input
          id="filter-to"
          className="control"
          name="to"
          type="datetime-local"
          defaultValue={value("to")}
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="filter-stock">
          종목명 또는 종목코드
        </label>
        <input
          id="filter-stock"
          className="control"
          name="q"
          type="search"
          defaultValue={value("q")}
          placeholder="예: 삼성전자, 005930"
        />
      </div>
      <div className="field">
        <label className="field-label" htmlFor="filter-owner">
          소유주
        </label>
        <select
          id="filter-owner"
          className="control"
          name="ownerId"
          defaultValue={value("ownerId")}
        >
          <option value="">전체</option>
          {OWNERS.map((owner) => (
            <option key={owner.id} value={owner.id}>
              {owner.name}
            </option>
          ))}
        </select>
      </div>
      {FILTER_RANGES.map((group) => (
        <RangeInput
          key={group.min}
          {...group}
          minValue={value(group.min)}
          maxValue={value(group.max)}
        />
      ))}
      {side === "SELL" ? (
        <RangeInput {...PROFIT_RANGE} minValue={value("profitMin")} maxValue={value("profitMax")} />
      ) : null}
    </>
  );
}
