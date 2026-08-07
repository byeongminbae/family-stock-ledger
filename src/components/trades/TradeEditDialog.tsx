"use client";

import { useEffect, useRef } from "react";

import { isoInstantToSeoulDateTimeLocal } from "./format";
import { TradeEntryFields } from "./TradeEntryFields";
import styles from "./trade-history.module.css";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";
import { useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEditDialogProps {
  readonly open: boolean;
  readonly row: TradeHistoryRow | null;
  readonly side: TradeSide;
  readonly onCancel: () => void;
  readonly onSaved: () => void;
}

interface TradeEditFormProps {
  readonly onCancel: () => void;
  readonly row: TradeHistoryRow;
  readonly side: TradeSide;
  readonly onSaved: () => void;
}

function TradeEditForm({ onCancel, onSaved, row, side }: TradeEditFormProps) {
  const label = sideLabel(side);
  const form = useTradeEntryForm({
    side,
    tradeId: row.id,
    initialValues: {
      executedAt: isoInstantToSeoulDateTimeLocal(row.executedAt),
      ownerId: row.ownerId.toString(),
      stock: {
        code: row.itemCode,
        isEtf: row.isEtf,
        market: row.market,
        name: row.stockName,
      },
      quantity: row.quantity,
      unitPrice: row.unitPrice,
    },
    onSaved: () => onSaved(),
  });

  return (
    <TradeEntryFields
      compact
      form={form}
      formId={`${side}-edit-${row.id}`}
      onCancel={onCancel}
      side={side}
      submitLabel={`${label} 기록 수정`}
    />
  );
}

export function TradeEditDialog({ onCancel, onSaved, open, row, side }: TradeEditDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const label = sideLabel(side);
  const titleId = `${side}-edit-title`;
  const descriptionId = `${side}-edit-description`;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog === null) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className={styles.editDialog}
      onCancel={(event) => {
        event.preventDefault();
        onCancel();
      }}
      ref={dialogRef}
    >
      <div className={styles.editContent}>
        <div>
          <h3 id={titleId}>{label} 기록 수정</h3>
          <p id={descriptionId}>기록의 거래일시, 종목, 소유주, 수량, 단가를 수정할 수 있습니다.</p>
        </div>
        {row ? (
          <TradeEditForm key={row.id} onCancel={onCancel} onSaved={onSaved} row={row} side={side} />
        ) : null}
      </div>
    </dialog>
  );
}
