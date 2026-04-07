import { AccuracyTable } from "@/components/accuracy-table";
import { ModelDiagnostics } from "@/components/model-diagnostics";
import { RecentDiagnosticsTable } from "@/components/recent-diagnostics-table";
import { SiteHeader } from "@/components/site-header";
import { getBacktestDiagnosticsData, getHistoryData } from "@/lib/data";

export default async function HistoryPage() {
  const [history, diagnostics] = await Promise.all([
    getHistoryData(),
    getBacktestDiagnosticsData(),
  ]);

  return (
    <main className="pageShell innerPage">
      <SiteHeader
        description="롤링 백테스트 결과와 최근 30일 오차를 함께 확인해 현재 선택된 모델이 왜 채택됐는지 바로 볼 수 있습니다."
        eyebrow="검증 이력"
        title="예측 기록과 모델 검증"
      />
      <AccuracyTable history={history} />
      <ModelDiagnostics diagnostics={diagnostics} />
      <RecentDiagnosticsTable diagnostics={diagnostics} />
    </main>
  );
}
