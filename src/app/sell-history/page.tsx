import type { Metadata } from "next";
import { Suspense } from "react";

import {
  HistoryFilters,
  HistoryPagination,
  TradeEntryForm,
  TradeHistory,
} from "@/components/trades";
import { listBrokerages } from "@/lib/domain/brokerages";
import { listTradeHistory } from "@/lib/domain/history";

export const metadata: Metadata = {
  title: "매도 히스토리",
  description: "가족별 국내 주식 매도 기록과 원화 손익을 모든 필드로 검색합니다.",
};

export const dynamic = "force-dynamic";

type SellHistoryPageProps = Readonly<{
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}>;

const FILTER_KEYS = [
  "from",
  "to",
  "q",
  "ownerId",
  "brokerageCode",
  "quantityMin",
  "quantityMax",
  "unitPriceMin",
  "unitPriceMax",
  "amountMin",
  "amountMax",
  "profitMin",
  "profitMax",
] as const;

function hasActiveFilters(searchParams: Awaited<SellHistoryPageProps["searchParams"]>): boolean {
  return FILTER_KEYS.some((key) => {
    const value = searchParams[key];
    return Array.isArray(value)
      ? value.some((entry) => entry.trim().length > 0)
      : typeof value === "string" && value.trim().length > 0;
  });
}

export default async function SellHistoryPage({ searchParams }: SellHistoryPageProps) {
  const rawSearchParams = await searchParams;
  const [result, brokerages] = await Promise.all([
    listTradeHistory("SELL", rawSearchParams),
    listBrokerages(),
  ]);
  const filtered = hasActiveFilters(rawSearchParams);
  const showFilteredEmptyState = filtered && result.unfilteredTotal > 0;

  return (
    <div className="page-frame page-stack">
      <header className="page-intro">
        <p className="page-eyebrow">거래 원장 · 매도</p>
        <h1 className="page-title">매도 히스토리</h1>
        <p className="page-description">
          매도 시점까지의 평균단가로 확정된 손익을 확인하고 모든 필드로 찾아보세요.
        </p>
      </header>

      <TradeEntryForm brokerages={brokerages} side="SELL" />

      <section className="history-section" aria-labelledby="sell-history-title">
        <div className="section-heading">
          <div>
            <p className="page-eyebrow">기록 탐색</p>
            <h2 id="sell-history-title">매도 기록 검색</h2>
          </div>
          <p className="results-heading" role="status" aria-live="polite">
            {filtered
              ? `검색 결과 ${result.total.toLocaleString("ko-KR")}건`
              : `전체 ${result.unfilteredTotal.toLocaleString("ko-KR")}건`}
          </p>
        </div>

        <Suspense fallback={<p role="status">매도 필터를 불러오는 중입니다.</p>}>
          <HistoryFilters brokerages={brokerages} side="SELL" />
        </Suspense>
        <TradeHistory
          side="SELL"
          rows={result.rows}
          total={result.total}
          hasFilters={showFilteredEmptyState}
          brokerages={brokerages}
        />
        <Suspense fallback={null}>
          <HistoryPagination page={result.page} totalPages={result.totalPages} />
        </Suspense>
      </section>
    </div>
  );
}
