import Decimal from "decimal.js";
import type { MarketSession } from "@/lib/domain/market-session";
import styles from "./dashboard.module.css";
import { formatQuoteTime, formatSignedWon, formatWon } from "./format";
import type { DashboardPosition } from "./types";

type SummaryStripProps = Readonly<{
  positions: readonly DashboardPosition[];
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

function totalOf(
  positions: readonly DashboardPosition[],
  field: "costBasis" | "valuation" | "unrealizedProfit",
): string | null {
  if (field !== "costBasis" && positions.some((position) => position[field] === null)) {
    return null;
  }

  return positions
    .reduce((total, position) => {
      const value = position[field];
      return value === null ? total : total.plus(value);
    }, new Decimal(0))
    .toString();
}

export function SummaryStrip({
  positions,
  quoteFetchedAt,
  valuationSessions,
  refreshing,
  onRefresh,
}: SummaryStripProps) {
  const totalCostBasis = totalOf(positions, "costBasis");
  const totalValuation = totalOf(positions, "valuation");
  const totalProfit = totalOf(positions, "unrealizedProfit");
  const stockCount = new Set(positions.map((position) => position.itemCode)).size;
  const quotedCount = new Set(
    positions
      .filter((position) => position.currentPrice !== null)
      .map((position) => position.itemCode),
  ).size;
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
            {formatQuoteTime(quoteFetchedAt)} · {quotedCount}/{stockCount}개 종목 가격 확인
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
          <dd className="money">{formatWon(totalCostBasis)}</dd>
        </div>
        <div>
          <dt>전체 평가액</dt>
          <dd className="money">{formatWon(totalValuation)}</dd>
        </div>
        <div>
          <dt>평가 손익</dt>
          <dd
            className={`${styles.profitValue} ${
              totalProfit === null || new Decimal(totalProfit).isZero()
                ? ""
                : new Decimal(totalProfit).isPositive()
                  ? "positive"
                  : "negative"
            }`}
          >
            {formatSignedWon(totalProfit)}
          </dd>
        </div>
      </dl>
      {quotedCount < stockCount && stockCount > 0 ? (
        <p className={styles.quoteNotice} role="status">
          일부 가격을 불러오지 못해 전체 평가액과 평가 손익을 계산하지 않았습니다. DB 기반 보유
          정보는 그대로 표시합니다.
        </p>
      ) : null}
    </section>
  );
}
