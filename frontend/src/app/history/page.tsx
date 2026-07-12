import type { Metadata } from "next";
import { HistoryLivePage } from "@/components/history-live-page";
import {
  getBacktestDiagnosticsData,
  getDataFreshness,
  getHistoryData,
  getHolidayHistoryData,
  getHolidayPredictionData,
  getPredictionData,
} from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const HISTORY_TITLE = "최근 예측 기록";
const HISTORY_DESCRIPTION =
  "코스피 시초가 예측 히스토리, 백테스트 정확도, 모델 진단 데이터를 확인할 수 있습니다.";

export const metadata: Metadata = {
  title: HISTORY_TITLE,
  description: HISTORY_DESCRIPTION,
  alternates: {
    canonical: "/history",
  },
  openGraph: {
    title: `${HISTORY_TITLE} | ${SITE_NAME}`,
    description: HISTORY_DESCRIPTION,
    url: toAbsoluteUrl("/history"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${HISTORY_TITLE} | ${SITE_NAME}`,
    description: HISTORY_DESCRIPTION,
  },
};

export default async function HistoryPage() {
  const [history, prediction, diagnostics, freshness, holidayHistory, holidayPrediction] = await Promise.all([
    getHistoryData(),
    getPredictionData(),
    getBacktestDiagnosticsData(),
    getDataFreshness(),
    getHolidayHistoryData(),
    getHolidayPredictionData(),
  ]);

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${SITE_NAME} 최근 예측 기록`,
    description: HISTORY_DESCRIPTION,
    url: toAbsoluteUrl("/history"),
    inLanguage: "ko-KR",
  });

  return (
    <>
      <HistoryLivePage
        initialHistory={history}
        initialPrediction={prediction}
        initialDiagnostics={diagnostics}
        initialFreshness={freshness}
        initialHolidayHistory={holidayHistory}
        initialHolidayPrediction={holidayPrediction}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </>
  );
}

