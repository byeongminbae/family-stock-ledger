import styles from "./dashboard.module.css";
import {
  formatPercent,
  formatQuantity,
  formatSignedPercent,
  formatSignedWon,
  formatWon,
  profitLabel,
} from "./format";
import type { BrokeragePositionGroup, OwnerTotals } from "./types";

type PositionCardsProps = Readonly<{
  ownerName: string;
  groups: readonly BrokeragePositionGroup[];
  totals: OwnerTotals;
}>;

function PositionTotalMetrics({ totals }: Readonly<{ totals: OwnerTotals }>) {
  const profitState = profitLabel(totals.unrealizedProfit);
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
        <dd className="money">{formatWon(totals.costBasis)}</dd>
      </div>
      <div>
        <dt>증권사 비중</dt>
        <dd className="money">
          {formatPercent(totals.portfolioWeight)}
          {totals.portfolioWeight === null ? (
            <span className="sr-only">증권사 비중은 전체 합계에서 표시하지 않습니다</span>
          ) : null}
        </dd>
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
          {formatSignedWon(totals.unrealizedProfit)}
        </dd>
      </div>
      <div>
        <dt>평가액</dt>
        <dd className="money">{formatWon(totals.valuation)}</dd>
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

export function PositionCards({ ownerName, groups, totals }: PositionCardsProps) {
  return (
    <>
      <div className={`compact-only ${styles.cardGroups}`}>
        {groups.map((group) => (
          <div className={styles.cardGroup} key={group.brokerageCode ?? "legacy"}>
            <ul
              className={`card-grid ${styles.cards}`}
              aria-label={`${ownerName}의 ${group.brokerageName ?? "미지정 증권사"} 보유 종목 현황`}
            >
              {group.positions.map((position) => {
                const profitState = profitLabel(position.unrealizedProfit);
                const profitClass =
                  profitState === "이익" ? "positive" : profitState === "손실" ? "negative" : "";
                return (
                  <li key={`${position.brokerageCode ?? "legacy"}-${position.itemCode}`}>
                    <article className={styles.card}>
                      <header className={styles.cardHeader}>
                        <div className={styles.cardBrokerage}>
                          <span>증권사</span>
                          <strong>{position.brokerageName ?? "미지정"}</strong>
                          {position.brokerageCode === null ? null : (
                            <span>{position.brokerageCode}</span>
                          )}
                        </div>
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
                          <dt>증권사 비중</dt>
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
            <aside
              className={styles.brokerageTotals}
              aria-label={`${group.brokerageName ?? "미지정 증권사"} 합계`}
            >
              <h3>
                {group.brokerageName ?? "미지정 증권사"} 합계 ({group.totals.stockCount}종목)
              </h3>
              <PositionTotalMetrics totals={group.totals} />
            </aside>
          </div>
        ))}
      </div>
      <aside className={`compact-only ${styles.ownerTotals}`} aria-label={`${ownerName} 합계`}>
        <h3>전체 합계 ({totals.stockCount}종목)</h3>
        <PositionTotalMetrics totals={totals} />
      </aside>
    </>
  );
}
