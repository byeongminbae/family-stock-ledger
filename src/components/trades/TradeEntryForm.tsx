"use client";

import { TradeEntryFields } from "./TradeEntryFields";
import styles from "./trade-entry-form.module.css";
import { sideLabel, type TradeSide } from "./types";
import { useTradeEntryForm } from "./useTradeEntryForm";

interface TradeEntryFormProps {
  readonly side: TradeSide;
  readonly onSaved?: ((tradeId: string) => void) | undefined;
}

export function TradeEntryForm({ side, onSaved }: TradeEntryFormProps) {
  const label = sideLabel(side);
  const form = useTradeEntryForm({ side, onSaved });

  return (
    <section className={`panel ${styles.section}`} aria-labelledby={`${side}-entry-heading`}>
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>새 거래</p>
          <h2 id={`${side}-entry-heading`}>{label} 기록 추가</h2>
        </div>
        <p>금액은 수량과 당시 단가로 자동 계산됩니다.</p>
      </div>
      <TradeEntryFields
        form={form}
        formId={`${side}-create`}
        side={side}
        submitLabel={`${label} 기록 저장`}
      />
    </section>
  );
}
