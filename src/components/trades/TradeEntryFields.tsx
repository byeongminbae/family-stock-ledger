import { Button } from "@/components/ui/button";
import type { Brokerage } from "@/lib/domain/brokerages";

import { formatInteger, formatWon } from "./format";
import { isIntegerDraft } from "./integer-input";
import { StockCombobox } from "./StockCombobox";
import styles from "./trade-entry-form.module.css";
import { OWNERS, sideLabel, type TradeSide } from "./types";
import type { TradeFieldName, useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEntryFieldsProps {
  readonly brokerages: readonly Brokerage[];
  readonly compact?: boolean;
  readonly form: ReturnType<typeof useTradeEntryForm>;
  readonly formId: string;
  readonly onCancel?: () => void;
  readonly side: TradeSide;
  readonly submitLabel: string;
}

export function TradeEntryFields({
  brokerages,
  compact = false,
  form,
  formId,
  onCancel,
  side,
  submitLabel,
}: TradeEntryFieldsProps) {
  const label = sideLabel(side);
  const fieldError = (name: TradeFieldName) => form.errors[name];
  const id = (name: string) => `${formId}-${name}`;

  return (
    <>
      {form.message ? (
        <div
          ref={form.summaryRef}
          tabIndex={-1}
          className={form.messageTone === "error" ? styles.alert : styles.success}
          role={form.messageTone === "error" ? "alert" : "status"}
        >
          {form.message}
        </div>
      ) : null}
      <form
        className={`${styles.form}${compact ? ` ${styles.compactForm}` : ""}`}
        id={formId}
        onSubmit={form.handleSubmit}
        aria-busy={form.submitting}
        noValidate
      >
        <div className="field">
          <label className="field-label" htmlFor={id("executed-at")}>
            {label} 일시 <span>(필수)</span>
          </label>
          <input
            aria-describedby={`${id("datetime-hint")}${fieldError("executedAt") ? ` ${id("datetime-error")}` : ""}`}
            aria-invalid={fieldError("executedAt") ? true : undefined}
            className="control"
            disabled={form.submitting}
            id={id("executed-at")}
            onChange={(event) => form.setExecutedAt(event.target.value)}
            required
            type="datetime-local"
            value={form.executedAt}
          />
          <p id={id("datetime-hint")} className="field-hint">
            한국시간 기준, YYYY-MM-DD HH:mm
          </p>
          {fieldError("executedAt") ? (
            <p id={id("datetime-error")} className="field-error">
              {fieldError("executedAt")}
            </p>
          ) : null}
        </div>
        <div className={styles.stock}>
          <StockCombobox
            disabled={form.submitting}
            error={fieldError("stock")}
            onChange={form.setStock}
            value={form.stock}
          />
        </div>
        <div className="field">
          <label className="field-label" htmlFor={id("owner")}>
            소유주 <span>(필수)</span>
          </label>
          <select
            className="control"
            disabled={form.submitting}
            id={id("owner")}
            onChange={(event) => form.setOwnerId(event.target.value)}
            value={form.ownerId}
          >
            {OWNERS.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="field-label" htmlFor={id("brokerage")}>
            증권사 <span>(필수)</span>
          </label>
          <select
            aria-describedby={fieldError("brokerageCode") ? id("brokerage-error") : undefined}
            aria-invalid={fieldError("brokerageCode") ? true : undefined}
            className="control"
            disabled={form.submitting}
            id={id("brokerage")}
            onChange={(event) => form.setBrokerageCode(event.target.value)}
            required
            value={form.brokerageCode}
          >
            <option value="">선택해 주세요</option>
            {brokerages.map((brokerage) => (
              <option key={brokerage.code} value={brokerage.code}>
                {brokerage.name}
              </option>
            ))}
          </select>
          {fieldError("brokerageCode") ? (
            <p id={id("brokerage-error")} className="field-error">
              {fieldError("brokerageCode")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="field-label" htmlFor={id("quantity")}>
            {label} 수량 <span>(필수)</span>
          </label>
          <input
            aria-describedby={fieldError("quantity") ? id("quantity-error") : undefined}
            aria-invalid={fieldError("quantity") ? true : undefined}
            className="control"
            disabled={form.submitting}
            id={id("quantity")}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (isIntegerDraft(value)) form.setQuantity(value);
            }}
            type="text"
            value={form.quantity}
          />
          {fieldError("quantity") ? (
            <p id={id("quantity-error")} className="field-error">
              {fieldError("quantity")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="field-label" htmlFor={id("price")}>
            {label} 당시 단가 <span>(필수)</span>
          </label>
          <input
            aria-describedby={fieldError("unitPrice") ? id("price-error") : undefined}
            aria-invalid={fieldError("unitPrice") ? true : undefined}
            className="control"
            disabled={form.submitting}
            id={id("price")}
            onChange={(event) => {
              const value = event.currentTarget.value;
              if (isIntegerDraft(value)) form.setUnitPrice(value);
            }}
            type="text"
            value={form.unitPrice}
          />
          {fieldError("unitPrice") ? (
            <p id={id("price-error")} className="field-error">
              {fieldError("unitPrice")}
            </p>
          ) : null}
        </div>
        <div className={styles.output}>
          <span>{label}액</span>
          <output className="money">{form.amount === null ? "-" : formatWon(form.amount)}</output>
        </div>
        {side === "SELL" ? (
          <div className={styles.output}>
            <span>{form.editing ? "손익 재계산" : "예상 손익"}</span>
            {form.editing ? (
              <small>저장 시 거래 시각 순으로 이 매도와 이후 손익을 다시 계산합니다.</small>
            ) : (
              <output
                className={
                  form.expectedProfit?.startsWith("-") ? "money negative" : "money positive"
                }
              >
                {form.averageUnavailable
                  ? "조회 실패"
                  : form.expectedProfit === null
                    ? "-"
                    : formatWon(form.expectedProfit)}
              </output>
            )}
            {!form.editing && form.average ? (
              <small>
                보유 {formatInteger(form.average.heldQuantity)}주 · 평균{" "}
                {form.average.averageBuyPrice ? formatWon(form.average.averageBuyPrice) : "-"}
              </small>
            ) : null}
          </div>
        ) : null}
        <div className={`${styles.actions}${onCancel ? ` ${styles.dialogActions}` : ""}`}>
          {onCancel ? (
            <Button disabled={form.submitting} onClick={onCancel} variant="secondary">
              취소
            </Button>
          ) : null}
          <Button busyLabel="저장 중" isBusy={form.submitting} type="submit">
            {submitLabel}
          </Button>
        </div>
      </form>
    </>
  );
}
