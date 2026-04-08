import { AccuracyTable } from "@/components/accuracy-table";
import { ModelDiagnostics } from "@/components/model-diagnostics";
import { SiteHeader } from "@/components/site-header";
import { getBacktestDiagnosticsData, getHistoryData, getDataFreshness } from "@/lib/data";

export default async function HistoryPage() {
  const [history, diagnostics, freshness] = await Promise.all([
    getHistoryData(),
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
            <AccuracyTable history={history} />
        </div>
        <h2 className="sectionTitle">모델 백테스트 검증 (과거 데이터)</h2>
        <div className="prose">
          <ModelDiagnostics diagnostics={diagnostics} />
        </div>
      </main>
    </div>
  );
}
