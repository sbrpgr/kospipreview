import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";

export default async function AboutPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="dashboardShell">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="dashboardBody" style={{ flexDirection: "column", padding: "20px", overflowY: "auto", maxWidth: "800px", margin: "0 auto" }}>
        
        <h2 style={{ marginBottom: "20px", display: "flex", gap: "12px", alignItems: "baseline" }}>
          <span>예측 모델 및 방법론</span>
          <span style={{ fontSize: "0.8rem", color: "var(--text-dim)", fontWeight: "normal" }}>Model & Methodology</span>
        </h2>
        
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "24px", borderRadius: "var(--radius-sm)", marginBottom: "24px" }}>
          <h3 style={{ color: "var(--accent-bright)", marginBottom: "12px" }}>1. LightGBM + Quantile Regression</h3>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
            과거 단순 다중 회귀(Linear Regression)에서 트리 앙상블 기반의 <strong>LightGBM</strong> 엔진으로 교체되었습니다.
            이전 모델들의 선형적 한계를 극복하고, 비선형적인 파생 지표 변동성(VIX, 달러-원 환율 급등 등) 상황에서도 최적화된 예측치를 생성합니다.
            단일 가격(Point) 대신 분위수 회귀(Quantile Regression, alpha=0.2 및 0.8)를 통해 데이터 기반의 상하단 밴드를 자율 추정합니다.
          </p>

          <h3 style={{ color: "var(--accent-bright)", marginBottom: "12px", marginTop: "24px" }}>2. 하이퍼파라미터 및 백테스트</h3>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "16px" }}>
            모델은 매일 학습 파이프라인에서 최적화를 수행합니다 (KST 기준 일 2회). 최근 30일 MAE, RMSE 피드백을 통해 밴드폭의 유의성을 지속적으로 평가하며, 예측 실패(HIT = False)가 발생한 구간의 페널티 가중치를 조정하도록 구성되어 있습니다.
          </p>

          <h3 style={{ color: "var(--accent-bright)", marginBottom: "12px", marginTop: "24px" }}>3. 주요 데이터 파이프라인 요소</h3>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "8px" }}>
            다음 종목들의 직전일 종가 및 시간외 팩터를 포함합니다.
          </p>
          <ul style={{ color: "var(--text-secondary)", lineHeight: 1.8, paddingLeft: "20px", fontFamily: "var(--font-mono)", fontSize: "0.9rem" }}>
            <li>iShares MSCI South Korea ETF (EWY)</li>
            <li>Direxion Daily South Korea Bull 3X (KORU)</li>
            <li>S&P 500 & Nasdaq 100 (^GSPC, ^NDX)</li>
            <li>CBOE Volatility Index (^VIX)</li>
            <li>US Dollar/Korean Won (KRW=X)</li>
            <li>WTI Crude Oil & Gold (CL=F, GC=F)</li>
            <li>US 10-Year Treasury Yield (^TNX)</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
