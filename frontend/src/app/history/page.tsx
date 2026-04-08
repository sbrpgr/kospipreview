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
    <div className="dashboardShell">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="dashboardBody" style={{ flexDirection: "column", padding: "20px", overflowY: "auto" }}>
        <h2 style={{ marginBottom: "20px" }}>예측 기록 상세</h2>
        <div style={{ height: "400px", marginBottom: "30px", border: "1px solid var(--border)", display: "flex", flexDirection: "column" }}>
            <AccuracyTable history={history} />
        </div>
        <h2 style={{ marginBottom: "20px" }}>모델 백테스트 검증 (과거 데이터)</h2>
        <ModelDiagnostics diagnostics={diagnostics} />
      </main>
    </div>
  );
}
