import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "KOSPI Dawn | 코스피 시초가 예측 대시보드",
  description:
    "야간선물, EWY, 환율, VIX를 기반으로 내일 코스피 시초가 밴드를 보여주는 대시보드",
  openGraph: {
    title: "KOSPI Dawn",
    description: "코스피 시초가 예측 대시보드",
    type: "website",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
