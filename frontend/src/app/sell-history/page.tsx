import type { Metadata } from "next";
import { Suspense } from "react";

import { HistoryFilters, HistoryPagination, TradeHistory } from "@/components/trades";
import {
  listBrokerages,
  listOwners,
  listPurchasedStocks,
  listTradeHistory,
} from "@/lib/server/stock-daejang-api";

export const metadata: Metadata = {
  title: "매도 히스토리",
  description: "가족별 국내 주식 매도 기록을 기간, 종목, 소유주, 증권사로 검색합니다.",
};

export const dynamic = "force-dynamic";

type SellHistoryPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

export default async function SellHistoryPage({ searchParams }: SellHistoryPageProps) {
  const rawSearchParams = await searchParams;
  const [result, brokerages, owners, stocks] = await Promise.all([
    listTradeHistory("SELL", rawSearchParams),
    listBrokerages(),
    listOwners(),
    listPurchasedStocks(),
  ]);
  const showFilteredEmptyState = result.hasFilters && result.unfilteredTotal > 0;

  return (
    <div className="page-frame page-stack">
      <header className="page-intro">
        <p className="page-eyebrow">거래 원장 · 매도</p>
        <h1 className="page-title">매도 히스토리</h1>
        <p className="page-description">
          기간, 매수했던 종목, 소유주, 증권사 기준으로{" "}
          <span className="text-nowrap">매도 기록</span>을 찾아보세요.
        </p>
      </header>

      <section className="history-section" aria-labelledby="sell-history-title">
        <div className="section-heading">
          <div>
            <p className="page-eyebrow">기록 탐색</p>
            <h2 id="sell-history-title">매도 기록 검색</h2>
          </div>
          <p className="results-heading" role="status" aria-live="polite">
            {result.hasFilters
              ? `검색 결과 ${result.total.toLocaleString("ko-KR")}건`
              : `전체 ${result.unfilteredTotal.toLocaleString("ko-KR")}건`}
          </p>
        </div>

        <Suspense fallback={<p role="status">매도 필터를 불러오는 중입니다.</p>}>
          <HistoryFilters brokerages={brokerages} owners={owners} stocks={stocks} side="SELL" />
        </Suspense>
        <TradeHistory
          side="SELL"
          rows={result.rows}
          total={result.total}
          hasFilters={showFilteredEmptyState}
          brokerages={brokerages}
          owners={owners}
        />
        <Suspense fallback={null}>
          <HistoryPagination page={result.page} totalPages={result.totalPages} />
        </Suspense>
      </section>
    </div>
  );
}
