import styles from "./dashboard.module.css";
import {
  formatPercent,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  profitLabel,
} from "./format";
import type { DashboardPosition, OwnerTotals } from "./types";

type PositionCardsProps = Readonly<{
  ownerName: string;
  positions: readonly DashboardPosition[];
  totals: OwnerTotals;
}>;

export function PositionCards({ ownerName, positions, totals }: PositionCardsProps) {
  const totalProfitState = profitLabel(totals.unrealizedProfit);
  const totalProfitClass =
    totalProfitState === "이익" ? "positive" : totalProfitState === "손실" ? "negative" : "";

  return (
    <>
      <ul
        className={`compact-only card-grid ${styles.cards}`}
        aria-label={`${ownerName}의 보유 종목 현황`}
      >
        {positions.map((position) => {
          const profitState = profitLabel(position.unrealizedProfit);
          const profitClass =
            profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
          return (
            <li key={position.itemCode}>
              <article className={styles.card}>
                <header className={styles.cardHeader}>
                  <h3>{position.stockName}</h3>
                  <p>{position.itemCode}</p>
                </header>
                <dl className={styles.metricGrid}>
                  <div>
                    <dt>소유주</dt>
                    <dd>{ownerName}</dd>
                  </div>
                  <div>
                    <dt>보유 수량</dt>
                    <dd className="money">{formatQuantity(position.heldQuantity)}</dd>
                  </div>
                  <div>
                    <dt>매수평균단가</dt>
                    <dd className="money">{formatWon(position.averageBuyPrice)}</dd>
                  </div>
                  <div>
                    <dt>매입액</dt>
                    <dd className="money">{formatWon(position.costBasis)}</dd>
                  </div>
                  <div>
                    <dt>전체 비중</dt>
                    <dd className="money">{formatPercent(position.portfolioWeight)}</dd>
                  </div>
                  <div>
                    <dt>현재가</dt>
                    <dd className="money">
                      {formatWon(position.currentPrice)}
                      {position.currentPrice === null ? (
                        <span className={styles.failedQuote}> 조회 실패</span>
                      ) : null}
                    </dd>
                  </div>
                  <div>
                    <dt>평가 손익</dt>
                    <dd className={`money ${profitClass}`}>
                      <span className="sr-only">{profitState} </span>
                      {formatSignedWon(position.unrealizedProfit)}
                    </dd>
                  </div>
                  <div>
                    <dt>평가액</dt>
                    <dd className="money">{formatWon(position.valuation)}</dd>
                  </div>
                  <div>
                    <dt>수익률</dt>
                    <dd className={`money ${profitClass}`}>
                      <span className="sr-only">{profitState} </span>
                      {formatSignedPercent(position.returnRate)}
                    </dd>
                  </div>
                </dl>
              </article>
            </li>
          );
        })}
      </ul>
      <aside className={`compact-only ${styles.ownerTotals}`} aria-label={`${ownerName} 합계`}>
        <h3>합계 ({totals.stockCount}종목)</h3>
        <dl className={styles.metricGrid}>
          <div>
            <dt>보유 수량</dt>
            <dd className="money">{formatQuantity(totals.heldQuantity)}</dd>
          </div>
          <div>
            <dt>매수평균단가</dt>
            <dd className="money">{formatWon(totals.averageBuyPrice)}</dd>
          </div>
          <div>
            <dt>매입액</dt>
            <dd className="money">{formatWon(totals.costBasis)}</dd>
          </div>
          <div>
            <dt>전체 비중</dt>
            <dd className="money">{formatPercent(totals.portfolioWeight)}</dd>
          </div>
          <div>
            <dt>현재가</dt>
            <dd className="money">
              -<span className="sr-only">현재가는 합산하지 않습니다</span>
            </dd>
          </div>
          <div>
            <dt>평가 손익</dt>
            <dd className={`money ${totalProfitClass}`}>
              <span className="sr-only">{totalProfitState} </span>
              {formatSignedWon(totals.unrealizedProfit)}
            </dd>
          </div>
          <div>
            <dt>평가액</dt>
            <dd className="money">{formatWon(totals.valuation)}</dd>
          </div>
          <div>
            <dt>수익률</dt>
            <dd className={`money ${totalProfitClass}`}>
              <span className="sr-only">{totalProfitState} </span>
              {formatSignedPercent(totals.returnRate)}
            </dd>
          </div>
        </dl>
      </aside>
    </>
  );
}
