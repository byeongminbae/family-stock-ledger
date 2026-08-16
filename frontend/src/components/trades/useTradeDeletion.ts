import ky from "ky";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { z } from "zod";

import { sideLabel, type TradeHistoryRow, type TradeSide } from "./types";

const deleteResponseSchema = z.discriminatedUnion("success", [
  z.strictObject({
    success: z.literal(true),
    timestamp: z.string(),
    data: z.strictObject({ deletedCount: z.number().int().positive() }),
  }),
  z.strictObject({
    success: z.literal(false),
    statusCode: z.string(),
    timestamp: z.string(),
    message: z.string().min(1),
    fieldErrors: z.record(z.string(), z.string()).nullable().optional(),
  }),
]);

type DeleteStatus = Readonly<{ readonly tone: "error" | "success"; readonly text: string }> | null;

interface UseTradeDeletionOptions {
  readonly rows: readonly TradeHistoryRow[];
  readonly side: TradeSide;
}

export function useTradeDeletion({ rows, side }: UseTradeDeletionOptions) {
  const router = useRouter();
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<DeleteStatus>(null);

  const selectedRows = useMemo(() => {
    return rows.filter((row) => selectedIds.has(row.id));
  }, [rows, selectedIds]);
  const selectedRowIds = useMemo(() => selectedRows.map((row) => row.id), [selectedRows]);

  const startSelection = () => {
    setStatus(null);
    setSelectionMode(true);
  };

  const cancelSelection = () => {
    if (deleting || confirming) return;
    setSelectedIds(new Set());
    setSelectionMode(false);
  };

  const toggleSelection = (id: string) => {
    if (deleting) return;
    setSelectedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openConfirmation = () => {
    if (deleting || selectedRowIds.length === 0) return;
    setConfirming(true);
  };

  const cancelConfirmation = () => {
    if (!deleting) setConfirming(false);
  };

  const confirmDeletion = async () => {
    if (deleting || selectedRowIds.length === 0) return;

    const label = sideLabel(side);
    setConfirming(false);
    setDeleting(true);
    setStatus(null);
    try {
      const response = await ky.delete("/api/v1/trades", {
        throwHttpErrors: false,
        timeout: 10_000,
        json: { side, ids: selectedRowIds },
      });
      const result = deleteResponseSchema.parse(await response.json<unknown>());
      if (!response.ok || !result.success) {
        setStatus({
          tone: "error",
          text: result.success
            ? "삭제에 실패했습니다. 어떤 기록도 삭제되지 않았습니다. 다시 시도해 주세요."
            : `삭제에 실패했습니다. 어떤 기록도 삭제되지 않았습니다. ${result.message}`,
        });
        return;
      }

      setSelectedIds(new Set());
      setSelectionMode(false);
      setStatus({
        tone: "success",
        text: `${label} 기록 ${result.data.deletedCount}건을 삭제했습니다.`,
      });
      router.refresh();
    } catch {
      setStatus({
        tone: "error",
        text: "삭제에 실패했습니다. 어떤 기록도 삭제되지 않았습니다. 선택은 유지되었습니다. 다시 시도해 주세요.",
      });
    } finally {
      setDeleting(false);
    }
  };

  return {
    cancelSelection,
    cancelConfirmation,
    confirming,
    confirmDeletion,
    deleting,
    openConfirmation,
    selectedIds,
    selectedRowIds,
    selectedRows,
    selectionMode,
    startSelection,
    status,
    toggleSelection,
  } as const;
}
