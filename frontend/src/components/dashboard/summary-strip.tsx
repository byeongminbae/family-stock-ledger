import type { MarketSession } from "@/lib/api-contracts";

import styles from "./dashboard.module.css";
import { formatDashboardWon, formatQuoteTime, formatSignedWon } from "./format";
import type { DashboardResponse } from "./types";

type SummaryStripProps = Readonly<{
  dashboard: DashboardResponse;
  refreshing: boolean;
  onRefresh: () => void;
}>;

const marketSessionLabels = {
  PREOPEN: "정규장",
  PRE_MARKET: "프리",
  REGULAR_MARKET: "정규장",
  AFTER_MARKET: "에프터",
} as const satisfies Readonly<Record<MarketSession, string>>;
export function SummaryStrip({ dashboard, refreshing, onRefresh }: SummaryStripProps) {
  const { checkedStockCount, stockCount, totalBuyAmount, unrealizedProfit, valuation } = dashboard;
  const quoteMetadata =
    dashboard.valuationSession === null
      ? {
          quoteTime: formatQuoteTime(dashboard.quoteFetchedAt),
          valuationBasis: "-",
        }
      : {
          quoteTime: formatQuoteTime(dashboard.quoteFetchedAt),
          valuationBasis: marketSessionLabels[dashboard.valuationSession],
        };

  return (
    <section className={styles.summary} aria-labelledby="portfolio-summary">
      <div className={styles.summaryHeading}>
        <div>
          <h2 id="portfolio-summary">전체 보유 현황</h2>
          <p>
            {quoteMetadata.quoteTime} · {checkedStockCount}/{stockCount}개 종목 가격 확인
          </p>
        </div>
        <button
          className="button button--secondary"
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          aria-busy={refreshing}
        >
          {refreshing ? "가격 확인 중" : "가격 새로고침"}
        </button>
      </div>

      <dl className={styles.summaryGrid} aria-live="polite">
        <div>
          <dt>보유 종목</dt>
          <dd>{stockCount}개</dd>
        </div>
        <div>
          <dt>평가 기준</dt>
          <dd className={styles.sessionValue}>{quoteMetadata.valuationBasis}</dd>
        </div>
        <div>
          <dt>전체 매입액</dt>
          <dd className="money">{formatDashboardWon(totalBuyAmount)}</dd>
        </div>
        <div>
          <dt>전체 평가액</dt>
          <dd className="money">{formatDashboardWon(valuation)}</dd>
        </div>
        <div>
          <dt>평가 손익</dt>
          <dd
            className={`${styles.profitValue} ${
              unrealizedProfit === 0 ? "" : unrealizedProfit > 0 ? "positive" : "negative"
            }`}
          >
            {formatSignedWon(unrealizedProfit)}
          </dd>
        </div>
      </dl>
    </section>
  );
}
