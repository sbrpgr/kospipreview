import { AccuracyTable } from "@/components/accuracy-table";
import { ModelDiagnostics } from "@/components/model-diagnostics";
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
        description="롤링 백테스트 결과와 일자별 예측 편차를 함께 확인할 수 있습니다."
        eyebrow="검증 이력"
        title="예측 기록과 모델 검증"
      />
      <AccuracyTable history={history} />
      <ModelDiagnostics diagnostics={diagnostics} />
    </main>
  );
}
