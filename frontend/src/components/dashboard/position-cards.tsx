import styles from "./dashboard.module.css";
import {
  formatPercent,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
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
        <dd className="money">{formatWon(aggregate.costBasis)}</dd>
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
        <dd className="money">{formatWon(aggregate.valuation)}</dd>
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
          <div className={styles.cardGroup} key={brokerage.brokerageCode ?? "legacy"}>
            <ul
              className={`card-grid ${styles.cards}`}
              aria-label={`${owner.name}의 ${brokerage.brokerageName ?? "미지정 증권사"} 보유 종목 현황`}
            >
              {brokerage.stocks.map((stock) => {
                const profitState = profitLabel(stock.unrealizedProfit);
                const profitClass =
                  profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
                return (
                  <li key={`${brokerage.brokerageCode ?? "legacy"}-${stock.itemCode}`}>
                    <article className={styles.card}>
                      <header className={styles.cardHeader}>
                        <div className={styles.cardBrokerage}>
                          <span>증권사</span>
                          <strong>{brokerage.brokerageName ?? "미지정"}</strong>
                          {brokerage.brokerageCode === null ? null : (
                            <span>{brokerage.brokerageCode}</span>
                          )}
                        </div>
                        <h3>{stock.stockName}</h3>
                        <p>{stock.itemCode}</p>
                      </header>
                      <dl className={styles.metricGrid}>
                        <div>
                          <dt>소유주</dt>
                          <dd>{owner.name}</dd>
                        </div>
                        <div>
                          <dt>보유 수량</dt>
                          <dd className="money">{formatQuantity(stock.heldQuantity)}</dd>
                        </div>
                        <div>
                          <dt>매수평균단가</dt>
                          <dd className="money">{formatWon(stock.averageBuyPrice)}</dd>
                        </div>
                        <div>
                          <dt>매입액</dt>
                          <dd className="money">{formatWon(stock.costBasis)}</dd>
                        </div>
                        <div>
                          <dt>증권사 비중</dt>
                          <dd className="money">{formatPercent(stock.brokerageWeight)}</dd>
                        </div>
                        <div>
                          <dt>현재가</dt>
                          <dd className="money">
                            {formatWon(stock.currentPrice)}
                            {stock.currentPrice === null ? (
                              <span className={styles.failedQuote}> 조회 실패</span>
                            ) : null}
                          </dd>
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
                          <dd className="money">{formatWon(stock.valuation)}</dd>
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
              aria-label={`${brokerage.brokerageName ?? "미지정 증권사"} 합계`}
            >
              <h3>
                {brokerage.brokerageName ?? "미지정 증권사"} 합계 ({brokerage.stockCount}종목)
              </h3>
              <PositionTotalMetrics aggregate={brokerage} />
            </aside>
          </div>
        ))}
      </div>
      <aside className={`compact-only ${styles.ownerTotals}`} aria-label={`${owner.name} 합계`}>
        <h3>전체 합계 ({owner.stockCount}종목)</h3>
        <PositionTotalMetrics aggregate={owner} />
      </aside>
    </>
  );
}
