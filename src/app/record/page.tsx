import type { Metadata } from "next";

import { TradeEntryForm } from "@/components/trades";
import { listBrokerages } from "@/lib/domain/brokerages";

export const metadata: Metadata = {
  title: "기록하기",
  description: "가족별 국내 주식 매수·매도 기록을 한곳에서 추가합니다.",
};

export const dynamic = "force-dynamic";

export default async function RecordPage() {
  const brokerages = await listBrokerages();

  return (
    <div className="page-frame page-stack">
      <header className="page-intro">
        <p className="page-eyebrow">거래 원장</p>
        <h1 className="page-title">기록하기</h1>
        <p className="page-description">매수와 매도 기록을 한곳에서 차례로 남겨보세요.</p>
      </header>

      <TradeEntryForm brokerages={brokerages} side="BUY" />
      <TradeEntryForm brokerages={brokerages} side="SELL" />
    </div>
  );
}
