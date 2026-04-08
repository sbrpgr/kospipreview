import { ChartSection } from "@/components/chart-section";
import { HeroPrediction } from "@/components/hero-prediction";
import { IndicatorCard } from "@/components/indicator-card";
import { LiveStatus } from "@/components/live-status";
import { AccuracyTable } from "@/components/accuracy-table";
import { SeoContent } from "@/components/seo-content";
import { SiteHeader } from "@/components/site-header";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";
import { AutoRefresh } from "@/components/auto-refresh";

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);

  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <main className="pageShell">
      <AutoRefresh intervalMs={120000} />

      <SiteHeader
        description="미국 시장 마감 데이터와 핵심 선행지표를 종합 분석하여, 다음 거래일 코스피 시초가 예측 밴드를 제시합니다."
        eyebrow="실시간 예측"
        title="코스피 시초가 예측"
      />

      <LiveStatus lastUpdated={updatedAt} status={freshness.status} />

      <HeroPrediction prediction={prediction} />

      {/* 핵심 선행지표 */}
      <section className="sectionCard">
        <div className="sectionHeader">
          <div>
            <p className="sectionEyebrow">선행지표</p>
            <h2>핵심 시장 지표</h2>
          </div>
        </div>

        <div className="indicatorSectionLabel">주요 지표</div>
        <div className="indicatorGrid">
          {indicators.primary.map((indicator) => (
            <IndicatorCard
              changePct={indicator.changePct}
              emphasized
              key={indicator.key}
              label={indicator.label}
              updatedAt={indicator.updatedAt}
              value={indicator.value}
              sourceUrl={indicator.sourceUrl}
              dataSource={indicator.dataSource}
            />
          ))}
        </div>

        <div className="indicatorSectionLabel">보조 지표</div>
        <div className="indicatorGrid">
          {indicators.secondary.map((indicator) => (
            <IndicatorCard
              changePct={indicator.changePct}
              key={indicator.key}
              label={indicator.label}
              updatedAt={indicator.updatedAt}
              value={indicator.value}
              sourceUrl={indicator.sourceUrl}
              dataSource={indicator.dataSource}
            />
          ))}
        </div>
      </section>

      {/* 추세 차트 */}
      <ChartSection history={history} />

      {/* 편차 기록 */}
      <AccuracyTable history={history} />

      {/* SEO */}
      <SeoContent />

      <footer className="footer">
        <a href="/about">서비스 소개</a>
        <a href="/history">예측 기록</a>
        <a href="/privacy">개인정보처리방침</a>
        <span>© 2026 KOSPI Dawn</span>
      </footer>
    </main>
  );
}
