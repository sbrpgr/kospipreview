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
    num: "No. 22",
    href: "/papers/holiday-ewy-direct-prediction-model",
    title: "공휴일 시나리오 코스피 시초가 예측 모델의 설계 원리와 성능 경계 — 야간선물 브릿지 없는 EWY 직접 기준 예측 체계",
    abstract:
      "국내 공휴일 KRX 휴장 + 미국 시장 운영 시나리오에서 야간선물 브릿지 없이 마지막 KRX 거래일 EWY 종가를 기준점으로 삼는 공휴일 전용 예측 모델(모델2)의 설계와 성능 경계를 분석한다. EWY 변동 ±1% 이내 저변동 구간에서 방향 정확도 83%로 정상 모드에 근접하며, ADR·NDF·공휴일 전용 Rolling Ridge 추정 등 향후 발전 방향을 제시한다.",
    date: "2026-06-04",
  },
  {
    num: "No. 21",
    href: "/papers/kospi-predictability-ceiling-information-entropy",
    title: "코스피 시초가 예측 가능성의 이론적 상한 — Shannon 상호 정보량으로 측정한 예측 엔트로피와 불가예측 하한",
    abstract:
      "Shannon 상호 정보량으로 EWY 신호의 이론적 최대 예측력을 추정하고, 동시호가 과정에서 생성되는 불가예측 엔트로피 하한(정상 레짐 MAE 최소 4.8pt)을 도출한다. 강한 EWY 신호(±3% 초과)에서 예측력이 오히려 감소하는 '정보 과부하 역설'을 실증한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 20",
    href: "/papers/kospi-gap-event-taxonomy",
    title: "코스피 시초가 갭을 유발하는 이벤트·이슈의 다각적 분류와 예측 가능성 평가 — 1,462거래일 실증 분류표",
    abstract:
      "1,462거래일에서 발생한 대형 갭 138건을 통화정책·무역관세·지정학·기업실적·경제지표·수급기술·복합 7개 범주로 분류하고, 범주별 예측 가능성(방향 정확도 38~67%)과 최적 대응 전략을 제시한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 19",
    href: "/papers/prediction-accuracy-extreme-regime-analysis",
    title: "KOSPI Dawn 예측 정확도 극단 구간 분석 — 최고·최저 정확도 레짐의 공통 조건과 사전 탐지 지표",
    abstract:
      "고정확도 구간(MAE<8pt, 방향 일치 79.4%)과 저정확도 구간(MAE>30pt, 방향 일치 41.2%)의 공통 선행 조건을 실증하고, VIX·EWY 변화율·환율 변동성 3개 지표로 구성된 정확도 신호등 시스템을 제안한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 16",
    href: "/papers/overnight-kospi-synthetic-index",
    title: "야간 선물 없이 더 정확한 코스피 야간 지수 추정하기 — 글로벌 합성 바스켓 회귀의 이론과 실증",
    abstract:
      "K200 야간선물(RMSE 21.3pt) 대신 S&P 500·나스닥·닛케이·SOX·달러인덱스를 결합한 글로벌 합성 바스켓 Rolling Ridge 회귀(RMSE 14.8pt)를 제안하고, EWY 공백 구간(04:30~09:00 KST)에서 오차 8.4배 감소를 실증한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 18",
    href: "/papers/intraday-pattern-impact-on-next-opening",
    title: "코스피 당일 장중 패턴이 익일 시초가에 미치는 영향 — 마감 방향성·거래량 이상·시간대별 수익률의 예측 기여도",
    abstract:
      "마감 모멘텀·고점 대비 종가 위치·갭 메움 더미 등 6개 장중 변수의 익일 시초가 예측력을 1,462거래일로 실증하고, EWY 중립일에서 장중 신호 조합의 방향 일치율이 65~71%에 달함을 보인다.",
    date: "2026-05-16",
  },
  {
    num: "No. 17",
    href: "/papers/additional-indices-for-kospi-prediction",
    title: "코스피 시초가 예측력 향상을 위한 추가 획득 가능 지수와 신호 체계 — SOX·VIX·ADR·채권·원자재의 편입 효과 분석",
    abstract:
      "SOX, 삼성전자 ADR, DXY 세 변수를 기존 모델에 추가하면 R²가 0.274→0.341로 개선됨을 증분 R² 분석으로 실증하고, 다중공선성 진단과 실시간 접근성 평가를 통해 최적 편입 조합을 도출한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 15",
    href: "/papers/dynamic-band-width-mae30d-adjustment",
    title: "MAE30d 연동 동적 예측 밴드 너비 조정 체계 — 고정 밴드의 충격 레짐 적중률 저하 문제와 해결 방안",
    abstract:
      "MAE30d에 연동한 하이브리드 동적 밴드를 설계하고, 충격 레짐에서 적중률을 0%→30.77%로 개선하는 시뮬레이션 결과를 제시한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 14",
    href: "/papers/us10y-nonlinear-impact-on-kospi",
    title: "미국 10년물 금리가 코스피 시초가에 미치는 영향의 비선형성 — 성장 기대와 할인율 부담의 임계값 추정",
    abstract:
      "US10Y 4.5%를 임계값으로 추정하여, 그 이하에서는 금리 상승이 코스피 호재, 초과 시 악재로 전환되는 비선형 구조를 실증 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 13",
    href: "/papers/simultaneous-quote-information-asymmetry",
    title: "동시호가 8분이 만드는 정보 비대칭 — 기관·외국인 수급이 EWY 신호를 증폭·상쇄하는 메커니즘",
    abstract:
      "동시호가 구간에서 기관·외국인 수급이 EWY 신호를 역방향으로 상쇄하는 메커니즘을 실측 케이스로 분석하고 수급 프록시 편입 방향을 논한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 12",
    href: "/papers/krw-regime-ewy-coefficient-shift",
    title: "달러-원 환율 1,400원대 진입 이후 EWY-코스피 전달 계수의 구조 변화",
    abstract:
      "고환율 레짐(KRW ≥ 1,400)에서 EWY 계수가 저환율 레짐 대비 14% 압축되는 계수 압축 현상과 그 메커니즘을 Rolling Ridge 추정으로 규명한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 11",
    href: "/papers/opening-gap-mean-reversion",
    title: "코스피 시초가 갭의 평균 회귀 경향 — 대형 갭 발생 익일 방향성 패턴과 예측 난이도 분석",
    abstract:
      "100포인트 초과 상방 갭 발생 익일 하방 회귀 확률이 68%임을 실증하고, 대형 갭 익일은 정상 레짐 대비 예측 오차가 2~8배 높은 고난이도 구간임을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 10",
    href: "/papers/prediction-alert-score-design",
    title: "예측 신뢰도 붕괴 사전 감지와 동적 경보 점수 설계 — R², MAE30d, CSI, VIX 복합 지표의 예측 경보 체계",
    abstract:
      "전신호 이탈 및 예측 신뢰도 붕괴를 사전에 감지하기 위한 복합 예측 경보 점수(PAS)를 설계하고, 2026년 4월 충격 구간에서의 소급 시뮬레이션으로 경보 성능을 검증한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 9",
    href: "/papers/kospi-24h-tracking-indicators",
    title: "코스피 24시간 추적을 위한 다중 실시간 프록시 지표 체계 — 야간 정보 공백의 대체 신호 발굴과 복합 추적 지수 설계",
    abstract:
      "코스피 폐장 이후 익일 개장까지 17.5시간의 정보 공백을 세 구간으로 분해하고, EWY·SOX·금리·원자재 등 지표별 정보 기여도를 실증 평가하여 복합 24시간 추적 지수(KOSPI-24H Index)를 설계한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 8",
    href: "/papers/night-futures-signal-limitations",
    title: "야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계 — 2026년 4~5월 실측 기록 분석",
    abstract:
      "27거래일 전 기간 야간선물이 null로 기록된 구조적 원인을 규명하고, EWY 대체 신호의 크기별 오차 분포와 방향 일치율을 실증하여 고변동 구간에서의 과대반응 메커니즘을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 7",
    href: "/papers/multilayer-prediction-architecture",
    title: "코스피 시초가 예측 모델의 계층적 설계 체계 — EWY Synthetic K200 Ridge 아키텍처의 구조와 설계 원리",
    abstract:
      "코어 EWY+FX, 잔차 Ridge, K200 매핑, 트렌드팔로우 플로어의 4계층 구조와 각 레이어의 설계 철학 및 실증적 기여도를 현재 파라미터 수치와 함께 체계적으로 기술한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 6",
    href: "/papers/total-signal-failure-days",
    title: "전신호 동시 이탈日의 구조적 조건 — 모델·EWY·야간선물이 같은 방향으로 함께 틀리는 날",
    abstract:
      "통계 모델, EWY 신호, 야간선물 기대값이 동시에 같은 방향으로 크게 이탈하는 날의 공통 선행 조건(EWY 고변동, 정책 이벤트, 레짐)을 실측 6건으로 규명하고 상방 편향 비대칭성을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 5",
    href: "/papers/ewy-time-varying-coefficient",
    title: "EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의",
    abstract:
      "Rolling Ridge 추정을 통해 EWY-코스피 전달 계수(β)의 시변성을 분석하고, R² 및 MAE30d를 실시간 모델 신뢰도 지표로 활용하는 동적 투자 활용 체계를 제안한다.",
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
    num: "No. 3",
    href: "/papers/signal-convergence-index",
    title: "다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구",
    abstract:
      "야간선물 단순환산, EWY+환율 환산, 통계 모델 예측 세 신호의 발산 폭을 정량화한 수렴도 지수(CSI)가 당일 예측 오차의 유효한 선행지표인지를 실증적으로 검증한다.",
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
    num: "No. 1",
    href: "/papers/oil-fx-ewy-kospi-model",
    title: "유가·환율·EWY 복합 신호를 활용한 코스피 시초가 예측모델 개발 연구",
    abstract:
      "WTI 유가, 달러-원 환율, EWY ETF 세 신호의 독립 설명력과 최적 조합을 실증적으로 분석하고, Ridge 회귀 기반 복합 예측모델의 구조와 한계를 규명한다.",
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
