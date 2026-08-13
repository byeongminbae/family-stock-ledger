"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import styles from "./trade-history.module.css";

interface HistoryPaginationProps {
  readonly page: number;
  readonly totalPages: number;
}

export function HistoryPagination({ page, totalPages }: HistoryPaginationProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  if (totalPages <= 1) return null;

  const hrefFor = (nextPage: number): string => {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  };

  return (
    <nav className={styles.pagination} aria-label="거래 내역 페이지">
      {page > 1 ? (
        <Link className="button button--secondary" href={hrefFor(page - 1)} rel="prev">
          이전
        </Link>
      ) : (
        <span />
      )}
      <span>
        <strong>{page.toLocaleString("ko-KR")}</strong> / {totalPages.toLocaleString("ko-KR")}{" "}
        페이지
      </span>
      {page < totalPages ? (
        <Link className="button button--secondary" href={hrefFor(page + 1)} rel="next">
          다음
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
