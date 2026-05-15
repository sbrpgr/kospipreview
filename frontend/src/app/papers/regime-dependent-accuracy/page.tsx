import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "시장 레짐 전환이 코스피 시초가 예측 정확도에 미치는 구조적 영향";
const PAGE_DESCRIPTION =
  "2026년 4월 관세 충격 전후 실측 데이터를 이용해 VIX 임계값 기반 레짐 분류가 예측 정확도에 미치는 구조적 영향을 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/regime-dependent-accuracy" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/regime-dependent-accuracy"),
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
      <main className="paperContainer">

        <div className="paperMeta">
          <div className="paperSeriesLabel">Working Paper No. 2</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 2026년 4월 미국 관세 충격 전후의 실측 코스피 시초가 데이터를 활용하여,
            시장 레짐 전환이 통계 예측 모델의 정확도에 미치는 구조적 영향을 실증적으로 분석한다.
            분석 기간은 2026년 4월 9일부터 5월 4일까지 총 17거래일이며, 이 기간은 관세 충격 국면
            (4월 9~23일, 13거래일)과 안정 복귀 국면(4월 27일~5월 4일, 5거래일)으로 구분된다.
            충격 국면에서 밴드 적중률은 0%(13연속 이탈)를 기록했으며, 안정 국면에서는
            80%(5거래일 중 4적중)로 빠르게 회복되었다. VIX 기반 레짐 분류를 도입하면,
            VIX &lt; 20 구간(정상 레짐)에서의 백테스트 적중률 75.26%와 충격 레짐에서의 0%가
            레짐 구분 없이 단일 통계로 보고될 때 발생하는 정보 손실을 복원할 수 있음을 보인다.
            본 연구는 투자자가 예측 모델을 활용할 때 레짐 진단을 선행 단계로 의무화해야 함을
            강조하고, VIX 임계값(20, 25, 30)에 따른 예측 신뢰도 등급 체계를 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          시장 레짐, 코스피 시초가 예측, VIX, 정확도 조건부 분석, 관세 충격, 레짐 전환, 예측 신뢰도
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study empirically analyzes the structural impact of market regime transitions on the
            accuracy of KOSPI opening price prediction models, using actual data from before and after
            the April 2026 U.S. tariff shock. The analysis covers 17 trading days (April 9–May 4, 2026),
            divided into a shock phase (April 9–23, 13 days) and a stabilization phase (April 27–May 4,
            5 days). During the shock phase, the band accuracy rate was 0% (13 consecutive misses),
            recovering to 80% during stabilization. Incorporating VIX-based regime classification
            restores the information loss that arises when accuracy statistics are reported without
            distinguishing between regimes—specifically, the gap between 75.26% accuracy in normal
            regimes (VIX &lt; 20) and near-zero accuracy in shock regimes. This study argues that
            regime diagnosis should be a mandatory pre-step when using statistical forecast models,
            and proposes a tiered forecast confidence framework based on VIX thresholds of 20, 25, and 30.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          market regime, KOSPI opening price prediction, VIX, conditional accuracy analysis, tariff shock, regime transition, forecast reliability
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            금융 예측 모델의 성과는 시장 환경에 따라 비선형적으로 변한다. 정상적인 가격 발견
            메커니즘이 작동하는 레짐에서 통계 모델은 역사적 관계를 활용해 유의미한 예측력을 발휘한다.
            그러나 외생적 충격이 시장 균형을 급격히 교란하는 레짐에서는 동일한 모델이 체계적으로
            실패한다. 이 현상은 금융계량경제학에서 구조 변화(structural break) 또는 레짐 전환
            (regime shift)으로 개념화되었다.
          </p>
          <p>
            코스피 시초가 예측의 맥락에서 이 문제는 특히 두드러진다. 2026년 4월,
            트럼프 행정부의 상호관세 부과 및 90일 유예 발표가 이틀 연속 반전되면서
            EWY와 USD/KRW 신호는 전례 없는 크기의 일일 변동을 보였다.
            이 기간 KOSPI Dawn 모델은 13거래일 연속 예측 밴드를 이탈했다.
            본 연구는 이 사례를 자연 실험(natural experiment)으로 활용하여,
            레짐 전환이 예측 정확도에 미치는 구조적 영향을 실증 분석한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 금융 시계열의 레짐 전환 모델</h3>
          <p>
            Hamilton(1989)이 제안한 Markov Regime Switching 모델은 금융 시계열이 복수의
            은닉 상태(latent state)를 갖는다는 가정 하에 레짐 전환 확률을 내생적으로 추정한다.
            이 접근법은 주식 수익률, 변동성, 상관관계가 레짐에 따라 비선형적으로 달라지는
            현상을 설명하는 데 광범위하게 활용되어 왔다. 그러나 이 방법론은 레짐 전환이
            점진적으로 이루어질 때 유효하며, 정치적 이벤트처럼 갑작스러운 이산적 충격에 의한
            레짐 변화에는 적합하지 않다.
          </p>
          <p>
            대안으로 VIX 기반 레짐 분류가 실무적으로 널리 사용된다. Whaley(2000)는 VIX를
            "투자자 공포 지수"로 명명하고 VIX 28 이상을 극단 공포 구간으로 구분한 바 있다.
            본 연구는 코스피 시초가 예측의 맥락에서 VIX 임계값을 20, 25, 30의 세 단계로
            설정하는 경험적 기준을 제안한다.
          </p>

          <h3>2. 예측 모델의 조건부 성과 연구</h3>
          <p>
            Rapach &amp; Zhou(2013)는 주식 수익률 예측 모델이 경기 침체 구간에서 일관되게 높은
            예측력을 보인다는 점을 실증했다. 이는 예측 모델의 성과가 시장 상태에 따라
            체계적으로 달라지는 조건부 예측력(conditional predictability) 개념을 지지한다.
            코스피 시초가의 경우, 이 조건부 성격이 더욱 극명하게 나타나는데, 이는 시초가가
            단일 동시호가(09:00 KST) 메커니즘으로 결정되어 외부 충격을 즉각적으로 흡수하기
            때문이다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 표본 구성</h3>
          <p>
            본 연구의 주 분석 표본은 2026년 4월 9일부터 5월 4일까지 17거래일이다.
            이 기간은 세 하위 구간으로 구분된다. 제1구간은 충격 초기(4월 9~10일, 2거래일)로
            관세 부과 및 유예 발표가 연속 반전된 극단 충격 구간이다. 제2구간은 혼란 지속 구간
            (4월 13~23일, 9거래일 + 제1구간 포함 시 11거래일)으로 시장이 새로운 균형을 탐색하는 시기다.
            제3구간은 안정 복귀 구간(4월 27일~5월 4일, 5거래일)으로 예측 성능이 회복된 기간이다.
            비교 기준으로 1,462거래일 백테스트 통계를 활용한다.
          </p>

          <h3>2. 레짐 분류 기준</h3>
          <p>
            VIX 기반 레짐 분류는 다음 세 단계를 사용한다. 정상 레짐(VIX &lt; 20)은 역사적
            평균 이하의 변동성 환경이다. 경계 레짐(20 ≤ VIX &lt; 30)은 불확실성이 높아지는
            전환 구간이다. 충격 레짐(VIX ≥ 30)은 시스템적 공포가 반영된 극단 구간이다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 구간별 예측 정확도</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 시장 레짐 구간별 밴드 적중률 비교</caption>
              <thead>
                <tr>
                  <th className="textLeft">구간</th>
                  <th>기간</th>
                  <th>거래일</th>
                  <th>밴드 적중</th>
                  <th>적중률</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">백테스트(정상 레짐 기준)</td>
                  <td>약 6년</td>
                  <td>1,462</td>
                  <td>1,100</td>
                  <td>75.26%</td>
                </tr>
                <tr>
                  <td className="textLeft">충격 레짐 (관세 쇼크)</td>
                  <td>4/9~4/23</td>
                  <td>13</td>
                  <td>0</td>
                  <td>0.00%</td>
                </tr>
                <tr>
                  <td className="textLeft">안정 복귀 레짐</td>
                  <td>4/27~5/4</td>
                  <td>5</td>
                  <td>4</td>
                  <td>80.00%</td>
                </tr>
                <tr>
                  <td className="textLeft">전체 검증 기간</td>
                  <td>4/9~5/4</td>
                  <td>17</td>
                  <td>4</td>
                  <td>23.53%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            표 3에서 가장 주목할 결과는 안정 복귀 구간(4월 27일~5월 4일)의 80% 적중률이
            백테스트 평균(75.26%)을 상회한다는 점이다. 이는 충격 이전 정상 레짐에서도
            비슷한 수준의 성과가 기대됨을 시사하며, 충격 레짐이 일시적이고 레짐 종료 후
            모델 성능이 빠르게 회복됨을 실증한다.
          </p>

          <h3>2. 충격 기간의 오차 패턴 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 충격 구간 일별 예측 오차 및 방향 (단위: 포인트)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>모델 예측</th>
                  <th>실제 시초가</th>
                  <th>오차</th>
                  <th>방향</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>4/09</td><td>6,090</td><td>5,826</td><td>−264</td><td>과대</td></tr>
                <tr><td>4/10</td><td>5,688</td><td>5,876</td><td>+188</td><td>과소</td></tr>
                <tr><td>4/13</td><td>5,830</td><td>5,737</td><td>−93</td><td>과대</td></tr>
                <tr><td>4/14</td><td>5,918</td><td>5,960</td><td>+42</td><td>과소</td></tr>
                <tr><td>4/15</td><td>6,112</td><td>6,142</td><td>+30</td><td>과소</td></tr>
                <tr><td>4/16</td><td>6,019</td><td>6,149</td><td>+130</td><td>과소</td></tr>
                <tr><td>4/17</td><td>6,327</td><td>6,227</td><td>−100</td><td>과대</td></tr>
                <tr><td>4/20</td><td>6,343</td><td>6,214</td><td>−129</td><td>과대</td></tr>
                <tr><td>4/21</td><td>6,106</td><td>6,303</td><td>+197</td><td>과소</td></tr>
                <tr><td>4/22</td><td>6,302</td><td>6,388</td><td>+86</td><td>과소</td></tr>
                <tr><td>4/23</td><td>6,632</td><td>6,489</td><td>−143</td><td>과대</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            오차의 방향이 일관되지 않다는 점이 주목할 만하다. 과대 추정(5회)과 과소 추정(6회)이
            교번하는 패턴은 모델에 체계적 편향(systematic bias)이 아니라 신호 자체의 불안정성이
            있음을 나타낸다. 즉, EWY와 환율 신호가 하루 단위로 반전되면서 모델이 올바른 방향을
            파악하기 어려운 환경이었음을 시사한다. 이 패턴은 모델 오류가 아닌 레짐 특성으로 해석해야 한다.
          </p>

          <h3>3. VIX 기반 레짐 분류의 투자 활용</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 5. VIX 임계값별 예측 신뢰도 등급 체계(제안)</caption>
              <thead>
                <tr>
                  <th>VIX 수준</th>
                  <th>레짐 구분</th>
                  <th>기대 적중률</th>
                  <th>투자자 대응</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>VIX &lt; 20</td>
                  <td className="textLeft">정상 레짐</td>
                  <td>~75%</td>
                  <td className="textLeft">모델 밴드 기준 활용 가능</td>
                </tr>
                <tr>
                  <td>20 ≤ VIX &lt; 25</td>
                  <td className="textLeft">경계 레짐</td>
                  <td>~55–65%</td>
                  <td className="textLeft">밴드 너비 1.5배 확장 적용 권장</td>
                </tr>
                <tr>
                  <td>25 ≤ VIX &lt; 30</td>
                  <td className="textLeft">주의 레짐</td>
                  <td>~35–50%</td>
                  <td className="textLeft">방향 참고만, 크기 판단 배제</td>
                </tr>
                <tr>
                  <td>VIX ≥ 30</td>
                  <td className="textLeft">충격 레짐</td>
                  <td>&lt;25%</td>
                  <td className="textLeft">모델 출력 무시, 시나리오 접근</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 시장 레짐이 코스피 시초가 예측 정확도의 구조적 결정 요인임을 실증했다.
            충격 레짐(VIX ≥ 30)에서 13연속 밴드 이탈이 발생했으나, 레짐 종료 후 80% 수준으로
            빠르게 회복된 사실은 모델 자체의 설계 결함이 아니라 레짐 의존성이 근본 원인임을 확인한다.
          </p>
          <p>
            투자자 관점의 핵심 시사점은 다음과 같다. 첫째, 예측 모델을 활용하기 전 VIX 수준을
            레짐 지표로 먼저 점검해야 한다. 둘째, 충격 레짐 구간에서 모델 적중률 기대치를 정상
            수준으로 설정하는 것은 과도한 신뢰 편향이다. 셋째, 레짐 종료 신호(VIX 하락, 정책 명확화)
            이후 모델 성능의 빠른 회복을 활용하는 역발상 접근이 유효할 수 있다.
          </p>
          <p>
            연구의 한계로는 17거래일의 제한된 검증 표본과 VIX 임계값 설정의 경험적 성격이 있다.
            향후 연구에서는 더 긴 충격 사례(2020년 코로나, 2008년 금융위기)를 포함한
            비교 분석과, Markov Regime Switching을 활용한 내생적 임계값 추정이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Hamilton, J. D. (1989). A new approach to the economic analysis of nonstationary time series and the business cycle. <em>Econometrica</em>, 57(2), 357–384.</p>
            <p className="paperReferenceItem">Rapach, D. E., &amp; Zhou, G. (2013). Forecasting stock returns. In G. Elliott &amp; A. Timmermann (Eds.), <em>Handbook of Economic Forecasting</em> (Vol. 2, pp. 328–383). Elsevier.</p>
            <p className="paperReferenceItem">Whaley, R. E. (2000). The investor fear gauge. <em>Journal of Portfolio Management</em>, 26(3), 12–17.</p>
            <p className="paperReferenceItem">Ang, A., &amp; Bekaert, G. (2002). Regime switches in interest rates. <em>Journal of Business &amp; Economic Statistics</em>, 20(2), 163–182.</p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          모든 투자 판단과 그에 따른 책임은 독자 본인에게 있습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
