"use client";

import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { StatusMessage } from "@/components/ui/status-message";

import { TradeDeleteConfirmationDialog } from "./TradeDeleteConfirmationDialog";
import { TradeEditDialog } from "./TradeEditDialog";
import { TradeHistoryCards, TradeHistoryTable } from "./TradeHistoryRows";
import styles from "./trade-history.module.css";
import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";
import { useTradeDeletion } from "./useTradeDeletion";

interface TradeHistoryProps {
  readonly side: TradeSide;
  readonly rows: readonly TradeHistoryRow[];
  readonly total: number;
  readonly hasFilters?: boolean;
}

export function TradeHistory({ side, rows, total, hasFilters = false }: TradeHistoryProps) {
  const label = sideLabel(side);
  const deletion = useTradeDeletion({ rows, side });
  const [editingRow, setEditingRow] = useState<TradeHistoryRow | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const editTriggerRef = useRef<HTMLButtonElement>(null);
  const selectionStatusId = `${side}-selection-status`;

  const closeEdit = () => {
    setEditingRow(null);
    window.requestAnimationFrame(() => editTriggerRef.current?.focus());
  };
  const openEdit = (row: TradeHistoryRow, trigger: HTMLButtonElement) => {
    editTriggerRef.current = trigger;
    setEditStatus("");
    setEditingRow(row);
  };
  const savedEdit = () => {
    setEditStatus(`${label} 기록을 수정했습니다.`);
    closeEdit();
  };

  if (rows.length === 0) {
    return (
      <section className={`panel ${styles.empty}`} aria-labelledby={`${side}-history-heading`}>
        <h2 id={`${side}-history-heading`}>{label} 내역</h2>
        <p>
          {hasFilters
            ? "조건과 일치하는 거래가 없습니다. 필터를 조정하거나 초기화해 주세요."
            : `아직 ${label} 기록이 없습니다.`}
        </p>
        {deletion.status ? (
          <StatusMessage tone={deletion.status.tone}>{deletion.status.text}</StatusMessage>
        ) : null}
      </section>
    );
  }

  return (
    <section className={`panel ${styles.section}`} aria-labelledby={`${side}-history-heading`}>
      <div className={styles.heading}>
        <div>
          <h2 id={`${side}-history-heading`}>{label} 내역</h2>
          <p>총 {total.toLocaleString("ko-KR")}건</p>
        </div>
        {!deletion.selectionMode ? (
          <Button onClick={deletion.startSelection} variant="danger">
            삭제
          </Button>
        ) : null}
      </div>
      {deletion.selectionMode ? (
        <div className={styles.selectionToolbar}>
          <p aria-live="polite" id={selectionStatusId} role="status">
            {deletion.selectedRowIds.length.toLocaleString("ko-KR")}건 선택됨
          </p>
          <div className={styles.selectionActions}>
            <Button
              disabled={deletion.selectedRowIds.length === 0}
              isBusy={deletion.deleting}
              busyLabel="삭제 중"
              onClick={deletion.openConfirmation}
              variant="danger"
            >
              선택 삭제
            </Button>
            <Button
              disabled={deletion.deleting}
              onClick={deletion.cancelSelection}
              variant="secondary"
            >
              취소
            </Button>
          </div>
        </div>
      ) : null}
      {editStatus ? <StatusMessage tone="success">{editStatus}</StatusMessage> : null}
      {deletion.status ? (
        <StatusMessage tone={deletion.status.tone}>{deletion.status.text}</StatusMessage>
      ) : null}
      <TradeHistoryTable
        deleting={deletion.deleting}
        onEdit={openEdit}
        onToggle={deletion.toggleSelection}
        rows={rows}
        selectedIds={deletion.selectedIds}
        selectionMode={deletion.selectionMode}
        side={side}
      />
      <TradeHistoryCards
        deleting={deletion.deleting}
        onEdit={openEdit}
        onToggle={deletion.toggleSelection}
        rows={rows}
        selectedIds={deletion.selectedIds}
        selectionMode={deletion.selectionMode}
        side={side}
      />
      <TradeDeleteConfirmationDialog
        count={deletion.selectedRowIds.length}
        deleting={deletion.deleting}
        label={label}
        onCancel={deletion.cancelConfirmation}
        onConfirm={deletion.confirmDeletion}
        open={deletion.confirming}
        side={side}
      />
      <TradeEditDialog
        onCancel={closeEdit}
        onSaved={savedEdit}
        open={editingRow !== null}
        row={editingRow}
        side={side}
      />
    </section>
  );
}
