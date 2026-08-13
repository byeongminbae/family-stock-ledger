import styles from "@/components/dashboard/dashboard.module.css";

export default function AppLoading() {
  return (
    <div className="page-frame" aria-busy="true" aria-live="polite">
      <header className="page-header">
        <div>
          <p className="page-kicker">STOCK JOURNAL</p>
          <div aria-hidden="true" className="page-title">
            페이지를 불러오고 있습니다
          </div>
          <p className="page-description">거래 원장을 안전하게 준비하고 있습니다.</p>
        </div>
      </header>
      <span className="sr-only" role="status">
        페이지 불러오는 중
      </span>
      <div aria-hidden="true" className={styles.ownerStack}>
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
      </div>
    </div>
  );
}
