"use client";

type DashboardErrorProps = Readonly<{
  error: Error & { digest?: string };
  reset: () => void;
}>;

export default function DashboardError({ reset }: DashboardErrorProps) {
  return (
    <div className="page-frame">
      <section className="panel" role="alert">
        <div className="page-header">
          <div>
            <p className="page-kicker">DASHBOARD ERROR</p>
            <h1 className="page-title">보유 현황을 불러오지 못했습니다</h1>
            <p className="page-description">
              데이터 또는 현재가를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.
              입력된 거래 기록은 변경되지 않았습니다.
            </p>
          </div>
          <button type="button" className="button button--primary" onClick={reset}>
            다시 시도
          </button>
        </div>
      </section>
    </div>
  );
}
