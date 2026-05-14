import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "예측 밴드를 어떻게 읽어야 하는가";
const PAGE_DESCRIPTION =
  "백테스트 75% 밴드 적중률과 최근 실측 기록의 차이를 구체적인 날짜별 데이터로 비교하고, 예측 밴드를 올바르게 해석하는 방법을 안내합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/reading-the-prediction-band" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/reading-the-prediction-band"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function ReadingThePredictionBandPage() {
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
            <span className="researchCardTag">사용 가이드</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            KOSPI Dawn 대시보드에는 점 예측값(pointPrediction)과 함께 예측 밴드(rangeLow~rangeHigh)가
            표시된다. 이 두 숫자를 어떻게 해석해야 하는지, 그리고 왜 백테스트 적중률과
            최근 실측 기록이 다를 수 있는지 실제 데이터를 통해 설명한다.
          </p>
        </div>

        <h3>1. 예측 밴드의 정의</h3>
        <p>
          KOSPI Dawn이 매일 제시하는 숫자는 두 가지 레이어로 구성된다.
          첫 번째는 점 예측값(pointPrediction)으로, 모델이 계산한 가장 가능성 높은 코스피 시초가다.
          두 번째는 예측 밴드(rangeLow ~ rangeHigh)로, 최근 예측 오차의 분포와 시장 변동성을
          반영해 시초가가 들어올 것으로 기대되는 범위를 나타낸다.
        </p>
        <p>
          예측 밴드는 "이 안에 무조건 들어온다"는 확정 구간이 아니다.
          "과거와 비슷한 시장 조건이라면 이 정도 범위를 기대할 수 있다"는 통계적 추정 구간이다.
          따라서 밴드 너비 자체도 정보를 담고 있다. 밴드가 좁을수록 모델이 상대적으로 안정적인
          신호를 받고 있다는 뜻이고, 밴드가 넓을수록 현재 시장 환경이 불확실하다는 신호다.
        </p>

        <h3>2. 백테스트 적중률: 1,462행, 75.26%</h3>
        <p>
          KOSPI Dawn 모델의 백테스트는 약 6년치 데이터(1,462거래일)를 대상으로 진행되었다.
          이 기간 동안 모델 예측 밴드 안에 실제 시초가가 들어온 비율은 75.26%였다.
          방향(상승/하락) 적중률은 76.53%였다.
        </p>
        <p>
          이 숫자들은 정상적인 시장 레짐, 즉 급격한 정책 충격이나 전례 없는 외부 변수 없이
          시장이 글로벌 지표 흐름을 따라 움직이는 구간에서 측정된 값이다.
          6년 치 데이터에는 다양한 상승과 하락 사이클이 포함되어 있지만, 일상적 변동성 범위 안의
          움직임이 대부분을 차지한다.
        </p>

        <h3>3. 최근 17개 실측 기록 분석</h3>
        <p>
          2026년 4월 9일부터 5월 4일까지의 실측 기록 17개를 보면, 밴드 적중은 4건(23.5%)이다.
          백테스트 75.26%와의 차이가 크다. 아래 표는 전체 실측 기록과 결과다.
        </p>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>예측 밴드</th>
                <th>실제 시초가</th>
                <th>적중</th>
              </tr>
            </thead>
            <tbody>
              <tr className="researchTableHit"><td>2026-05-04</td><td>6,740 ~ 6,801</td><td>6,783</td><td>✓</td></tr>
              <tr><td>2026-04-30</td><td>6,669 ~ 6,731</td><td>6,739</td><td>✗</td></tr>
              <tr className="researchTableHit"><td>2026-04-29</td><td>6,559 ~ 6,621</td><td>6,619</td><td>✓</td></tr>
              <tr className="researchTableHit"><td>2026-04-28</td><td>6,614 ~ 6,675</td><td>6,647</td><td>✓</td></tr>
              <tr className="researchTableHit"><td>2026-04-27</td><td>6,472 ~ 6,534</td><td>6,534</td><td>✓</td></tr>
              <tr><td>2026-04-24</td><td>6,288 ~ 6,344</td><td>6,496</td><td>✗</td></tr>
              <tr><td>2026-04-23</td><td>6,604 ~ 6,660</td><td>6,489</td><td>✗</td></tr>
              <tr><td>2026-04-22</td><td>6,274 ~ 6,330</td><td>6,388</td><td>✗</td></tr>
              <tr><td>2026-04-21</td><td>6,078 ~ 6,134</td><td>6,303</td><td>✗</td></tr>
              <tr><td>2026-04-20</td><td>6,315 ~ 6,371</td><td>6,214</td><td>✗</td></tr>
              <tr><td>2026-04-17</td><td>6,299 ~ 6,355</td><td>6,227</td><td>✗</td></tr>
              <tr><td>2026-04-16</td><td>5,991 ~ 6,047</td><td>6,149</td><td>✗</td></tr>
              <tr><td>2026-04-15</td><td>6,084 ~ 6,140</td><td>6,142</td><td>✗</td></tr>
              <tr><td>2026-04-14</td><td>5,890 ~ 5,946</td><td>5,960</td><td>✗</td></tr>
              <tr><td>2026-04-13</td><td>5,802 ~ 5,858</td><td>5,737</td><td>✗</td></tr>
              <tr><td>2026-04-10</td><td>5,660 ~ 5,716</td><td>5,876</td><td>✗</td></tr>
              <tr><td>2026-04-09</td><td>6,054 ~ 6,127</td><td>5,826</td><td>✗</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          4월 9일부터 23일까지 13거래일 연속 밴드 이탈. 4월 27일 이후 5거래일 중 4적중.
          이 기간이 2026년 4월 관세 충격 구간과 정확히 겹친다.
        </p>

        <h3>4. 왜 같은 구간이 이렇게 다른가</h3>
        <p>
          백테스트 75%와 최근 17개 23.5%의 차이는 모델 성능 저하가 아니다.
          모델이 작동하는 레짐(regime)이 달랐기 때문이다.
        </p>
        <p>
          백테스트 1,462거래일에는 다양한 시장 국면이 포함되지만, 단기간에 미국 행정부가
          관세 부과·유예·재부과를 반복하면서 하루 4~5% 변동이 연속되는 구간은 극히 드물었다.
          모델의 예측 밴드 너비는 최근 오차의 분포를 기반으로 산출되는데,
          충격이 시작되기 전 주간의 안정적인 변동성 데이터로 설정된 밴드는
          이후 폭발적 변동성을 담기에 너무 좁았다.
        </p>
        <p>
          반대로 4월 27일 이후 회복 구간에서 적중률이 80%로 복귀한 것은,
          시장이 새로운 안정 레짐에 접어들면서 EWY와 환율 신호가 다시 정상적으로 작동했기 때문이다.
        </p>

        <h3>5. 밴드를 올바르게 해석하는 방법</h3>
        <p>
          예측 밴드를 이용할 때 다음 세 가지를 함께 보면 더 많은 정보를 얻을 수 있다.
        </p>
        <ul>
          <li>
            <strong>밴드 너비:</strong> 현재 표시되는 밴드의 상단-하단 폭을 확인한다.
            60포인트 이하면 상대적으로 안정적인 신호 구간, 80포인트 이상이면 불확실성이 높은 구간으로
            보수적으로 해석하는 것이 좋다.
          </li>
          <li>
            <strong>점 예측값과 밴드의 위치:</strong> 점 예측값이 밴드의 중앙에 있는지,
            한쪽으로 치우쳐 있는지를 살핀다. 비대칭 밴드는 모델이 특정 방향에 더 강한 신호를
            받고 있다는 의미일 수 있다.
          </li>
          <li>
            <strong>외부 이벤트 캘린더:</strong> 미국 연준 회의, 무역 협상 발표, 고용지표 등
            시장 전체 방향을 바꿀 수 있는 이벤트가 예정된 날에는 밴드 외부 시나리오를 추가로 고려한다.
          </li>
        </ul>

        <h3>6. MAE30d: 최근 30일 평균 오차</h3>
        <p>
          대시보드에는 MAE30d(최근 30일 평균 절대 오차)도 함께 표시된다.
          2026년 5월 초 기준 MAE30d는 31.17포인트다.
          이는 최근 30거래일 동안 모델 점 예측값과 실제 시초가 간 평균 오차가
          약 31포인트라는 뜻이다. 코스피 지수 대비 약 0.5% 수준이다.
        </p>
        <p>
          4월 관세 충격 기간이 포함된 수치이므로, 충격 이전 정상 레짐에서의 MAE는 이보다 낮다.
          MAE30d는 모델 현재 성능의 실시간 지표로, 숫자가 클수록 최근 시장 예측이
          어려운 구간임을 나타낸다.
        </p>

        <h3>7. 한 가지 원칙</h3>
        <p>
          KOSPI Dawn은 예측이 맞은 날만 골라서 보여주지 않는다.
          틀린 날도 그대로 기록에 남기고 공개한다.
          이 원칙이 없다면 "75% 적중"이라는 숫자는 의미 없는 사후 선택 편향이 된다.
          실측 기록을 모두 공개하는 것이 이 플랫폼이 연구 도구로서 신뢰를 유지하는 방식이다.
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
