"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import styles from "./dashboard.module.css";
import { OwnerSection } from "./owner-section";
import { SummaryStrip } from "./summary-strip";
import { type DashboardSnapshot, OWNER_NAMES } from "./types";

type DashboardViewProps = Readonly<{
  snapshot: DashboardSnapshot;
}>;

export function DashboardView({ snapshot }: DashboardViewProps) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const isEmpty = snapshot.positions.length === 0;

  function refreshPrices() {
    startRefresh(() => router.refresh());
  }

  return (
    <div className="page-frame">
      <header className={`page-header ${styles.pageHeader}`}>
        <div>
          <p className="page-kicker">FAMILY PORTFOLIO</p>
          <h1 className="page-title">대시보드</h1>
          <p className="page-description">
            가족별 보유 수량과 매입 원가, 오늘의 평가 결과를 한눈에 비교합니다.
          </p>
        </div>
        <Link className="button button--primary" href="/buy-history">
          매수 기록 추가
        </Link>
      </header>

      <SummaryStrip
        positions={snapshot.positions}
        quoteFetchedAt={snapshot.quoteFetchedAt}
        refreshing={refreshing}
        onRefresh={refreshPrices}
      />

      {isEmpty ? (
        <aside className={styles.firstTrade}>
          <div>
            <h2>아직 기록된 보유 종목이 없습니다</h2>
            <p>첫 매수 기록을 남기면 이곳에서 가족별 현황을 볼 수 있습니다.</p>
          </div>
          <Link className="button button--primary" href="/buy-history">
            첫 매수 기록 추가
          </Link>
        </aside>
      ) : null}

      <div className={styles.ownerStack} aria-busy={refreshing}>
        {OWNER_NAMES.map((ownerName) => (
          <OwnerSection
            key={ownerName}
            ownerName={ownerName}
            positions={snapshot.positions.filter((position) => position.ownerName === ownerName)}
            totals={snapshot.ownerTotals[ownerName]}
          />
        ))}
      </div>
    </div>
  );
}
