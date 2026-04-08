import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "KOSPI Dawn | 코스피 시초가 예측 대시보드",
  description:
    "EWY, 환율, VIX 등 해외 선행 지표를 기반으로 다음 거래일 코스피 시초가 밴드를 예측하는 대시보드입니다.",
  openGraph: {
    title: "KOSPI Dawn | 코스피 시초가 예측",
    description: "LightGBM 기반 코스피 시초가 예측 대시보드",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "KOSPI Dawn | 코스피 시초가 예측",
    description: "LightGBM 기반 코스피 시초가 예측 대시보드",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className={notoSansKR.className}>{children}</body>
    </html>
  );
}
