"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/", label: "대시보드" },
  { href: "/buy-history", label: "매수 히스토리" },
  { href: "/sell-history", label: "매도 히스토리" },
] as const;

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link className="app-brand" href="/" aria-label="주식 매매일지 대시보드">
          <span aria-hidden="true" className="app-brand__mark">
            주
          </span>
          <span>주식 매매일지</span>
        </Link>
        <nav aria-label="주요 메뉴" className="app-nav">
          {navigation.map((item) => {
            const isCurrent = pathname === item.href;

            return (
              <Link
                aria-current={isCurrent ? "page" : undefined}
                className="app-nav__link"
                href={item.href}
                key={item.href}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
