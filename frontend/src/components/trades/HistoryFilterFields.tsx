import { useRef, useState } from "react";
import type { Brokerage } from "@/lib/domain/brokerages";
import { HistoryStockCombobox } from "./HistoryStockCombobox";
import { periodRange } from "./history-date-range";
import { PERIOD_PRESETS } from "./history-filter-config";
import styles from "./history-filters.module.css";
import { OWNERS, type StockSelection } from "./types";

interface HistoryFilterFieldsProps {
  readonly brokerages: readonly Brokerage[];
  readonly stocks: readonly StockSelection[];
  readonly value: (key: string) => string;
}

function selectedPeriod(from: string, to: string): (typeof PERIOD_PRESETS)[number] | null {
  if (!from && !to) return null;
  if (!from || !to) return "기간선택";
  for (const preset of PERIOD_PRESETS) {
    if (preset === "기간선택") continue;
    const range = periodRange(preset);
    if (range.from === from && range.to === to) return preset;
  }
  return "기간선택";
}

function HistoryDateRange({ value }: Pick<HistoryFilterFieldsProps, "value">) {
  const [from, setFrom] = useState(() => value("from"));
  const [to, setTo] = useState(() => value("to"));
  const [selectedPreset, setSelectedPreset] = useState<(typeof PERIOD_PRESETS)[number] | null>(() =>
    selectedPeriod(value("from"), value("to")),
  );
  const fromInput = useRef<HTMLInputElement>(null);

  const applyPeriod = (preset: (typeof PERIOD_PRESETS)[number]) => {
    if (preset === "기간선택") {
      setSelectedPreset(preset);
      fromInput.current?.focus();
      return;
    }
    const range = periodRange(preset);
    setFrom(range.from);
    setTo(range.to);
    setSelectedPreset(preset);
  };

  return (
    <fieldset className={styles.dateRange}>
      <legend>기간</legend>
      <div className={styles.periodPresets}>
        {PERIOD_PRESETS.map((preset) => (
          <button
            className="button button--secondary"
            key={preset}
            type="button"
            aria-pressed={selectedPreset === preset}
            onClick={() => applyPeriod(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
      <div className={styles.dateInputs}>
        <label className={styles.dateInput} htmlFor="filter-from">
          <span className="sr-only">시작일</span>
          <input
            className="control"
            id="filter-from"
            name="from"
            ref={fromInput}
            type="date"
            value={from}
            onChange={(event) => {
              setFrom(event.currentTarget.value);
              setSelectedPreset("기간선택");
            }}
          />
        </label>
        <span aria-hidden="true">~</span>
        <label className={styles.dateInput} htmlFor="filter-to">
          <span className="sr-only">종료일</span>
          <input
            className="control"
            id="filter-to"
            name="to"
            type="date"
            value={to}
            onChange={(event) => {
              setTo(event.currentTarget.value);
              setSelectedPreset("기간선택");
            }}
          />
        </label>
      </div>
    </fieldset>
  );
}

export function HistoryFilterFields({ brokerages, stocks, value }: HistoryFilterFieldsProps) {
  return (
    <>
      <HistoryDateRange value={value} />
      <HistoryStockCombobox initialValue={value("q")} stocks={stocks} />
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
      <div className="field">
        <label className="field-label" htmlFor="filter-brokerage">
          증권사
        </label>
        <select
          id="filter-brokerage"
          className="control"
          name="brokerageCode"
          defaultValue={value("brokerageCode")}
        >
          <option value="">전체</option>
          {brokerages.map((brokerage) => (
            <option key={brokerage.code} value={brokerage.code}>
              {brokerage.name}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
