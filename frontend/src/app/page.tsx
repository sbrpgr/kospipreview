import type { Metadata } from "next";
import { LiveDashboard } from "@/components/live-dashboard";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";
import {
  CONTACT_EMAIL,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  toAbsoluteUrl,
} from "@/lib/seo";

export const metadata: Metadata = {
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: toAbsoluteUrl("/"),
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
    images: [
      {
        url: toAbsoluteUrl("/og-image.svg"),
        width: 1200,
        height: 630,
        alt: "KOSPI Dawn - 코스피 시초가 예측 대시보드",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [toAbsoluteUrl("/og-image.svg")],
  },
};

const FAQ_ITEMS = [
  {
    q: "KOSPI Dawn은 어떤 서비스인가요?",
    a: "다음 거래일 코스피 시초가를 시장 지표 기반으로 추정해 보여주는 인공지능 예측 대시보드입니다.",
  },
  {
    q: "예측값은 실시간 확정 가격인가요?",
    a: "아닙니다. 예측값은 통계적 추정치이며 지표별 갱신 주기와 시장 상황에 따라 실제 결과와 달라질 수 있습니다.",
  },
  {
    q: "어떤 지표를 주로 사용하나요?",
    a: "EWY, 환율(USD/KRW), 변동성 지수, 주요 미국 지수, 원자재, 야간선물 등 복수 지표를 종합 반영합니다.",
  },
  {
    q: "데이터가 바로 안 바뀌는 경우는 오류인가요?",
    a: "항상 오류는 아닙니다. 지표별 갱신 주기가 다르므로 출처별 반영 시차가 생길 수 있습니다.",
  },
  {
    q: "문의는 어디로 하면 되나요?",
    a: `문의는 이메일(${CONTACT_EMAIL})로만 접수받습니다.`,
  },
] as const;

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);

  const dateModified = prediction.generatedAt ?? indicators.generatedAt ?? history.generatedAt;
  const jsonLd = JSON.stringify([
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      url: toAbsoluteUrl("/"),
      inLanguage: "ko-KR",
      description: SITE_DESCRIPTION,
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: toAbsoluteUrl("/"),
      logo: toAbsoluteUrl("/favicon.svg"),
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "customer support",
          email: CONTACT_EMAIL,
          availableLanguage: ["ko", "en"],
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: SITE_NAME,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "ko-KR",
      description: SITE_DESCRIPTION,
      url: toAbsoluteUrl("/"),
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: "KOSPI 시초가 예측 데이터",
      description:
        "EWY, USD/KRW, 변동성 지표 및 기타 시장지표를 활용한 코스피 시초가 추정 데이터",
      url: toAbsoluteUrl("/"),
      inLanguage: "ko-KR",
      creator: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      keywords: SITE_KEYWORDS,
      dateModified,
      distribution: [
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: toAbsoluteUrl("/data/prediction.json"),
        },
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: toAbsoluteUrl("/data/indicators.json"),
        },
        {
          "@type": "DataDownload",
          encodingFormat: "application/json",
          contentUrl: toAbsoluteUrl("/data/history.json"),
        },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: FAQ_ITEMS.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    },
  ]);

  return (
    <>
      <LiveDashboard
        initialPrediction={prediction}
        initialIndicators={indicators}
        initialHistory={history}
        initialFreshness={freshness}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </>
  );
}

