"use client";

import ky from "ky";
import {
  type ChangeEvent,
  type CompositionEvent,
  type KeyboardEvent,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { z } from "zod";
import styles from "./stock-combobox.module.css";
import type { StockSelection } from "./types";

const searchResponseSchema = z.object({
  items: z.array(
    z.object({
      code: z.string().regex(/^[0-9A-Z]{6}$/),
      name: z.string().min(1),
      market: z.string().min(1),
      isEtf: z.boolean(),
    }),
  ),
});

interface StockComboboxProps {
  readonly value: StockSelection | null;
  readonly onChange: (stock: StockSelection | null) => void;
  readonly error?: string | undefined;
  readonly disabled?: boolean;
}

export function StockCombobox({ value, onChange, error, disabled = false }: StockComboboxProps) {
  const baseId = useId();
  const inputId = `${baseId}-stock`;
  const listId = `${baseId}-list`;
  const errorId = `${baseId}-error`;
  const statusId = `${baseId}-status`;
  const composingRef = useRef(false);
  const requestSequenceRef = useRef(0);
  const [query, setQuery] = useState(value?.name ?? "");
  const [items, setItems] = useState<readonly StockSelection[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<"idle" | "loading" | "refreshing" | "ready" | "error">("idle");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    const trimmed = query.trim();
    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    if (value !== null || trimmed.length < 2) {
      setItems([]);
      setActiveIndex(-1);
      setOpen(false);
      setState("idle");
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setState(retryKey > 0 ? "refreshing" : "loading");
      try {
        const payload: unknown = await ky
          .get("/api/stocks/search", {
            searchParams: { q: trimmed },
            signal: controller.signal,
            timeout: 8_000,
          })
          .json();
        if (controller.signal.aborted || requestId !== requestSequenceRef.current) return;
        const parsed = searchResponseSchema.parse(payload);
        setItems(parsed.items);
        setActiveIndex(parsed.items.length > 0 ? 0 : -1);
        setOpen(true);
        setState("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        if (!(error instanceof Error)) throw error;
        setItems([]);
        setState("error");
        setOpen(true);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, retryKey, value]);

  const choose = (stock: StockSelection) => {
    onChange(stock);
    setQuery(stock.name);
    setOpen(false);
    setItems([]);
    setState("idle");
  };

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const nextQuery = event.target.value;
    setQuery(nextQuery);
    setRetryKey(0);
    if (value !== null) {
      onChange(null);
    }
    setItems([]);
    setActiveIndex(-1);
    setOpen(nextQuery.trim().length >= 2);
    setState(nextQuery.trim().length >= 2 ? "loading" : "idle");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const isComposing = composingRef.current || event.nativeEvent.isComposing;
    if (isComposing) {
      if (event.key === "Enter") event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === "Enter" && open) {
      event.preventDefault();
      const selected = items[activeIndex] ?? items[0];
      if (selected !== undefined) choose(selected);
      return;
    }
    if (items.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    }
  };

  const handleComposition = (event: CompositionEvent<HTMLInputElement>) => {
    composingRef.current = event.type !== "compositionend";
    if (event.type === "compositionend") setQuery(event.currentTarget.value);
  };

  const activeItem = activeIndex >= 0 ? items[activeIndex] : undefined;
  const describedBy = [error ? errorId : null, statusId].filter(Boolean).join(" ");
  const searchStatus =
    state === "error"
      ? "종목 검색에 실패했습니다. 다시 시도해 주세요."
      : state === "ready"
        ? `검색 결과 ${items.length}건`
        : "";

  return (
    <div className={styles.field}>
      <label className="field-label" htmlFor={inputId}>
        종목명 <span>(필수)</span>
      </label>
      <div className={styles.anchor}>
        <input
          id={inputId}
          className="control"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={
            open && activeItem ? `${baseId}-option-${activeItem.code}` : undefined
          }
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          disabled={disabled}
          value={query}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onCompositionStart={handleComposition}
          onCompositionEnd={handleComposition}
          placeholder="두 글자 이상 검색"
        />
        {open ? (
          <div className={styles.popover}>
            {state === "loading" || state === "refreshing" ? (
              <p className={styles.message}>
                {state === "refreshing" ? "종목 다시 검색 중" : "종목 검색 중"}
              </p>
            ) : null}
            {state === "ready" && items.length === 0 ? (
              <p className={styles.message}>검색 결과가 없습니다.</p>
            ) : null}
            {state === "error" ? (
              <div className={styles.message}>
                <p>종목을 불러오지 못했습니다.</p>
                <button
                  className="button button--ghost"
                  type="button"
                  onClick={() => setRetryKey((key) => key + 1)}
                >
                  다시 시도
                </button>
              </div>
            ) : null}
            <div id={listId} className={styles.list} role="listbox">
              {items.length > 0
                ? items.map((item, index) => (
                    <button
                      id={`${baseId}-option-${item.code}`}
                      key={item.code}
                      type="button"
                      role="option"
                      tabIndex={-1}
                      aria-selected={index === activeIndex}
                      className={styles.option}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => choose(item)}
                    >
                      <strong>{item.name}</strong>
                      <span>
                        {item.code} · {item.market}
                        {item.isEtf ? " · ETF" : ""}
                      </span>
                    </button>
                  ))
                : null}
            </div>
          </div>
        ) : null}
      </div>
      <div id={statusId} className={styles.status} role="status" aria-live="polite">
        {searchStatus}
      </div>
      {value ? (
        <div className={styles.selection}>
          <span>
            선택: <strong>{value.name}</strong> <code>{value.code}</code>
          </span>
          <button
            type="button"
            className="button button--ghost"
            onClick={() => {
              onChange(null);
              setQuery("");
            }}
            disabled={disabled}
          >
            선택 해제
          </button>
        </div>
      ) : null}
      {error ? (
        <p id={errorId} className="field-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
