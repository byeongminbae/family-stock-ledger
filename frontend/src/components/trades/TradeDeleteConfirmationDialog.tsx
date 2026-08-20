"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { formatSeoulDateTime } from "./format";
import styles from "./trade-history.module.css";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";

interface TradeDeleteConfirmationDialogProps {
  readonly deleting: boolean;
  readonly open: boolean;
  readonly rows: readonly TradeHistoryRow[];
  readonly side: TradeSide;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function TradeDeleteConfirmationDialog({
  deleting,
  open,
  rows,
  side,
  onCancel,
  onConfirm,
}: TradeDeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [confirmationText, setConfirmationText] = useState("");
  const label = sideLabel(side);
  const isConfirmed = confirmationText === "삭제";
  const titleId = `${side}-delete-confirmation-title`;
  const descriptionId = `${side}-delete-confirmation-description`;
  const confirmationInputId = `${side}-delete-confirmation-input`;
  const confirmationHintId = `${side}-delete-confirmation-hint`;

  const cancelDeletion = () => {
    setConfirmationText("");
    onCancel();
  };

  const confirmDeletion = () => {
    if (!isConfirmed) return;
    setConfirmationText("");
    onConfirm();
  };

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
      className={styles.confirmationDialog}
      onCancel={(event) => {
        event.preventDefault();
        cancelDeletion();
      }}
      ref={dialogRef}
    >
      <div className={styles.confirmationContent}>
        <h3 id={titleId}>{label} 기록 삭제</h3>
        <p id={descriptionId}>
          선택한 {rows.length.toLocaleString("ko-KR")}건의 {label} 기록을 삭제할까요? 삭제하면
          되돌릴 수 없습니다.
        </p>
        <ul aria-label={`삭제할 ${label} 기록`} className={styles.confirmationList}>
          {rows.map((row) => (
            <li className={styles.confirmationItem} key={row.id}>
              <dl>
                <div>
                  <dt>{label} 일시</dt>
                  <dd>
                    <time dateTime={row.executedAt}>{formatSeoulDateTime(row.executedAt)}</time>
                  </dd>
                </div>
                <div>
                  <dt>종목명</dt>
                  <dd>{row.stockName}</dd>
                </div>
                <div>
                  <dt>증권사</dt>
                  <dd>{row.brokerageName}</dd>
                </div>
              </dl>
            </li>
          ))}
        </ul>
        <div className="field">
          <label className="field-label" htmlFor={confirmationInputId}>
            삭제 확인
          </label>
          <input
            aria-describedby={confirmationHintId}
            autoComplete="off"
            autoFocus
            className="control"
            id={confirmationInputId}
            onChange={(event) => setConfirmationText(event.currentTarget.value)}
            spellCheck={false}
            type="text"
            value={confirmationText}
          />
          <p className="field-hint" id={confirmationHintId}>
            계속하려면 <strong>삭제</strong>를 정확히 입력해 주세요.
          </p>
        </div>
        <div className={styles.confirmationActions}>
          <Button onClick={cancelDeletion} variant="secondary">
            취소
          </Button>
          <Button
            disabled={!isConfirmed}
            isBusy={deleting}
            onClick={confirmDeletion}
            variant="danger"
          >
            삭제
          </Button>
        </div>
      </div>
    </dialog>
  );
}
