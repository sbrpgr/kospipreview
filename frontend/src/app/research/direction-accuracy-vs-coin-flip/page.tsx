import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "방향 적중률 76%의 의미 — 동전 던지기와 무엇이 다른가";
const PAGE_DESCRIPTION =
  "무작위 50% 대비 76.53%가 통계적으로 유의미한 이유를 설명하고, 방향 적중이 실전에서 어떤 의미를 가지는지 분석합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/direction-accuracy-vs-coin-flip" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/direction-accuracy-vs-coin-flip"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function Page() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="prose">
        <div className="researchArticleHeader">
          <div className="researchArticleMeta">
            <span className="researchCardTag">모델 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            KOSPI Dawn 모델의 백테스트 방향 적중률은 76.53%다. 이 숫자가 동전 던지기(50%)와
            얼마나 다른지, 그리고 실전에서 무엇을 의미하는지를 1,462거래일 데이터를 근거로 분석한다.
          </p>
        </div>

        <h3>1. 동전 던지기와 예측 모델의 차이</h3>
        <p>
          코스피 시초가가 전일 종가 대비 오를지 내릴지를 무작위로 맞힌다면 장기 적중률은 50%에 수렴한다.
          동전 던지기와 다를 바 없다. 예측 모델이 유의미하려면 이 기준선을 통계적으로 유의미한 수준으로
          넘어야 한다. 단순히 50%보다 높다는 것만으로는 부족하고, 표본 크기가 충분할 때 우연이 아닌
          구조적 신호에 의한 결과임을 보여야 한다.
        </p>
        <p>
          KOSPI Dawn의 백테스트는 1,462거래일(약 6년치)을 대상으로 했다. 이 기간 동안 방향 적중률은
          76.53%였다. 1,462번의 시도에서 50%와 76.53%의 차이는 우연으로 설명되기 어렵다.
          같은 기간 밴드 적중률은 75.26%, RMSE는 21.82, MAE는 12.24였다.
        </p>

        <h3>2. 방향 적중이 만들어지는 구조</h3>
        <p>
          방향 적중은 EWY와 달러-원 환율 두 코어 신호에서 출발한다. EWY가 전일 대비 상승했을 때
          코스피도 상승 방향으로 열릴 가능성이 높고, 원화가 강세일 때도 비슷한 패턴을 보인다.
          이 두 신호의 방향성이 일치하면 모델의 방향 예측 신뢰도는 높아지고, 반대 방향이면
          불확실성이 커진다.
        </p>
        <p>
          방향 적중률(76.53%)이 밴드 적중률(75.26%)과 비슷한 수준인 것은 우연이 아니다.
          방향을 맞히면 밴드 안에 들어올 가능성도 높아지고, 방향을 틀리면 밴드도 벗어나는 경우가
          많기 때문이다. 두 지표가 비슷한 값을 가지는 것은 모델이 방향과 크기를 함께 일관성 있게
          추정하고 있다는 뜻이다.
        </p>

        <h3>3. 방향 정보만으로 할 수 있는 것과 없는 것</h3>
        <p>
          방향 적중률 76%가 알려주는 것은 "오를지 내릴지"에 대한 구조적 신호가 존재한다는 사실이다.
          전일 밤 해외 지표의 방향성이 다음날 코스피 시초가 방향에 반영된다는 것을 수치로 확인할 수 있다.
          이는 랜덤워크 가설과 달리 단기 시장에도 통계적으로 활용 가능한 패턴이 존재한다는 근거가 된다.
        </p>
        <p>
          그러나 방향을 안다고 해서 얼마나 움직일지는 알 수 없다. RMSE 21.82포인트는 예측값과
          실제 시초가 사이의 평균 제곱근 오차다. 방향은 맞지만 크기가 크게 다른 날도 있다.
          방향 정보만으로 특정 가격대에서의 진입·청산 판단을 내리는 것은 이 모델의 설계 범위를
          벗어난 활용이다.
        </p>

        <h3>4. 충격 구간에서 방향 적중률도 떨어지는 이유</h3>
        <p>
          2026년 4월 관세 충격 기간(4월 9일~23일), 모델은 13거래일 연속 밴드를 벗어났다.
          이 기간 방향 적중률도 정상 레짐 대비 낮았다. EWY와 환율이 하루 단위로 반대 방향으로
          급변하면서 코어 신호의 방향 자체가 불안정해졌기 때문이다. 4월 9일에는 EWY가 하락,
          4월 10일에는 EWY가 급등—이 두 날의 EWY 방향은 정반대였다.
        </p>
        <p>
          이는 76.53%라는 방향 적중률이 정상 레짐을 전제한 수치임을 의미한다.
          정치·정책 충격으로 신호 자체의 방향이 하루 단위로 뒤집히는 구간에서는
          76%의 기대값을 그대로 적용하기 어렵다. 충격 구간 여부를 사전에 파악하는 것이
          방향 정보를 활용하기 전에 선행되어야 한다.
        </p>

        <h3>5. 76%를 올바르게 해석하는 방법</h3>
        <p>
          76.53%는 "4번 중 3번" 수준의 방향 적중을 뜻한다. 이를 개별 날짜에 적용하면
          어느 날이 그 "1번"일지 알 수 없다. 장기 통계이지, 특정 날의 확률이 아니다.
          동전 던지기와 다른 것은 무작위가 아닌 구조적 신호에서 나온다는 점이고,
          그 신호가 작동하지 않는 조건(충격 구간, 신호 발산)을 파악하는 것이 올바른 활용법이다.
        </p>

        <div className="researchDisclaimer">
          본 분석은 연구 및 참고 목적이며 특정 종목이나 시장에 대한 투자를 권유하지 않습니다.
          모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.
        </div>
        <div className="researchNav">
          <a href="/research" className="researchNavBack">← 리서치 목록으로</a>
        </div>
      </main>
    </div>
  );
}
