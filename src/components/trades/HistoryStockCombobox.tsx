"use client";

import {
  type ChangeEvent,
  type CompositionEvent,
  type FocusEvent,
  type KeyboardEvent,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import styles from "./history-filters.module.css";
import type { StockSelection } from "./types";

interface HistoryStockComboboxProps {
  readonly stocks: readonly StockSelection[];
  readonly initialValue: string;
}

function matches(stock: StockSelection, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase("ko-KR");
  return normalized.length === 0
    ? true
    : stock.name.toLocaleLowerCase("ko-KR").includes(normalized) ||
        stock.code.toLocaleUpperCase("en-US").includes(query.trim().toLocaleUpperCase("en-US"));
}

export function HistoryStockCombobox({ stocks, initialValue }: HistoryStockComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-history-stock`;
  const listId = `${baseId}-history-stock-list`;
  const initialStock = stocks.find(
    (stock) => stock.code === initialValue || stock.name === initialValue,
  );
  const [query, setQuery] = useState(initialStock?.name ?? initialValue);
  const [selected, setSelected] = useState<StockSelection | null>(initialStock ?? null);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const composing = useRef(false);
  const items = useMemo(
    () => stocks.filter((stock) => matches(stock, showAll ? "" : query)),
    [query, showAll, stocks],
  );
  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;

  const openList = () => {
    window.clearTimeout(closeTimer.current);
    setShowAll(true);
    setOpen(true);
    setActiveIndex(stocks.length > 0 ? 0 : -1);
  };

  const choose = (stock: StockSelection) => {
    setSelected(stock);
    setQuery(stock.name);
    setOpen(false);
    setActiveIndex(-1);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelected(null);
    setQuery(event.currentTarget.value);
    setShowAll(false);
    setOpen(true);
    setActiveIndex(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (composing.current || event.nativeEvent.isComposing) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (items.length === 0 ? -1 : (index + 1) % items.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) =>
        items.length === 0 ? -1 : index <= 0 ? items.length - 1 : index - 1,
      );
      return;
    }
    if (event.key === "Enter" && open && activeItem !== undefined) {
      event.preventDefault();
      choose(activeItem);
    }
  };

  const handleBlur = (_event: FocusEvent<HTMLInputElement>) => {
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composing.current = event.type !== "compositionend";
  };

  return (
    <div className={`field ${styles.stockField}`}>
      <label className="field-label" htmlFor={inputId}>
        종목명 또는 종목코드
      </label>
      <div className={styles.stockAnchor}>
        <input name="q" type="hidden" value={selected?.code ?? query.trim()} />
        <input
          id={inputId}
          className="control"
          role="combobox"
          aria-autocomplete="list"
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && activeItem !== undefined ? `${baseId}-option-${activeItem.code}` : undefined
          }
          aria-expanded={open}
          autoComplete="off"
          placeholder="매수한 종목 선택"
          value={query}
          onBlur={handleBlur}
          onChange={handleChange}
          onClick={openList}
          onCompositionEnd={handleComposition}
          onCompositionStart={handleComposition}
          onFocus={(event) => {
            event.currentTarget.select();
            openList();
          }}
          onKeyDown={handleKeyDown}
        />
        {open ? (
          <div id={listId} className={styles.stockPopover} role="listbox">
            {items.length === 0 ? (
              <p className={styles.stockMessage}>
                {stocks.length === 0 ? "매수한 종목이 없습니다." : "일치하는 매수 종목이 없습니다."}
              </p>
            ) : (
              items.map((stock, index) => (
                <button
                  id={`${baseId}-option-${stock.code}`}
                  key={stock.code}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className={styles.stockOption}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => choose(stock)}
                >
                  <strong>{stock.name}</strong>
                  <span>{stock.code}</span>
                </button>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
