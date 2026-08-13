import type { Metadata, Viewport } from "next";
import Script from "next/script";
import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "대시보드 | 주식 매매일지",
    template: "%s | 주식 매매일지",
  },
  description: "병민, 할머니, 아빠의 국내 주식 매매 기록과 보유 현황을 확인합니다.",
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

type RootLayoutProps = Readonly<{ children: ReactNode }>;

export default function RootLayout({ children }: RootLayoutProps) {
  const showDevelopmentTools = process.env.NODE_ENV === "development";

  return (
    <html lang="ko">
      <body>
        <a className="skip-link" href="#main-content">
          본문으로 건너뛰기
        </a>
        <AppHeader />
        <main className="app-main" id="main-content" tabIndex={-1}>
          {children}
        </main>
        {showDevelopmentTools ? (
          <>
            <Script
              src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js"
              strategy="afterInteractive"
            />
            <Script
              src="https://unpkg.com/react-grab@0.1.50/dist/index.global.js"
              strategy="afterInteractive"
            />
          </>
        ) : null}
      </body>
    </html>
  );
}
