import { AccuracyTable } from "@/components/accuracy-table";
import { ChartSection } from "@/components/chart-section";
import { HeroPrediction } from "@/components/hero-prediction";
import { IndicatorCard } from "@/components/indicator-card";
import { LiveStatus } from "@/components/live-status";
import { SeoContent } from "@/components/seo-content";
import { SiteHeader } from "@/components/site-header";
import {
  getDataFreshness,
  getHistoryData,
  getIndicatorData,
  getPredictionData,
} from "@/lib/data";
import Script from "next/script";

export default async function Home() {
  const [prediction, indicators, history, freshness] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
    getDataFreshness(),
  ]);
  const nowKst = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date());
  const freshnessLabel = {
    fresh: "정상 갱신",
    aging: "갱신 지연 가능",
    stale: "갱신 점검 필요",
  }[freshness.status];
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <main className="pageShell">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "코스피 시초가 예측은 무엇을 보나요?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "야간선물, EWY, 환율, 유가, VIX 등 선행지표를 종합해 다음 거래일 시초가의 확률 범위를 제시합니다.",
                },
              },
              {
                "@type": "Question",
                name: "EWY를 왜 함께 보나요?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "EWY는 미국장 마감까지 반영된 한국 ETF라서 한국 대형주 투자 심리를 빠르게 파악하는 데 유용합니다.",
                },
              },
            ],
          }),
        }}
      />
      <SiteHeader
        description="야간선물과 미국 지표, 최근 검증 성과를 함께 보면서 다음 거래일 코스피 시초가 밴드를 빠르게 확인합니다."
        eyebrow="실시간 대시보드"
        title="코스피 시초가 예측 대시보드"
      />

      <LiveStatus lastUpdated={updatedAt} />

      <HeroPrediction prediction={prediction} />

      <section className="sectionCard">
        <div className="sectionHeader">
          <div>
            <p className="sectionEyebrow">데이터 상태</p>
            <h2>수집 파일 최신성</h2>
          </div>
          <div className="statsInline">
            <span>최대 지연 {freshness.ageHours}시간</span>
          </div>
        </div>
        <div className="healthGrid">
          {freshness.files.map((file) => (
            <article className="miniStatCard" key={file.fileName}>
              <span className="miniStatLabel">{file.fileName}</span>
              <strong>
                {new Intl.DateTimeFormat("ko-KR", {
                  dateStyle: "short",
                  timeStyle: "short",
                  timeZone: "Asia/Seoul",
                }).format(new Date(file.modifiedAt))}
              </strong>
            </article>
          ))}
        </div>
      </section>

      <div className="adSlot">광고 슬롯 1</div>

      <section className="sectionCard">
        <div className="sectionHeader">
          <div>
            <p className="sectionEyebrow">섹션 2</p>
            <h2>핵심 선행지표</h2>
          </div>
        </div>

        <div className="indicatorSectionLabel">1차 지표</div>
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

        <div className="indicatorSectionLabel">2차 지표</div>
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

      <ChartSection history={history} />

      <div className="adSlot">광고 슬롯 2</div>

      <AccuracyTable history={history} />

      <SeoContent />

      <footer className="footer">
        <a href="/about">서비스 소개</a>
        <a href="/history">예측 기록</a>
        <a href="/privacy">개인정보처리방침</a>
      </footer>
    </main>
  );
}
