import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "리서치";
const PAGE_DESCRIPTION =
  "코스피프리뷰 퀀트 리서치 아카이브. 코스피 시초가 예측 모델을 운영하며 실제 데이터에서 발견한 인사이트를 정리합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research"),
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

const ARTICLES = [
  { href: "/research/model-in-volatile-markets", title: "통계모델은 왜 정치 충격에 취약한가", description: "2026년 4월 관세 쇼크 구간에서 모델이 13거래일 연속 밴드를 벗어난 이유를 실측 데이터로 분석합니다.", date: "2026-05-15", tag: "사례 분석" },
  { href: "/research/reading-the-prediction-band", title: "예측 밴드를 어떻게 읽어야 하는가", description: "백테스트 75% 적중률과 최근 실측 기록의 차이를 날짜별 데이터로 비교하고 밴드를 올바르게 해석하는 방법을 안내합니다.", date: "2026-05-15", tag: "사용 가이드" },
  { href: "/research/ewy-krw-core-signals", title: "EWY와 달러-원 환율이 코어 신호인 이유", description: "현재 모델에서 EWY 계수 0.3535, 환율 계수 0.2가 어떻게 도출되었고 왜 이 두 신호가 핵심인지를 실제 수치로 설명합니다.", date: "2026-05-15", tag: "알고리즘" },
  { href: "/research/direction-accuracy-vs-coin-flip", title: "방향 적중률 76%의 의미 — 동전 던지기와 무엇이 다른가", description: "무작위 50% 대비 76.53%가 통계적으로 유의미한 이유를 설명하고, 방향 적중이 실전에서 어떤 의미를 가지는지 분석합니다.", date: "2026-05-15", tag: "모델 분석" },
  { href: "/research/residual-model-auto-disable", title: "잔차 모델이 자동으로 꺼지는 조건 — weight 0.0의 의미", description: "SOX, S&P 등 보조 신호로 구성된 잔차 보정 레이어가 자동 비활성화되는 로직과 현재 비활성 상태인 이유를 설명합니다.", date: "2026-05-15", tag: "모델 분석" },
  { href: "/research/rolling-ridge-reestimation", title: "롤링 180일 재추정 — 왜 어제의 계수와 오늘이 다른가", description: "EWY 계수와 환율 계수를 매일 롤링 윈도우로 재추정하는 이유와 Ridge 정규화의 역할을 실제 파라미터로 설명합니다.", date: "2026-05-15", tag: "모델 분석" },
  { href: "/research/trend-follow-floor-explained", title: "트렌드팔로우 플로어가 작동할 때 — 모델이 신호를 강제 반영하는 조건", description: "EWY+환율 신호가 크게 움직일 때 모델이 과소반응하지 않도록 강제하는 trendFollowFloor 로직을 실제 수치로 설명합니다.", date: "2026-05-15", tag: "모델 분석" },
  { href: "/research/april-10-tariff-pause-case", title: "4월 10일 케이스 — 관세 유예 발표에 모델이 188포인트 아래를 본 이유", description: "트럼프 90일 관세 유예 발표 당일, 모델이 실제 시초가보다 188포인트 낮게 예측한 구조적 이유를 분석합니다.", date: "2026-05-15", tag: "사례 분석" },
  { href: "/research/april-recovery-underestimation", title: "4월 21~24일: 회복 구간에서 모델이 과소추정을 반복한 이유", description: "충격 이후 반등 구간에서 나흘 연속 실제 시초가가 예측 밴드 위에서 열린 패턴을 실측 데이터로 분석합니다.", date: "2026-05-15", tag: "사례 분석" },
  { href: "/research/april-27-may-4-consecutive-hit", title: "4월 27일~5월 4일: 연속 적중 구간은 무엇이 달랐나", description: "13일 연속 밴드 이탈 이후 5거래일 중 4적중으로 모델 성능이 회복된 구간의 시장 조건을 데이터로 분석합니다.", date: "2026-05-15", tag: "사례 분석" },
  { href: "/research/ewy-up-kospi-down-divergence", title: "EWY가 올랐는데 코스피가 내린 날 — 달러-원화 괴리의 조건", description: "EWY 신호는 상승이었지만 코스피 시초가가 하락한 날의 구조를 환율 역전과 수급 관점에서 설명합니다.", date: "2026-05-15", tag: "사례 분석" },
  { href: "/research/sox-and-kospi-opening", title: "SOX와 코스피 시초가 — 반도체 지수가 핵심 보조신호인 이유", description: "필라델피아 반도체 지수(SOX)가 백테스트 feature importance 1위를 기록한 이유와 코스피에서 반도체 비중이 갖는 의미를 설명합니다.", date: "2026-05-15", tag: "지표 분석" },
  { href: "/research/vix-thresholds-and-volatility", title: "VIX 임계값과 시초가 변동성 — 18, 25, 30 구간별 패턴", description: "공포지수 VIX 수준에 따라 코스피 시초가 예측의 불확실성이 어떻게 달라지는지 구간별로 분석합니다.", date: "2026-05-15", tag: "지표 분석" },
  { href: "/research/night-futures-vs-model-comparison", title: "야간선물 단순환산 vs 모델 예측 — 두 숫자가 다를 때 무엇을 보는가", description: "대시보드의 야간선물 단순환산과 모델 예측이 각각 무엇을 측정하고, 두 값이 크게 다를 때 어떻게 해석해야 하는지 설명합니다.", date: "2026-05-15", tag: "지표 분석" },
  { href: "/research/usdkrw-regime-and-model", title: "달러-원 환율 1,400원대의 의미 — 레짐 변화가 모델 계수에 미치는 영향", description: "환율이 특정 레짐에 있을 때 EWY-코스피 관계가 어떻게 달라지고, 롤링 재추정이 이를 어떻게 포착하는지 설명합니다.", date: "2026-05-15", tag: "지표 분석" },
  { href: "/research/kospi-simultaneous-quote-mechanism", title: "코스피 동시호가 8분 — 시초가가 결정되는 구조", description: "KRX 동시호가 제도에서 09:00 시초가가 형성되는 과정을 설명하고, 이 구조가 왜 통계적 예측을 어렵게 만드는지 분석합니다.", date: "2026-05-15", tag: "메커니즘" },
  { href: "/research/information-timeline-1530-to-0900", title: "한국장 마감 이후 정보 타임라인 — 15:30 KST에서 익일 09:00까지", description: "코스피 마감 이후 다음날 시초가까지 정보가 순서대로 쌓이는 타임라인과, 각 시점에서 코스피프리뷰가 무엇을 처리하는지 설명합니다.", date: "2026-05-15", tag: "메커니즘" },
  { href: "/research/opening-gap-conditions", title: "개장 갭이 큰 날의 조건 — 전일 종가와 크게 다르게 열리는 패턴", description: "코스피가 전일 종가 대비 큰 갭으로 열리는 날의 공통 조건을 실측 데이터에서 추출하고, 대형 갭이 예측에 미치는 영향을 분석합니다.", date: "2026-05-15", tag: "메커니즘" },
  { href: "/research/three-numbers-together", title: "세 가지 예측값을 함께 읽는 방법 — 수렴할 때와 발산할 때", description: "대시보드의 야간선물 단순환산, EWY+환율 환산, 모델 예측 세 값이 수렴·발산하는 경우 각각 어떻게 해석해야 하는지 안내합니다.", date: "2026-05-15", tag: "사용 가이드" },
  { href: "/research/five-principles-for-using-forecast", title: "예측 모델을 참고할 때 반드시 알아야 할 다섯 가지", description: "코스피프리뷰 예측값을 올바르게 활용하고 잘못 사용하지 않기 위한 다섯 가지 원칙을 정리합니다.", date: "2026-05-15", tag: "사용 가이드" },
] as const;

export default async function ResearchIndexPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main>
        <h2 className="sectionTitle" style={{ marginBottom: "8px" }}>리서치</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "40px", fontSize: "0.97rem" }}>
          코스피 시초가 예측 모델을 실제로 운영하면서 데이터에서 발견한 인사이트를 정리합니다.
          백테스트 결과, 실측 기록, 모델 내부 수치를 바탕으로 한 분석이며 투자 조언이 아닙니다.
        </p>
        <div className="researchList">
          {ARTICLES.map((article) => (
            <a key={article.href} href={article.href} className="researchCard">
              <div className="researchCardMeta">
                <span className="researchCardTag">{article.tag}</span>
                <span className="researchCardDate">{article.date}</span>
              </div>
              <h3 className="researchCardTitle">{article.title}</h3>
              <p className="researchCardDesc">{article.description}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
