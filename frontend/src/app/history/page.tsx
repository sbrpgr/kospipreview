import type { Metadata } from "next";
import { AccuracyTable } from "@/components/accuracy-table";
import { ModelDiagnostics } from "@/components/model-diagnostics";
import { SiteHeader } from "@/components/site-header";
import { getBacktestDiagnosticsData, getDataFreshness, getHistoryData, getPredictionData } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const HISTORY_TITLE = "최근 예측 기록";
const HISTORY_DESCRIPTION =
  "코스피 시초가 예측 히스토리, 백테스트 정확도, 모델 진단 정보를 확인할 수 있습니다.";

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
  const [history, prediction, diagnostics, freshness] = await Promise.all([
    getHistoryData(),
    getPredictionData(),
    getBacktestDiagnosticsData(),
    getDataFreshness(),
  ]);

  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main>
        <h2 className="sectionTitle">예측 기록 상세</h2>
        <div style={{ marginBottom: "60px" }}>
          <AccuracyTable history={history} prediction={prediction} />
        </div>
        <h2 className="sectionTitle">모델 백테스트 검증(과거 데이터)</h2>
        <div className="prose">
          <ModelDiagnostics diagnostics={diagnostics} />
        </div>
      </main>
    </div>
  );
}
