import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "연구논문";
const PAGE_DESCRIPTION =
  "KOSPI Dawn 퀀트 연구팀이 실측 데이터와 백테스트 결과를 바탕으로 작성한 코스피 시초가 예측 관련 소논문 시리즈입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers"),
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

const PAPERS = [
  {
    num: "No. 1",
    href: "/papers/oil-fx-ewy-kospi-model",
    title: "유가·환율·EWY 복합 신호를 활용한 코스피 시초가 예측모델 개발 연구",
    abstract:
      "WTI 유가, 달러-원 환율, EWY ETF 세 신호의 독립 설명력과 최적 조합을 실증적으로 분석하고, Ridge 회귀 기반 복합 예측모델의 구조와 한계를 규명한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 2",
    href: "/papers/regime-dependent-accuracy",
    title: "시장 레짐 전환이 코스피 시초가 예측 정확도에 미치는 구조적 영향",
    abstract:
      "2026년 4월 관세 충격 전후 실측 데이터를 이용해 VIX 임계값 기반 레짐 분류가 예측 정확도에 미치는 구조적 영향을 분석하고 투자자 관점의 활용 체계를 제시한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 3",
    href: "/papers/signal-convergence-index",
    title: "다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구",
    abstract:
      "야간선물 단순환산, EWY+환율 환산, 통계 모델 예측 세 신호의 발산 폭을 정량화한 수렴도 지수(CSI)가 당일 예측 오차의 유효한 선행지표인지를 실증적으로 검증한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 4",
    href: "/papers/opening-gap-asymmetry",
    title: "코스피 개장 갭 형성의 비대칭성과 통계 모델의 하방 리스크 과소추정 문제",
    abstract:
      "코스피 시초가 갭의 상·하방 비대칭성을 실측 데이터로 확인하고, 연속형 통계 모델이 이산적 정치 충격에 의한 극단 갭을 구조적으로 과소추정하는 메커니즘과 그 투자적 함의를 분석한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 5",
    href: "/papers/ewy-time-varying-coefficient",
    title: "EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의",
    abstract:
      "Rolling Ridge 추정을 통해 EWY-코스피 전달 계수(β)의 시변성을 분석하고, R² 및 MAE30d를 실시간 모델 신뢰도 지표로 활용하는 동적 투자 활용 체계를 제안한다.",
    date: "2026-05-15",
  },
] as const;

export default async function PapersIndexPage() {
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
        <h2 className="sectionTitle" style={{ marginBottom: "6px" }}>연구논문</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "10px", fontSize: "0.95rem" }}>
          KOSPI Dawn 퀀트 연구팀 · Working Paper Series
        </p>
        <p style={{ color: "var(--text-secondary)", marginBottom: "40px", fontSize: "0.92rem", lineHeight: "1.7" }}>
          실측 시초가 기록, 백테스트 데이터, 모델 내부 파라미터를 바탕으로 작성된 소논문 시리즈입니다.
          투자 조언이 아닌 연구 목적의 자료이며, 한국증권학회·한국재무학회 논문 양식을 준용합니다.
        </p>
        <div className="paperList">
          {PAPERS.map((paper) => (
            <a key={paper.href} href={paper.href} className="paperCard">
              <div className="paperCardNum">{paper.num} · {paper.date}</div>
              <h3 className="paperCardTitle">{paper.title}</h3>
              <p className="paperCardAbstract">{paper.abstract}</p>
              <div className="paperCardMeta">전문 읽기 →</div>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
