import type { MarketSession } from "@/lib/api-contracts";
import styles from "./dashboard.module.css";
import { formatQuoteTime, formatSignedWon, formatWon } from "./format";
import type { DashboardSummaryTotals } from "./types";

type SummaryStripProps = Readonly<{
  totals: DashboardSummaryTotals;
  quoteFetchedAt: string | null;
  valuationSessions: readonly MarketSession[];
  refreshing: boolean;
  onRefresh: () => void;
}>;

const marketSessionLabels = {
  PREOPEN: "정규장",
  PRE_MARKET: "프리",
  REGULAR_MARKET: "정규장",
  AFTER_MARKET: "에프터",
} as const satisfies Readonly<Record<MarketSession, string>>;
const valuationBasisLabels = ["프리", "정규장", "에프터"] as const;

export function SummaryStrip({
  totals,
  quoteFetchedAt,
  valuationSessions,
  refreshing,
  onRefresh,
}: SummaryStripProps) {
  const { costBasis, quotedStockCount, stockCount, unrealizedProfit, valuation } = totals;
  const activeValuationBasisLabels = new Set(
    valuationSessions.map((session) => marketSessionLabels[session]),
  );
  const valuationBasis =
    activeValuationBasisLabels.size === 0
      ? "-"
      : valuationBasisLabels.filter((label) => activeValuationBasisLabels.has(label)).join(" · ");

  return (
    <section className={styles.summary} aria-labelledby="portfolio-summary">
      <div className={styles.summaryHeading}>
        <div>
          <h2 id="portfolio-summary">전체 보유 현황</h2>
          <p>
            {formatQuoteTime(quoteFetchedAt)} · {quotedStockCount}/{stockCount}개 종목 가격 확인
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
          <dd className={styles.sessionValue}>{valuationBasis}</dd>
        </div>
        <div>
          <dt>전체 매입액</dt>
          <dd className="money">{formatWon(costBasis)}</dd>
        </div>
        <div>
          <dt>전체 평가액</dt>
          <dd className="money">{formatWon(valuation)}</dd>
        </div>
        <div>
          <dt>평가 손익</dt>
          <dd
            className={`${styles.profitValue} ${
              unrealizedProfit === null || unrealizedProfit === "0"
                ? ""
                : !unrealizedProfit.startsWith("-")
                  ? "positive"
                  : "negative"
            }`}
          >
            {formatSignedWon(unrealizedProfit)}
          </dd>
        </div>
      </dl>
      {quotedStockCount < stockCount && stockCount > 0 ? (
        <p className={styles.quoteNotice} role="status">
          일부 가격을 불러오지 못해 전체 평가액과 평가 손익을 계산하지 않았습니다. DB 기반 보유
          정보는 그대로 표시합니다.
        </p>
      ) : null}
    </section>
  );
}
