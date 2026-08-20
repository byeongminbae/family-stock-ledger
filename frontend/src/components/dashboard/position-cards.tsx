import styles from "./dashboard.module.css";
import {
  formatDashboardPercent,
  formatDashboardQuantity,
  formatDashboardWon,
  formatSignedPercent,
  formatSignedWon,
  profitLabel,
} from "./format";
import type { DashboardBrokerage, DashboardOwner } from "./types";

type PositionCardsProps = Readonly<{
  owner: DashboardOwner;
  brokerages: readonly DashboardBrokerage[];
}>;

function PositionTotalMetrics({
  aggregate,
}: Readonly<{ aggregate: DashboardBrokerage | DashboardOwner }>) {
  const profitState = profitLabel(aggregate.unrealizedProfit);
  const profitClass =
    profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";

  return (
    <dl className={styles.metricGrid}>
      <div>
        <dt>보유 수량</dt>
        <dd className="money">
          -<span className="sr-only">보유 수량은 합산하지 않습니다</span>
        </dd>
      </div>
      <div>
        <dt>매수평균단가</dt>
        <dd className="money">
          -<span className="sr-only">매수평균단가는 합산하지 않습니다</span>
        </dd>
      </div>
      <div>
        <dt>매입액</dt>
        <dd className="money">{formatDashboardWon(aggregate.totalBuyAmount)}</dd>
      </div>
      <div>
        <dt>현재가</dt>
        <dd className="money">
          -<span className="sr-only">현재가는 합산하지 않습니다</span>
        </dd>
      </div>
      <div>
        <dt>평가 손익</dt>
        <dd className={`money ${profitClass}`}>
          <span className="sr-only">{profitState} </span>
          {formatSignedWon(aggregate.unrealizedProfit)}
        </dd>
      </div>
      <div>
        <dt>평가액</dt>
        <dd className="money">{formatDashboardWon(aggregate.valuation)}</dd>
      </div>
      <div>
        <dt>수익률</dt>
        <dd className="money">
          -<span className="sr-only">수익률은 합산하지 않습니다</span>
        </dd>
      </div>
    </dl>
  );
}

export function PositionCards({ owner, brokerages }: PositionCardsProps) {
  return (
    <>
      <div className={`compact-only ${styles.cardGroups}`}>
        {brokerages.map((brokerage) => (
          <div className={styles.cardGroup} key={brokerage.brokerageCode}>
            <ul
              className={`card-grid ${styles.cards}`}
              aria-label={`${owner.ownerName}의 ${brokerage.brokerageName} 보유 종목 현황`}
            >
              {brokerage.stocks.map((stock) => {
                const profitState = profitLabel(stock.unrealizedProfit);
                const profitClass =
                  profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
                return (
                  <li key={`${brokerage.brokerageCode}-${stock.stockCode}`}>
                    <article className={styles.card}>
                      <header className={styles.cardHeader}>
                        <div className={styles.cardBrokerage}>
                          <span>증권사</span>
                          <strong>{brokerage.brokerageName}</strong>
                          <span>{brokerage.brokerageCode}</span>
                        </div>
                        <h3>{stock.stockName}</h3>
                        <p>{stock.stockCode}</p>
                      </header>
                      <dl className={styles.metricGrid}>
                        <div>
                          <dt>소유주</dt>
                          <dd>{owner.ownerName}</dd>
                        </div>
                        <div>
                          <dt>보유 수량</dt>
                          <dd className="money">{formatDashboardQuantity(stock.quantity)}</dd>
                        </div>
                        <div>
                          <dt>매수평균단가</dt>
                          <dd className="money">{formatDashboardWon(stock.averageBuyPrice)}</dd>
                        </div>
                        <div>
                          <dt>매입액</dt>
                          <dd className="money">{formatDashboardWon(stock.totalBuyAmount)}</dd>
                        </div>
                        <div>
                          <dt>증권사 비중</dt>
                          <dd className="money">{formatDashboardPercent(stock.brokerageWeight)}</dd>
                        </div>
                        <div>
                          <dt>현재가</dt>
                          <dd className="money">{formatDashboardWon(stock.currentPrice)}</dd>
                        </div>
                        <div>
                          <dt>평가 손익</dt>
                          <dd className={`money ${profitClass}`}>
                            <span className="sr-only">{profitState} </span>
                            {formatSignedWon(stock.unrealizedProfit)}
                          </dd>
                        </div>
                        <div>
                          <dt>평가액</dt>
                          <dd className="money">{formatDashboardWon(stock.valuation)}</dd>
                        </div>
                        <div>
                          <dt>수익률</dt>
                          <dd className={`money ${profitClass}`}>
                            <span className="sr-only">{profitState} </span>
                            {formatSignedPercent(stock.returnRate)}
                          </dd>
                        </div>
                      </dl>
                    </article>
                  </li>
                );
              })}
            </ul>
            <aside
              className={styles.brokerageTotals}
              aria-label={`${brokerage.brokerageName} 합계`}
            >
              <h3>
                {brokerage.brokerageName} 합계 ({brokerage.stockCount}종목)
              </h3>
              <PositionTotalMetrics aggregate={brokerage} />
            </aside>
          </div>
        ))}
      </div>
      <aside
        className={`compact-only ${styles.ownerTotals}`}
        aria-label={`${owner.ownerName} 합계`}
      >
        <h3>전체 합계 ({owner.stockCount}종목)</h3>
        <PositionTotalMetrics aggregate={owner} />
      </aside>
    </>
  );
}
