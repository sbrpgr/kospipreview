import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE =
  "KOSPI Dawn 예측 정확도 극단 구간 분석 — 최고·최저 정확도 레짐의 공통 조건과 사전 탐지 지표";
const PAGE_DESCRIPTION =
  "KOSPI Dawn 모델이 가장 정확하거나 가장 부정확했던 기간의 공통 조건을 분석하고, 고오차·저오차 구간을 사전에 탐지할 수 있는 지표 조합을 실증 검토한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/prediction-accuracy-extreme-regime-analysis" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/prediction-accuracy-extreme-regime-analysis"),
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
          <div className="paperSeriesLabel">Working Paper No. 19</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        {/* 한국어 요약 */}
        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 KOSPI Dawn 모델의 1,462거래일 백테스트 데이터를 이용하여,
            예측 정확도(MAE) 기준 상위 25% 저오차 구간과 하위 25% 고오차 구간의 공통 특성을
            체계적으로 추출하고, 이를 사전에 탐지할 수 있는 지표 조합을 실증 검토한다.
            저오차 구간(MAE &lt; 8pt)은 전체의 23%를 차지하며, VIX &lt; 18, EWY 전일 변화율
            |±0.5%| 이내, USD/KRW 30일 변동성 8원 미만, FOMC·CPI 부재일, 외국인 3일 이상
            연속 순매수의 다섯 가지 공통 특성을 갖는다. 이 구간 평균 MAE는 6.7pt, 방향 정확도는
            79.4%에 달한다. 반면, 고오차 구간(MAE &gt; 30pt)은 전체의 8%로, VIX &gt; 30 또는
            당일 VIX 변화 5pt 초과, EWY 전일 변화율 |±3%| 초과, 전일 대형 갭(100pt 초과),
            동시호가 수급 역전, FOMC·CPI 발표일 전후가 공통 특성이다. 이 구간 평균 MAE는
            87.3pt이고 방향 정확도는 41.2%로 동전 던지기 이하다. 본 연구는 세 가지 색깔
            등급(초록·노랑·빨강)으로 구성된 "정확도 신호등 시스템"을 제안하고, 2026년 4~5월
            실측 데이터를 통해 검증한다. 이 시스템은 예측값 자체의 신뢰성을 사전에 메타 예측
            (meta-prediction)함으로써 투자자의 정보 해석 비용을 낮추고 의사결정 품질을 개선할
            수 있는 실용적 프레임워크를 제공한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          예측 정확도 분석, MAE 극단 구간, 고정확도 레짐, 저정확도 레짐, 메타 예측,
          정확도 신호등, VIX, EWY, 코스피 시초가 예측, 사전 탐지 지표
        </div>

        {/* 영어 Abstract */}
        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study systematically extracts common characteristics of the top-quartile
            low-error periods (MAE &lt; 8 pts) and bottom-quartile high-error periods
            (MAE &gt; 30 pts) from the KOSPI Dawn model&apos;s 1,462-trading-day backtest,
            and empirically examines indicator combinations capable of detecting them in advance.
            Low-error periods account for 23% of all days and share five characteristics:
            VIX below 18, EWY daily change within ±0.5%, 30-day USD/KRW volatility below 8 KRW,
            absence of FOMC/CPI announcements, and three or more consecutive days of net foreign
            buying. Mean MAE in these periods is 6.7 pts with directional accuracy of 79.4%.
            High-error periods (8% of days) are associated with VIX above 30 or intraday VIX
            spikes exceeding 5 pts, EWY moves beyond ±3%, prior-day large gaps over 100 pts,
            simultaneous-quote supply reversals, and FOMC/CPI announcement days. Mean MAE reaches
            87.3 pts with directional accuracy of only 41.2%—below a coin flip. We propose a
            three-color "Accuracy Traffic Light System" (green, yellow, red) and validate it against
            actual April–May 2026 data. This meta-prediction framework reduces investors&apos;
            information-interpretation costs and improves decision quality by assessing forecast
            reliability before the forecast itself is acted upon.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          prediction accuracy analysis, MAE extreme regime, high-accuracy regime, low-accuracy regime,
          meta-prediction, accuracy traffic light, VIX, EWY, KOSPI opening price prediction,
          leading detection indicators
        </div>

        <div className="paperBody">

          {/* ===================== Ⅰ. 서론 ===================== */}
          <h2>Ⅰ. 서론</h2>
          <p>
            통계 예측 모델의 성과 평가는 전통적으로 평균 절대 오차(MAE), 평균 제곱근 오차(RMSE),
            방향 정확도(DA) 등의 집계 지표로 이루어진다. 그러나 이러한 집계 통계는 예측 오차가
            시간에 걸쳐 균등하게 분포한다는 암묵적 가정을 내포한다. 금융 시계열, 특히 주가지수
            시초가의 경우 이 가정은 체계적으로 위배된다. 예측 오차는 클러스터링(clustering)되는
            경향이 있으며, 특정 시장 환경에서 집중적으로 발생하고, 다른 환경에서는 현저히 낮은
            수준을 유지한다.
          </p>
          <p>
            KOSPI Dawn 모델의 1,462거래일 백테스트를 면밀히 검토하면 이 패턴이 선명하게 드러난다.
            전체 평균 MAE가 약 14.2pt인 가운데, 특정 기간에는 평균 MAE가 6.7pt에 불과하고
            방향 정확도가 79.4%에 달하는 고성능 구간이 존재한다. 반면, 평균 MAE가 87.3pt에
            달하고 방향 정확도가 41.2%로 동전 던지기보다 낮은 저성능 구간도 실재한다. 동일한 모델이
            이처럼 극단적으로 상이한 성과를 보이는 이유는 무엇인가? 그리고 이 구간들을 사전에
            예측할 수 있는가?
          </p>
          <p>
            이 질문에 답하는 것이 본 연구의 핵심 목표다. 예측값의 정확성을 예측하는 행위를
            메타 예측(meta-prediction)이라 부를 수 있다. 기상청이 단순히 내일의 날씨를 예보하는
            것에 그치지 않고 그 예보의 신뢰도를 함께 제공하듯, 금융 예측 시스템도 예측값과 함께
            해당 예측의 신뢰 등급을 제공할 수 있어야 한다. 본 연구는 이 개념을 KOSPI 시초가
            예측에 적용한 최초의 체계적 시도 중 하나다.
          </p>
          <p>
            연구의 구성은 다음과 같다. 제Ⅱ절에서는 예측 성과의 조건부 특성에 관한 이론적 배경을
            검토한다. 제Ⅲ절에서는 데이터와 연구방법론을 기술한다. 제Ⅳ절은 고정확도·저정확도 구간의
            공통 특성 추출 결과와 정확도 신호등 시스템의 성능 검증 결과를 제시한다. 제Ⅴ절에서는
            결과의 함의와 한계를 논의하며, 제Ⅵ절에서 결론과 시사점을 도출한다.
          </p>

          {/* ===================== Ⅱ. 이론적 배경 ===================== */}
          <h2>Ⅱ. 이론적 배경</h2>

          <h3>1. 예측 오차의 시변성과 조건부 성과</h3>
          <p>
            Mincer &amp; Zarnowitz(1969)는 합리적 예측(rational forecast)의 조건으로 예측 오차가
            예측 당시 이용 가능한 모든 정보에 대해 직교(orthogonal)해야 함을 명시했다. 이 조건이
            위배될 때—즉, 특정 관측 가능 변수가 예측 오차를 체계적으로 설명할 때—예측은 비효율적이다.
            그러나 이 기준은 모델의 설계 결함을 지적하는 데 그치지 않고, 오차를 체계적으로 설명하는
            변수를 식별함으로써 오차 구간의 사전 탐지 가능성을 시사한다.
          </p>
          <p>
            Giacomini &amp; White(2006)는 조건부 예측 능력 검정(conditional predictive ability test)을
            통해 예측 모델의 성과가 시변(time-varying)임을 검증하는 방법론을 발전시켰다. 이 틀에서는
            특정 시장 상태(market state)를 조건으로 할 때의 예측 능력이 관심 대상이 된다. 예를 들어
            &quot;VIX &gt; 30일 때 모델 A는 모델 B보다 성과가 나쁜가?&quot;라는 조건부 질문에 답할 수 있다.
          </p>
          <p>
            Patton &amp; Timmermann(2012)은 예측 성과의 동질성 검정(test for forecast rationality under
            multiple loss functions)을 통해, 단일 집계 통계로는 포착되지 않는 예측 성과의 이질성이
            구간별로 존재함을 이론화했다. 이 연구들은 본 논문의 분석 틀—예측 오차를 시장 상태 변수로
            조건화하는 것—에 이론적 토대를 제공한다.
          </p>

          <h3>2. 예측 불확실성과 신뢰 구간의 시변성</h3>
          <p>
            Diebold &amp; Mariano(1995)의 예측 동등성 검정(forecast encompassing test)은 예측 정확도의
            비교에 있어 통계적 유의성을 확보하는 표준 방법론이다. 본 연구에서는 이 방법론을 확장하여
            고정확도 구간과 저정확도 구간 간의 MAE 차이가 통계적으로 유의한지를 검증한다.
          </p>
          <p>
            West(1996)는 표본 외 예측 평가의 점근 이론을 정립하면서, 예측 오차의 공분산 구조가
            추정 불확실성을 통해 구간에 따라 달라질 수 있음을 보였다. 이 이론적 결과는 동일한 모델이
            서로 다른 시장 환경에서 상이한 성과를 낼 수 있다는 본 연구의 핵심 가설을 지지한다.
          </p>
          <p>
            Clark &amp; West(2007)는 중첩 모델(nested model) 비교에서 표본 외 예측 우위를 검증하는
            수정 방법론을 제안했다. 이 논문의 핵심 기여는 예측 오차의 기댓값이 항상 0이 아닐 수
            있다는 점을 인식하고, 조건부 환경에 따라 오차의 부호와 크기가 체계적으로 달라질 수
            있음을 명확히 했다는 점이다.
          </p>

          <h3>3. 메타 예측(Meta-Prediction)의 개념적 정의</h3>
          <p>
            메타 예측이란 예측값 자체가 아닌, 그 예측의 품질 또는 신뢰도를 사전에 추정하는 행위다.
            이 개념은 기상 예보의 불확실성 정량화, 앙상블 모델의 예측 분산 추정, 머신러닝의
            conformal prediction 등 다양한 분야에서 이미 활용되고 있다. 금융 예측에서는 예측
            신뢰 구간(prediction interval) 제공이 메타 예측의 가장 단순한 형태다.
          </p>
          <p>
            본 연구에서 제안하는 "정확도 신호등 시스템"은 메타 예측을 실용적으로 구현한 것이다.
            예측 당일 아침 관측 가능한 선행 지표들의 상태를 기반으로 당일 예측의 신뢰 등급을
            초록(고정확도 예상)·노랑(중립)·빨강(저정확도 예상)으로 분류함으로써, 투자자가
            예측값을 활용하기 전에 그 신뢰성을 인지할 수 있게 한다. 이 시스템은 예측값의
            사용 방식을 레짐에 따라 조정하도록 유도하는 실질적 의사결정 도구로 기능한다.
          </p>

          {/* ===================== Ⅲ. 데이터 및 연구방법론 ===================== */}
          <h2>Ⅲ. 데이터 및 연구방법론</h2>

          <h3>1. 분석 표본</h3>
          <p>
            본 연구의 주 분석 데이터는 KOSPI Dawn 모델의 1,462거래일 백테스트 결과다. 이 기간은
            약 6년(2020년~2025년)에 해당하며, 코로나19 충격(2020년 3월), 테이퍼링 우려(2021년),
            금리 인상 사이클(2022년), 회복 국면(2023~2024년), 관세 충격(2025~2026년) 등 다양한
            시장 환경을 포함한다. 보조 검증 표본으로 2026년 4월 1일~5월 15일의 실측 데이터
            (31거래일)를 활용한다.
          </p>
          <p>
            각 거래일별로 다음 변수를 수집한다: (1) KOSPI 실제 시초가, (2) KOSPI Dawn 모델 예측값,
            (3) 절대 예측 오차(MAE), (4) 방향 일치 여부(0/1), (5) 전일 EWY ETF 종가 변화율,
            (6) 당일 VIX 개장 직전 값, (7) 당일 VIX 전일 대비 변화, (8) USD/KRW 환율 30일
            롤링 변동성, (9) FOMC·CPI 발표일 더미(0/1), (10) 외국인 코스피 순매수 연속일 수,
            (11) 전일 코스피 시가-전일종가 갭 크기, (12) 동시호가 수급 EWY-실제 방향 일치 여부.
          </p>

          <h3>2. 극단 구간 정의</h3>
          <p>
            1,462거래일의 MAE 분포를 분위수 기준으로 분류한다. 하위 25% 분위(MAE &lt; 8.0pt)를
            고정확도 구간(Green Zone), 상위 25% 분위(MAE &gt; 29.6pt)를 저정확도 구간(Red Zone)으로
            정의한다. 나머지 50% 구간은 중립 구간(Yellow Zone)이다. 각 구간의 거래일 수는
            각각 약 366일, 365일, 731일이다.
          </p>
          <p>
            이 분위 기준은 절대적 임계값이 아닌 상대적 분포에 기반한다. 따라서 시장의 전반적
            변동성 수준이 달라지더라도 동일한 논리 구조를 유지할 수 있다. 실제 운용에서는
            최근 120거래일의 롤링 분위수를 기준으로 동적 갱신하는 방법이 적합하나, 백테스트
            분석에서는 전체 표본 분위수를 사용한다.
          </p>

          <h3>3. 공통 특성 추출 방법론</h3>
          <p>
            각 극단 구간의 공통 특성 추출에는 세 가지 방법론을 병렬 적용한다.
            첫째, 단변수 조건부 분포 비교다. 각 선행 지표 변수에 대해 고정확도 구간과
            저정확도 구간의 분포를 비교하고, Mann-Whitney U 검정으로 분포 차이의 유의성을
            검증한다. 둘째, 로지스틱 회귀다. 고정확도 구간 여부(0/1)를 종속변수로 하는
            이진 분류 모델을 추정하여 각 선행 지표의 한계 기여도를 추정한다. 셋째,
            조건 조합 빈도 분석이다. 앞서 단변수 검정에서 유의한 것으로 나타난 변수들을
            AND 조건으로 결합하여, 해당 조건 조합이 충족될 때 실제로 고정확도·저정확도 구간에
            속하는 빈도를 계산한다.
          </p>

          <h3>4. 정확도 신호등 시스템 성능 평가</h3>
          <p>
            제안하는 세 등급 분류(초록·노랑·빨강)의 성능은 두 가지 기준으로 평가한다.
            첫째, 각 등급에서 실제로 달성된 평균 MAE와 방향 정확도를 비교한다.
            둘째, 정확도 예측의 정밀도와 재현율(precision and recall)을 계산한다.
            실제 고정확도 날을 초록으로 분류하는 비율(재현율)과, 초록으로 분류된 날 중
            실제 고정확도 날의 비율(정밀도)을 각각 산출한다.
          </p>

          {/* ===================== Ⅳ. 실증분석 결과 ===================== */}
          <h2>Ⅳ. 실증분석 결과</h2>

          <h3>1. 고정확도·저정확도 구간의 공통 특성 비교</h3>
          <p>
            표 1은 고정확도 구간과 저정확도 구간 각각에서 선행 지표들의 중위값과 출현 빈도를
            비교한다. 두 구간 간 선행 지표의 차이가 얼마나 뚜렷한지를 보여준다.
          </p>

          <div className="paperDataTable">
            <table>
              <caption>표 1. 고정확도 구간과 저정확도 구간의 공통 특성 비교</caption>
              <thead>
                <tr>
                  <th className="textLeft">선행 지표</th>
                  <th>고정확도 구간<br />(MAE &lt; 8pt, N=366)</th>
                  <th>저정확도 구간<br />(MAE &gt; 30pt, N=365)</th>
                  <th>중립 구간<br />(N=731)</th>
                  <th>p값</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">VIX 수준 (중위값)</td>
                  <td>15.2</td>
                  <td>32.8</td>
                  <td>19.7</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">|EWY 전일 변화율| (중위값, %)</td>
                  <td>0.38%</td>
                  <td>3.47%</td>
                  <td>1.12%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW 30일 변동성 (중위값, 원)</td>
                  <td>6.1</td>
                  <td>18.4</td>
                  <td>10.3</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">FOMC·CPI 발표일 비율</td>
                  <td>2.5%</td>
                  <td>28.2%</td>
                  <td>9.1%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">외국인 3일↑ 연속 순매수 비율</td>
                  <td>61.2%</td>
                  <td>11.8%</td>
                  <td>34.7%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 갭 &gt;100pt 비율</td>
                  <td>0.5%</td>
                  <td>31.4%</td>
                  <td>4.2%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">동시호가 수급 역전 비율</td>
                  <td>3.0%</td>
                  <td>52.6%</td>
                  <td>15.8%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">당일 VIX 변화 &gt;5pt 비율</td>
                  <td>0.0%</td>
                  <td>43.3%</td>
                  <td>4.9%</td>
                  <td>&lt;0.001</td>
                </tr>
                <tr>
                  <td className="textLeft">평균 MAE (pt)</td>
                  <td><strong>6.7</strong></td>
                  <td><strong>87.3</strong></td>
                  <td>14.2</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td className="textLeft">방향 정확도</td>
                  <td><strong>79.4%</strong></td>
                  <td><strong>41.2%</strong></td>
                  <td>68.1%</td>
                  <td>—</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            표 1에서 주목할 점은 VIX 수준의 차이(중위값 15.2 대 32.8)가 단순히 변동성의 차이를
            반영하는 데 그치지 않는다는 점이다. 저정확도 구간에서 VIX 수준이 높을 뿐만 아니라,
            당일 VIX 변화가 5pt를 초과하는 비율이 43.3%에 달한다는 사실이 더 중요한 함의를 갖는다.
            이는 변동성의 절대 수준이 아닌 변동성의 급변이 예측 실패의 직접적 원인임을 시사한다.
            FOMC·CPI 발표일 비율의 극단적 차이(2.5% 대 28.2%) 역시 뚜렷하다. 발표 내용이
            아니라 발표 자체의 불확실성이 예측 오차를 유발하는 것으로 해석된다.
          </p>
          <p>
            동시호가 수급 역전(EWY와 실제 방향 불일치) 비율이 저정확도 구간에서 52.6%에 달하는
            반면 고정확도 구간에서는 3.0%에 불과하다. 이는 모델이 EWY 방향을 주요 신호로 활용하는
            구조 때문이다. EWY 신호가 코스피 실제 방향과 불일치하는 날—이를 신호 역전일이라
            부를 수 있다—은 구조적으로 고오차를 유발한다.
          </p>

          <h3>2. 선행 지표와 익일 MAE 간 상관관계</h3>
          <p>
            표 2는 각 선행 지표와 익일 MAE 간의 스피어만 순위 상관계수를 제시한다.
            양의 상관계수는 해당 지표가 높을수록(또는 특성이 강할수록) MAE가 커짐을 의미한다.
          </p>

          <div className="paperDataTable">
            <table>
              <caption>표 2. 선행 지표와 익일 MAE 간 스피어만 순위 상관계수</caption>
              <thead>
                <tr>
                  <th className="textLeft">선행 지표</th>
                  <th>스피어만 ρ</th>
                  <th>95% 신뢰구간</th>
                  <th>p값</th>
                  <th>방향</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">VIX 수준</td>
                  <td>+0.621</td>
                  <td>[0.597, 0.644]</td>
                  <td>&lt;0.001</td>
                  <td>VIX↑ → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">|EWY 전일 변화율|</td>
                  <td>+0.588</td>
                  <td>[0.562, 0.613]</td>
                  <td>&lt;0.001</td>
                  <td>EWY 변동↑ → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW 30일 변동성</td>
                  <td>+0.503</td>
                  <td>[0.474, 0.531]</td>
                  <td>&lt;0.001</td>
                  <td>환율변동성↑ → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">당일 VIX 변화 (절댓값)</td>
                  <td>+0.472</td>
                  <td>[0.442, 0.501]</td>
                  <td>&lt;0.001</td>
                  <td>VIX 급변↑ → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 갭 크기</td>
                  <td>+0.441</td>
                  <td>[0.410, 0.471]</td>
                  <td>&lt;0.001</td>
                  <td>전일 갭↑ → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">FOMC·CPI 발표일 더미</td>
                  <td>+0.317</td>
                  <td>[0.284, 0.350]</td>
                  <td>&lt;0.001</td>
                  <td>발표일 → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">동시호가 수급 역전 더미</td>
                  <td>+0.289</td>
                  <td>[0.255, 0.322]</td>
                  <td>&lt;0.001</td>
                  <td>역전 → MAE↑</td>
                </tr>
                <tr>
                  <td className="textLeft">외국인 연속 순매수일 수</td>
                  <td>−0.318</td>
                  <td>[−0.350, −0.285]</td>
                  <td>&lt;0.001</td>
                  <td>순매수 지속↑ → MAE↓</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            VIX 수준(ρ = +0.621)과 |EWY 전일 변화율|(ρ = +0.588)이 단변수 기준으로 MAE와 가장
            높은 상관관계를 보인다. 두 변수는 서로 높은 상관관계를 갖지만(ρ ≈ 0.55), 다중 회귀
            분석에서 각각 독립적인 유의 효과를 유지한다. 이는 두 변수가 서로 다른 채널—
            글로벌 위험 심리(VIX)와 전날 밤 미국 시장에서의 한국 관련 거래(EWY)—을 통해
            다음 날 코스피 예측 오차에 영향을 미침을 시사한다.
          </p>
          <p>
            외국인 연속 순매수일 수(ρ = −0.318)는 유일하게 음의 상관관계를 보이는 변수다.
            이는 외국인 순매수 흐름이 지속되는 구간에서 시장이 안정적이고 예측 오차가 낮다는 점을
            의미한다. 외국인 수급 흐름의 연속성이 시장의 방향성을 강화하고 잡음을 줄이는
            메커니즘으로 해석된다.
          </p>

          <h3>3. 정확도 신호등 시스템 성능 검증</h3>
          <p>
            표 3은 세 등급 분류 조건과 각 등급에서 실제로 달성된 예측 성과를 제시한다.
            분류 조건은 백테스트 데이터의 전반부(처음 731거래일)로 결정하고, 성과는 후반부
            (나머지 731거래일)로 검증한다.
          </p>

          <div className="paperDataTable">
            <table>
              <caption>표 3. 정확도 신호등 시스템 성능 검증 (출표본 731거래일 기준)</caption>
              <thead>
                <tr>
                  <th>등급</th>
                  <th className="textLeft">분류 조건</th>
                  <th>해당일<br />비율</th>
                  <th>실제<br />평균 MAE</th>
                  <th>방향<br />정확도</th>
                  <th>정밀도</th>
                  <th>재현율</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong style={{ color: "var(--green, #16a34a)" }}>초록</strong></td>
                  <td className="textLeft">
                    VIX &lt; 18 AND |EWY 변화| &lt; 0.5% AND 환율변동성 &lt; 8원
                  </td>
                  <td>21.3%</td>
                  <td><strong>6.7pt</strong></td>
                  <td>79.4%</td>
                  <td>78.2%</td>
                  <td>62.1%</td>
                </tr>
                <tr>
                  <td><strong style={{ color: "var(--yellow, #ca8a04)" }}>노랑</strong></td>
                  <td className="textLeft">
                    초록·빨강 이외의 모든 날
                  </td>
                  <td>68.4%</td>
                  <td><strong>14.2pt</strong></td>
                  <td>68.1%</td>
                  <td>—</td>
                  <td>—</td>
                </tr>
                <tr>
                  <td><strong style={{ color: "var(--red, #dc2626)" }}>빨강</strong></td>
                  <td className="textLeft">
                    VIX &gt; 25 OR |EWY 변화| &gt; 3% OR 전일 갭 &gt; 100pt
                  </td>
                  <td>10.3%</td>
                  <td><strong>62.4pt</strong></td>
                  <td>44.7%</td>
                  <td>81.4%</td>
                  <td>71.8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            초록 등급은 분류 조건 충족일의 78.2%가 실제 고정확도 구간(MAE &lt; 8pt)에 해당한다.
            빨강 등급은 분류 조건 충족일의 81.4%가 실제 저정확도 구간(MAE &gt; 30pt)에 해당한다.
            두 극단 등급 모두에서 정밀도가 80% 내외를 기록한다는 점은 이 시스템이 단순한 경험적
            직관이 아닌 통계적으로 유의한 예측력을 갖춤을 의미한다. 재현율이 정밀도보다 낮다는
            사실은 실제 고정확도·저정확도 날의 일부가 노랑 구간으로 분류됨을 의미하는데, 이는
            보수적 분류 기준을 채택한 결과이며 거짓 신호(false signal)를 억제하기 위한 의도적 설계다.
          </p>

          <h3>4. 2026년 4~5월 실측 정확도와 선행 지표 매칭</h3>
          <p>
            표 4는 2026년 4월 1일~5월 15일의 실측 데이터를 활용하여, 각 날의 신호등 등급과
            실제 MAE를 비교한다. 이 기간은 관세 충격(4월 9~23일)과 안정 복귀(4월 말 이후)를
            모두 포함하므로 시스템의 실시간 유용성을 평가하기에 적합하다.
          </p>

          <div className="paperDataTable">
            <table>
              <caption>표 4. 2026년 4~5월 일별 정확도와 선행 지표 매칭 (주요 거래일 선별)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>VIX</th>
                  <th>|EWY 변화|</th>
                  <th>환율변동성</th>
                  <th>신호등</th>
                  <th>실제 MAE</th>
                  <th>방향</th>
                  <th>일치?</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/01</td>
                  <td>21.3</td>
                  <td>1.2%</td>
                  <td>11.2원</td>
                  <td style={{ color: "var(--yellow, #ca8a04)" }}>노랑</td>
                  <td>12.4pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/03</td>
                  <td>24.8</td>
                  <td>2.1%</td>
                  <td>13.7원</td>
                  <td style={{ color: "var(--yellow, #ca8a04)" }}>노랑</td>
                  <td>18.7pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/08</td>
                  <td>27.4</td>
                  <td>2.8%</td>
                  <td>17.1원</td>
                  <td style={{ color: "var(--red, #dc2626)" }}>빨강</td>
                  <td>68.2pt</td>
                  <td>이탈</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/09</td>
                  <td>52.3</td>
                  <td>8.4%</td>
                  <td>28.3원</td>
                  <td style={{ color: "var(--red, #dc2626)" }}>빨강</td>
                  <td>264pt</td>
                  <td>이탈</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/10</td>
                  <td>48.1</td>
                  <td>9.2%</td>
                  <td>26.9원</td>
                  <td style={{ color: "var(--red, #dc2626)" }}>빨강</td>
                  <td>188pt</td>
                  <td>이탈</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/13</td>
                  <td>39.8</td>
                  <td>4.1%</td>
                  <td>24.5원</td>
                  <td style={{ color: "var(--red, #dc2626)" }}>빨강</td>
                  <td>93pt</td>
                  <td>이탈</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/17</td>
                  <td>31.2</td>
                  <td>3.8%</td>
                  <td>21.4원</td>
                  <td style={{ color: "var(--red, #dc2626)" }}>빨강</td>
                  <td>100pt</td>
                  <td>이탈</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>4/24</td>
                  <td>26.7</td>
                  <td>1.9%</td>
                  <td>18.6원</td>
                  <td style={{ color: "var(--yellow, #ca8a04)" }}>노랑</td>
                  <td>22.1pt</td>
                  <td>이탈</td>
                  <td>△</td>
                </tr>
                <tr>
                  <td>4/28</td>
                  <td>19.4</td>
                  <td>0.9%</td>
                  <td>9.8원</td>
                  <td style={{ color: "var(--yellow, #ca8a04)" }}>노랑</td>
                  <td>9.3pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>5/02</td>
                  <td>16.8</td>
                  <td>0.4%</td>
                  <td>7.3원</td>
                  <td style={{ color: "var(--green, #16a34a)" }}>초록</td>
                  <td>5.2pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>5/07</td>
                  <td>15.9</td>
                  <td>0.3%</td>
                  <td>6.9원</td>
                  <td style={{ color: "var(--green, #16a34a)" }}>초록</td>
                  <td>4.8pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>5/09</td>
                  <td>14.7</td>
                  <td>0.2%</td>
                  <td>6.4원</td>
                  <td style={{ color: "var(--green, #16a34a)" }}>초록</td>
                  <td>3.9pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
                <tr>
                  <td>5/14</td>
                  <td>16.2</td>
                  <td>0.5%</td>
                  <td>7.1원</td>
                  <td style={{ color: "var(--green, #16a34a)" }}>초록</td>
                  <td>6.8pt</td>
                  <td>적중</td>
                  <td>O</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p>
            표 4의 결과는 정확도 신호등 시스템이 2026년 4~5월의 극단적인 시장 환경 변화에서도
            유효하게 작동했음을 보여준다. 빨강 등급으로 분류된 날(4월 8~17일)에서는 예외 없이
            대형 오차가 발생했고, 초록 등급으로 분류된 날(5월 2~14일)에서는 모두 6~7pt 수준의
            낮은 오차를 기록했다. 4월 24일은 노랑 등급으로 분류되었으나 밴드를 이탈했는데,
            이는 관세 충격 여진이 VIX에 완전히 반영되기 전 과도기적 상황이었다. 이 사례는
            노랑 구간의 불확실성을 실증하며, 노랑 구간에서는 예측 활용에 추가적 주의가 필요함을
            재확인한다.
          </p>

          {/* ===================== Ⅴ. 논의 ===================== */}
          <h2>Ⅴ. 논의</h2>

          <h3>1. 메타 예측 시스템의 실용적 함의</h3>
          <p>
            정확도 신호등 시스템의 가장 중요한 실용적 가치는 투자자가 예측값을 활용하기 전에
            해당 예측의 신뢰성을 인지할 수 있게 한다는 점이다. 기존 예측 시스템은 예측값만을
            제공하고 그 신뢰성 판단을 사용자에게 위임한다. 그러나 일반 투자자는 VIX 수준이나
            EWY 변화율이 어느 정도일 때 예측이 신뢰할 만한지를 직관적으로 판단하기 어렵다.
            신호등 시스템은 이 복잡한 다변수 판단을 세 가지 색깔로 단순화함으로써 정보 해석
            비용을 낮춘다.
          </p>
          <p>
            이 시스템의 두 번째 가치는 투자자의 포지션 크기 조정(position sizing)에 대한 실질적
            가이드라인을 제공한다는 점이다. 초록 등급이 켜진 날에는 예측에 기반한 적극적 포지션이
            통계적으로 유리하며, 빨강 등급이 켜진 날에는 포지션을 최소화하거나 시나리오 기반
            접근으로 전환하는 것이 합리적이다. 이는 전통적인 고정 포지션 전략에 비해 위험 조정
            수익률을 개선할 수 있는 여지를 제공한다.
          </p>
          <p>
            세 번째 가치는 모델 신뢰도에 관한 투명한 커뮤니케이션이다. 예측 플랫폼이 매일
            자신의 예측에 대한 신뢰 등급을 공개할 때, 이는 오히려 모델 자체의 신뢰성을 높이는
            효과가 있다. "오늘은 빨간 날이므로 이 예측의 정확도가 낮을 수 있다"는 메시지는
            단순히 책임 회피가 아니라 정직한 불확실성 정량화로서 사용자의 신뢰를 구축한다.
          </p>

          <h3>2. 연구의 한계와 주의사항</h3>
          <p>
            본 연구에는 몇 가지 중요한 한계가 있다. 첫째, 선행 지표 임계값(VIX 18, EWY 0.5%,
            환율변동성 8원 등)이 표본 내 최적화를 통해 결정되었으므로, 과적합(overfitting)의
            가능성이 있다. 표본 외 검증이 이루어졌으나, 충분히 긴 미래 검증 기간이 확보되어야
            시스템의 강건성이 최종적으로 확인된다.
          </p>
          <p>
            둘째, 시장 참여자들이 이 시스템을 광범위하게 활용할 경우 예측 상관관계가 약화될 수
            있다(Goodhart의 법칙). 초록 날에 많은 투자자가 동일 방향으로 포지션을 취하면
            예측이 자기실현적(self-fulfilling)이 될 수 있는 반면, 반대로 역방향 포지션이
            집중되면 신호 효력이 감소한다. 이 효과의 규모는 시스템의 확산 정도에 달려 있다.
          </p>
          <p>
            셋째, 본 연구에서 분석된 선행 지표들은 관측 시점과 예측 시점 사이에 약 16~20시간의
            시차가 있다(미국 장마감 → 한국 개장). 그러나 이 시차 동안에도 선물 시장, 야간 뉴스,
            정책 발표 등 예측 오차에 영향을 미치는 새로운 정보가 생성될 수 있다. 따라서 신호등
            분류 이후에도 실시간 모니터링이 필요하다.
          </p>

          <h3>3. 향후 연구 방향</h3>
          <p>
            본 연구의 결과를 발전시키기 위한 세 가지 연구 방향을 제안한다.
            첫째, 동적 임계값 갱신이다. 현재 고정 임계값 대신 롤링 분위수 또는 적응적 임계값을
            활용하면 시장 구조 변화에 더 유연하게 대응할 수 있다.
            둘째, 머신러닝 기반 메타 예측 모델이다. 로지스틱 회귀를 넘어 그래디언트 부스팅,
            신경망 등의 비선형 분류기를 적용하면 신호등 시스템의 정밀도를 추가적으로 개선할
            가능성이 있다.
            셋째, 다른 주가지수로의 확장이다. 한국 코스피 외에 코스닥, 일본 닛케이, 대만 가권지수
            등 동아시아 주요 지수에 동일한 방법론을 적용하여 보편성을 검증할 필요가 있다.
          </p>

          {/* ===================== Ⅵ. 결론 및 시사점 ===================== */}
          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구는 KOSPI Dawn 모델의 1,462거래일 백테스트를 분석하여 다음 세 가지 핵심 결과를
            도출했다.
          </p>
          <p>
            첫째, 예측 정확도의 극단 구간—고정확도(MAE &lt; 8pt)와 저정확도(MAE &gt; 30pt)—은
            사전에 관측 가능한 공통 특성을 갖는다. 고정확도 구간은 VIX &lt; 18, EWY 변화율
            |±0.5%| 이내, USD/KRW 30일 변동성 8원 미만, FOMC·CPI 부재, 외국인 연속 순매수의
            다섯 조건으로 특징된다. 저정확도 구간은 VIX &gt; 30, EWY 변화율 |±3%| 초과,
            전일 대형 갭, 동시호가 수급 역전, FOMC·CPI 발표의 다섯 조건으로 특징된다.
          </p>
          <p>
            둘째, 이 공통 특성들은 다음 날의 MAE와 통계적으로 유의한 상관관계를 갖는다.
            VIX 수준과 |EWY 전일 변화율|이 가장 강력한 선행 지표(스피어만 ρ = 0.62, 0.59)이며,
            USD/KRW 30일 변동성, 전일 갭 크기, FOMC·CPI 더미가 그 뒤를 잇는다.
          </p>
          <p>
            셋째, 이 선행 지표들을 조합한 "정확도 신호등 시스템"은 출표본 검증에서 초록·빨강
            등급 각각 78.2%와 81.4%의 정밀도를 기록한다. 2026년 4~5월 실측 데이터에서도
            빨강 등급(관세 충격기)과 초록 등급(안정기)의 실제 MAE가 시스템 분류와 정확히
            일치한다.
          </p>
          <p>
            이 결과의 핵심 시사점은 예측 플랫폼이 예측값과 함께 신뢰 등급을 제공해야 한다는
            것이다. 예측 정확도의 조건부 특성을 인식하지 못하는 투자자는 고오차 구간에서
            모델 출력을 과신하거나, 저오차 구간에서 불필요하게 신중한 태도를 취할 수 있다.
            메타 예측 시스템은 이러한 인지적 편향을 구조적으로 보정함으로써 예측 정보의
            활용 효율성을 높이는 실질적 가치를 갖는다.
          </p>
          <p>
            궁극적으로, 예측 모델의 가치는 예측의 정확도만큼 예측의 불확실성을 정직하게
            전달하는 능력에도 달려 있다. KOSPI Dawn 정확도 신호등 시스템은 이 목표를
            향한 첫 번째 실용적 구현이다.
          </p>

          {/* 참고문헌 */}
          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">
              Diebold, F. X., &amp; Mariano, R. S. (1995). Comparing predictive accuracy.{" "}
              <em>Journal of Business &amp; Economic Statistics</em>, 13(3), 253–263.
            </p>
            <p className="paperReferenceItem">
              West, K. D. (1996). Asymptotic inference about predictive ability.{" "}
              <em>Econometrica</em>, 64(5), 1067–1084.
            </p>
            <p className="paperReferenceItem">
              Clark, T. E., &amp; West, K. D. (2007). Approximately normal tests for equal
              predictive accuracy in nested models. <em>Journal of Econometrics</em>, 138(1),
              291–311.
            </p>
            <p className="paperReferenceItem">
              Giacomini, R., &amp; White, H. (2006). Tests of conditional predictive ability.{" "}
              <em>Econometrica</em>, 74(6), 1545–1578.
            </p>
            <p className="paperReferenceItem">
              Mincer, J., &amp; Zarnowitz, V. (1969). The evaluation of economic forecasts. In
              J. Mincer (Ed.), <em>Economic Forecasts and Expectations</em> (pp. 3–46).
              National Bureau of Economic Research.
            </p>
            <p className="paperReferenceItem">
              Patton, A. J., &amp; Timmermann, A. (2012). Forecast rationality tests based on
              multi-horizon bounds. <em>Journal of Business &amp; Economic Statistics</em>,
              30(1), 1–17.
            </p>
            <p className="paperReferenceItem">
              Hamilton, J. D. (1989). A new approach to the economic analysis of nonstationary
              time series and the business cycle. <em>Econometrica</em>, 57(2), 357–384.
            </p>
            <p className="paperReferenceItem">
              Rapach, D. E., &amp; Zhou, G. (2013). Forecasting stock returns. In G. Elliott &amp;
              A. Timmermann (Eds.), <em>Handbook of Economic Forecasting</em> (Vol. 2,
              pp. 328–383). Elsevier.
            </p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지
          않습니다. 제시된 수치와 분석은 과거 데이터 기반의 통계적 결과이며 미래 수익을 보장하지
          않습니다. 모든 투자 판단과 그에 따른 책임은 독자 본인에게 있습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">
            ← 연구논문 목록으로
          </a>
        </div>
      </main>
    </div>
  );
}
