"use client";

import { useEffect, useRef } from "react";

import { Button } from "@/components/ui/button";

import styles from "./trade-history.module.css";
import type { TradeSide } from "./types";

interface TradeDeleteConfirmationDialogProps {
  readonly count: number;
  readonly deleting: boolean;
  readonly label: string;
  readonly open: boolean;
  readonly side: TradeSide;
  readonly onCancel: () => void;
  readonly onConfirm: () => void;
}

export function TradeDeleteConfirmationDialog({
  count,
  deleting,
  label,
  open,
  side,
  onCancel,
  onConfirm,
}: TradeDeleteConfirmationDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = `${side}-delete-confirmation-title`;
  const descriptionId = `${side}-delete-confirmation-description`;

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
        onCancel();
      }}
      ref={dialogRef}
    >
      <div className={styles.confirmationContent}>
        <h3 id={titleId}>{label} 기록 삭제</h3>
        <p id={descriptionId}>
          선택한 {count.toLocaleString("ko-KR")}건의 {label} 기록을 삭제할까요? 삭제하면 되돌릴 수
          없습니다.
        </p>
        <div className={styles.confirmationActions}>
          <Button autoFocus onClick={onCancel} variant="secondary">
            취소
          </Button>
          <Button isBusy={deleting} onClick={onConfirm} variant="danger">
            삭제
          </Button>
        </div>
      </div>
    </dialog>
  );
}
