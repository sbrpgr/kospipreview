import type { Metadata } from "next";
import { LiveDashboard } from "@/components/live-dashboard";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";
import {
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
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);

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
      "@type": "Dataset",
      name: "KOSPI 시초가 예측 데이터",
      description: "EWY, USD/KRW, VIX 등 주요 시장 지표를 활용한 코스피 시초가 예측 데이터",
      url: toAbsoluteUrl("/"),
      inLanguage: "ko-KR",
      creator: {
        "@type": "Organization",
        name: SITE_NAME,
      },
      keywords: SITE_KEYWORDS,
      dateModified: prediction.generatedAt ?? indicators.generatedAt ?? history.generatedAt,
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
