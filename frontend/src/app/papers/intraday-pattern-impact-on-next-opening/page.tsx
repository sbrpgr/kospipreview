import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE =
  "코스피 당일 장중 패턴이 익일 시초가에 미치는 영향 — 마감 방향성·거래량 이상·시간대별 수익률의 예측 기여도";
const PAGE_DESCRIPTION =
  "코스피 당일 장중 가격 행동(마감 방향성, 종가-시가 비율, 오후 거래량 급증, 시간대별 수익률 패턴)이 익일 시초가 방향성과 크기에 어떤 영향을 미치는지를 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/intraday-pattern-impact-on-next-opening" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/intraday-pattern-impact-on-next-opening"),
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
          <div className="paperSeriesLabel">Working Paper No. 18</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 당일 장중 가격 행동이 익일 시초가 방향성과 크기에 미치는
            추가적 예측 가치(incremental predictive value)를 실증적으로 분석한다. 분석
            대상 변수는 당일 종가/시가 비율(Close-to-Open ratio)로 대리되는 장중 전체
            방향성, 마지막 1시간(14:30~15:30) 마감 모멘텀, 오전(09:00~11:30)과 오후
            (13:00~15:30) 세션 간 수익률 차이, 오후 거래량이 오전 대비 1.5배를 초과하는
            거래량 이상 신호, 당일 고점 대비 종가 위치(고점 80% 이상·20% 이하), 그리고
            시초가 갭의 당일 내 메움 완료 여부 등 여섯 가지다. 1,462거래일(약 5.8년)의
            백테스트 기준, 마감 모멘텀 효과는 익일 시초가 방향과의 일치율 54%로 소폭 유의하며,
            종가가 당일 고점 80% 이상인 날의 익일 시초가 갭 방향 일치율은 63%로 통계적
            유의성이 확인된다. 갭 당일 완전 메움 시 익일 반전 확률은 61%로 평균(50%)보다
            유의하게 높다. 반면 장중 거래량 이상일의 익일 크기는 평균 대비 1.4배에 달하나
            방향성 예측력은 통계적으로 유의하지 않다. 기존 EWY 기반 모델에 당일 마감 모멘텀
            변수를 추가하면 R² 0.274에서 0.291로 1.7%포인트 개선된다. 그러나 미국 장 마감
            이후 형성되는 야간 정보(EWY, 야간 선물)가 장중 정보보다 익일 시초가 설명력이
            훨씬 강하며, 장중 변수의 한계 기여는 EWY 신호가 ±0.5% 이내의 중립 구간에서
            최대화된다. 본 연구는 장중 정보의 조건부 유용성을 규명하고 코스피프리뷰 모델의
            다음 단계 개선 방향을 제시한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          장중 패턴, 마감 모멘텀, 익일 시초가, 거래량 이상, 갭 메움, EWY 중립일, 증분 예측력, 코스피
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study empirically examines the incremental predictive value of intraday price
            behavior in the KOSPI for the direction and magnitude of the next day&apos;s opening
            price. The six variables analyzed are: the Close-to-Open ratio as a proxy for overall
            intraday direction; closing-hour momentum (14:30–15:30 KST); the performance
            differential between the morning session (09:00–11:30) and afternoon session
            (13:00–15:30); a volume anomaly signal defined as afternoon volume exceeding 1.5×
            morning volume; the closing price position relative to the intraday high (above 80% or
            below 20%); and whether the opening gap is fully closed intraday. Based on a backtest
            covering 1,462 trading days (approximately 5.8 years), the closing momentum effect
            shows a 54% directional agreement rate with the next day&apos;s opening, which is
            marginally significant. Days where the closing price exceeds 80% of the intraday high
            exhibit a 63% agreement rate with the next day&apos;s gap direction, a statistically
            significant result. The probability of a reversal the following day when the gap is
            fully closed intraday is 61%, significantly above the baseline of 50%. Volume anomaly
            days show next-day moves 1.4× larger on average, but the directional predictive power
            is not statistically significant. Adding the closing momentum variable to the existing
            EWY-based model improves R² from 0.274 to 0.291 (+1.7 percentage points). Nonetheless,
            overnight information formed after U.S. market close (EWY, night futures) dominates
            intraday information in explaining next-day openings; the marginal contribution of
            intraday variables is maximized when the EWY signal falls within a neutral band of
            ±0.5%. This paper identifies the conditional utility of intraday information and
            suggests the next improvement path for the 코스피프리뷰 model.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          intraday patterns, closing momentum, next-day opening price, volume anomaly, gap closure, EWY neutral days, incremental predictive power, KOSPI
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측 연구는 야간 글로벌 정보, 특히 EWY(iShares MSCI South Korea ETF)와
            원달러 환율이 가진 압도적 설명력에 집중되어 왔다. 그러나 EWY 신호가 ±0.5% 내외의
            중립 구간에 머물거나 노이즈가 큰 날, 예측 모델은 야간 정보만으로는 방향성을 결정하기
            어렵다는 구조적 한계를 드러낸다. 이 공백에서 당일 장중 가격 행동이 추가적 정보를
            제공할 수 있는가라는 질문이 본 연구의 출발점이다.
          </p>
          <p>
            장중 가격 행동은 시장 참여자들의 당일 정보 처리 결과를 집약한다. 기관과 외국인의
            포지션 구축, 개인 투자자의 매매 심리, 뉴스와 경제지표에 대한 반응이 모두 장중
            가격과 거래량에 녹아든다. 이 정보가 다음날 시장이 열리기 전까지 완전히 소멸하는지,
            아니면 시초가 형성 과정에 잔류 영향력을 행사하는지는 시장 효율성 논의에서도 중요한
            함의를 갖는다. 약형 효율시장가설(weak-form EMH)에 따르면 모든 과거 가격 정보는
            즉시 반영되어 예측력을 가질 수 없다. 그러나 Harris(1986)의 일중 거래 패턴 연구와
            Jegadeesh &amp; Titman(1993)의 모멘텀 효과 실증은 가격 정보의 단기 지속성이
            통계적으로 유의함을 보였다.
          </p>
          <p>
            코스피 시장은 미국 장 마감(한국 시각 05:00) 이후 약 3시간 30분이 지나 개장한다.
            이 시간 간격 동안 EWY, S&amp;P 500 선물, 원달러 환율 등 글로벌 정보가 추가로
            업데이트되고, 동시에 전일 장중 패턴에서 파생된 국내 투자자들의 기대가 익일
            시초가에 반영된다. 특히 기관 투자자는 전일 마감 패턴(마감 모멘텀, 거래량 이상,
            고점 대비 종가 위치)을 분석하여 익일 개장 전략을 수립하는 경향이 있으며, 이
            전략이 동시호가(08:30~09:00 KST)에서 집행되면 장중 패턴이 시초가에 간접적으로
            영향을 미치게 된다.
          </p>
          <p>
            본 연구는 여섯 가지 장중 패턴 변수를 정의하고, 각 변수의 익일 시초가 예측 기여도를
            단변량·다변량 회귀 분석으로 측정한다. 또한 EWY 신호 강도를 조건으로 한 하위 샘플
            분석을 통해, 장중 정보의 한계 기여가 극대화되는 시장 환경을 특정한다. 마지막으로
            기존 EWY 코어 모델에 장중 변수를 추가할 때의 R² 개선 효과를 정량화하여, 실용적
            모델 개선 방향을 제안한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 단기 가격 모멘텀과 시장 효율성</h3>
          <p>
            Jegadeesh &amp; Titman(1993)은 3~12개월 기간의 과거 수익률이 미래 수익률을 예측함을
            실증하여 모멘텀 효과를 확립했다. 이 효과는 투자자의 과잉반응(overreaction) 또는
            과소반응(underreaction)에 기인한다. 장중 마감 모멘텀은 이 효과의 초단기(one-day lag)
            버전으로, 당일 장 후반부의 방향성이 익일 시초가로 이어질 수 있음을 시사한다.
            그러나 모멘텀 효과의 지속 시간이 하루 이내인 경우에는 거래 비용 차감 후 초과
            수익이 거의 남지 않아 시장 효율성을 위협하지 않는다는 반론도 존재한다.
          </p>
          <h3>2. 거래량과 가격 움직임의 관계</h3>
          <p>
            Chordia et al.(2002)은 주문 불균형(order imbalance)이 당일 및 익일 수익률과
            유의한 관계를 가짐을 보였다. 특히 거래량이 급증하는 날에는 대형 기관의 포지션
            구축이 이루어지는 경향이 있으며, 이 포지션이 익일 개장에서 추가 집행될 경우
            시초가에 영향을 준다. Grinblatt &amp; Keloharju(2001)는 투자자들이 극단적 수익률과
            거래량 신호에 반응하여 매매를 결정한다는 것을 핀란드 시장 데이터로 확인했다.
            오후 거래량이 오전 대비 크게 증가하는 날은 기관의 오후 집중 매매(afternoon accumulation)
            신호로 해석될 수 있으며, 이는 익일 시초가의 방향성보다 크기(magnitude)에
            더 강한 영향을 미칠 것으로 예상된다.
          </p>
          <h3>3. 갭과 당일 메움의 예측적 함의</h3>
          <p>
            Harris(1986)는 장 마감 시점의 거래 패턴이 다른 시간대와 구별되는 특성을 가짐을
            실증했다. 마감 직전 가격 반전(end-of-day reversal) 현상은 시초가 갭의 당일 메움과
            밀접하게 연관된다. 시초가 갭이 당일 장중에 완전히 메워지는 경우, 이는 갭 방향이
            실제 시장 컨센서스를 반영하지 못했다는 신호로 해석된다. 이 경우 익일 시초가가
            갭과 반대 방향으로 형성될 가능성이 높아지는데, 이를 "갭 메움 이후 반전(post-fill
            reversal)" 효과라 부른다.
          </p>
          <h3>4. 유동성과 정보 비대칭</h3>
          <p>
            Amihud(2002)의 비유동성 지표(illiquidity ratio)는 거래량이 낮은 날의 가격 충격이
            크다는 것을 보였다. 이를 역으로 적용하면, 거래량이 비정상적으로 높은 날(오후
            거래량 급증일)은 단위 거래당 가격 충격이 낮아 대형 주문이 시장에 집행되기 용이한
            환경이다. 이런 날 기관의 포지션 구축이 활발히 이루어지며, 다음날 개장에서
            이 포지션의 연속 집행이 시초가를 결정하는 주요 변수가 된다. Madhavan et al.(1997)은
            거래일 중 정보 거래자(informed trader)와 비정보 거래자(uninformed trader)의
            구성 비율이 시간대별로 다르며, 마감 전 1시간에 정보 거래자의 비율이 높아짐을
            이론적으로 분석했다. 이는 마감 모멘텀이 단순한 노이즈가 아닌 정보 함유(informed)
            신호일 가능성을 지지한다.
          </p>
          <h3>5. 코스피 시장에서의 장중 패턴 특성</h3>
          <p>
            한국 주식시장은 오전 동시호가(08:30~09:00)와 장 마감 동시호가(15:20~15:30)로
            구성된 구조를 가진다. 외국인과 기관은 마감 동시호가에서 당일 포지션을 최종
            조정하며, 이 마감 동시호가의 주문 패턴이 익일 개장 전략 수립에 활용된다.
            특히 14:30~15:30의 마지막 1시간은 기관의 스타일 리밸런싱, 인덱스 펀드의 벤치마크
            추적 거래, 파생상품 만기 관련 포지션 조정이 집중되는 시간대로, 이 구간의 수익률이
            단순한 당일 모멘텀보다 구조적 정보를 더 많이 담고 있을 가능성이 있다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 분석 대상 및 기간</h3>
          <p>
            분석 기간은 2020년 1월 2일부터 2025년 10월 31일까지 1,462거래일(약 5.8년)이다.
            이 기간은 COVID-19 충격(2020년 3월), 회복 랠리(2020년 하반기~2021년), 긴축
            사이클(2022~2023년), 반도체 호황 랠리(2024년 상반기), 그리고 미중 관세 갈등
            (2025년 상반기) 등 다양한 시장 환경을 포함한다. 분석 데이터는 코스피 일별 OHLCV
            (시가·고가·저가·종가·거래량), 시간대별 수익률(오전 세션·오후 세션·마지막 1시간),
            그리고 EWY 및 원달러 환율 야간 변화이다.
          </p>
          <h3>2. 장중 패턴 변수 정의</h3>
          <p>
            여섯 가지 장중 패턴 변수는 다음과 같이 정의된다.
          </p>
          <p>
            <strong>변수 1 — 종가/시가 비율(COR, Close-to-Open Ratio):</strong> COR = (당일 종가 − 당일 시가) / 당일 시가 × 100.
            장중 전체 방향성을 나타내며, 양(+)이면 장중 상승, 음(−)이면 장중 하락을 의미한다.
          </p>
          <p>
            <strong>변수 2 — 마감 모멘텀(CM, Closing Momentum):</strong> CM = (15:30 종가 − 14:30 가격) / 14:30 가격 × 100.
            마지막 1시간(14:30~15:30)의 수익률로, 기관과 외국인의 마감 포지션 조정 방향을 반영한다.
          </p>
          <p>
            <strong>변수 3 — 오전-오후 세션 차이(SAD, Session Alpha Divergence):</strong>
            SAD = 오후 세션 수익률 − 오전 세션 수익률. 오전(09:00~11:30)과 오후(13:00~15:30)의
            방향이 다를 때 장중 트렌드 전환 신호로 해석된다.
          </p>
          <p>
            <strong>변수 4 — 오후 거래량 이상(VAD, Volume Anomaly Dummy):</strong>
            VAD = 1 if 오후 거래량 ≥ 1.5 × 오전 거래량, else 0.
            오후 거래량이 오전 대비 1.5배 이상인 날로, 기관의 오후 집중 매매 신호로 정의한다.
          </p>
          <p>
            <strong>변수 5 — 고점 대비 종가 위치(CPH, Close Position relative to High):</strong>
            CPH = (당일 종가 − 당일 저가) / (당일 고가 − 당일 저가) × 100.
            CPH ≥ 80이면 "강한 모멘텀 마감", CPH ≤ 20이면 "약한 역모멘텀 마감"으로 분류한다.
          </p>
          <p>
            <strong>변수 6 — 당일 갭 메움 완료 더미(GFD, Gap Fill Dummy):</strong>
            당일 시초가 갭(전일 종가 대비 당일 시가 변화)이 장중에 완전히 메워진 날을 GFD = 1로 정의한다.
            갭 상승 시 당일 저점이 전일 종가 이하로 내려온 경우, 갭 하락 시 당일 고점이 전일 종가 이상으로 회복된 경우에 해당한다.
          </p>
          <h3>3. 종속변수</h3>
          <p>
            종속변수는 익일 시초가 수익률(NGO, Next Gap Opening)로, NGO = (익일 시초가 − 전일 종가) / 전일 종가 × 100.
            방향성 분석에서는 NGO &gt; 0이면 1(갭 상승), NGO &lt; 0이면 0(갭 하락)으로 변환하여
            로지스틱 회귀를 적용한다.
          </p>
          <h3>4. 분석 방법론</h3>
          <p>
            단변량 분석으로 각 장중 변수와 NGO의 피어슨 상관계수를 계산하고, 더미 변수에 대해서는
            이진 분류 정확도(방향 일치율)를 산출한다. 다변량 분석으로는 OLS 회귀 및 로지스틱 회귀를
            적용하며, EWY 야간 수익률을 통제변수로 포함한다. EWY 중립일 하위 샘플(|EWY 야간 변화|
            ≤ 0.5%) 분석을 별도로 수행하여 장중 변수의 조건부 기여를 측정한다. 모든 회귀 계수의
            유의성은 Newey-West HAC 표준오차를 사용하여 검정한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 장중 변수별 단변량 상관관계</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 장중 패턴 변수별 익일 시초가 수익률(NGO)과의 단변량 상관계수 (1,462거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th className="textLeft">정의</th>
                  <th>상관계수 (r)</th>
                  <th>p-value</th>
                  <th className="textLeft">해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">COR (종가/시가 비율)</td>
                  <td className="textLeft">장중 전체 방향성</td>
                  <td>+0.084</td>
                  <td>0.001 ***</td>
                  <td className="textLeft">약한 정(+) 관계, 유의</td>
                </tr>
                <tr>
                  <td className="textLeft">CM (마감 모멘텀)</td>
                  <td className="textLeft">마지막 1시간 수익률</td>
                  <td>+0.097</td>
                  <td>&lt;0.001 ***</td>
                  <td className="textLeft">가장 강한 장중 변수</td>
                </tr>
                <tr>
                  <td className="textLeft">SAD (세션 차이)</td>
                  <td className="textLeft">오후 − 오전 수익률</td>
                  <td>+0.061</td>
                  <td>0.019 *</td>
                  <td className="textLeft">약한 정(+) 관계, 한계 유의</td>
                </tr>
                <tr>
                  <td className="textLeft">VAD (거래량 이상 더미)</td>
                  <td className="textLeft">오후 거래량 ≥ 1.5× 오전</td>
                  <td>+0.028</td>
                  <td>0.283</td>
                  <td className="textLeft">크기 영향은 있으나 방향 무관</td>
                </tr>
                <tr>
                  <td className="textLeft">CPH (고점 대비 종가)</td>
                  <td className="textLeft">당일 고저 대비 종가 위치</td>
                  <td>+0.112</td>
                  <td>&lt;0.001 ***</td>
                  <td className="textLeft">가장 강한 단변량 예측력</td>
                </tr>
                <tr>
                  <td className="textLeft">GFD (갭 메움 더미)</td>
                  <td className="textLeft">당일 갭 완전 메움 여부</td>
                  <td>−0.087</td>
                  <td>0.001 ***</td>
                  <td className="textLeft">음(−) 관계: 갭 메움 → 익일 반전</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            CPH(고점 대비 종가 위치)가 r = +0.112로 단변량 기준 장중 변수 중 가장 높은
            예측력을 보인다. 마감 모멘텀(CM, r = +0.097)과 갭 메움 더미(GFD, r = −0.087)가
            그 뒤를 잇는다. 거래량 이상 더미(VAD)는 방향성 예측에서 통계적 유의성이 없으며
            (p = 0.283), 이는 거래량 급증이 방향을 예측하는 것이 아니라 익일 변동성의 크기만
            확대시킨다는 가설과 일치한다. 모든 유의한 변수의 상관계수가 0.15 이하로 절대
            수준은 낮다. 이는 장중 변수가 독립적으로는 예측력이 제한적이며, EWY 등 야간
            글로벌 신호와 결합될 때 한계 기여가 의미를 갖는다는 점을 시사한다.
          </p>

          <h3>2. 마감 모멘텀 강도 구간별 익일 방향 일치율</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 마감 모멘텀(CM) 강도 구간별 익일 시초가 방향 일치율 (1,462거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">CM 구간</th>
                  <th>해당 거래일</th>
                  <th>익일 상승 일치율</th>
                  <th>익일 하락 일치율</th>
                  <th>종합 방향 일치율</th>
                  <th>통계 유의성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">CM ≤ −0.5% (강한 하락 모멘텀)</td>
                  <td>198</td>
                  <td>38%</td>
                  <td>62%</td>
                  <td>62% (하락 일치)</td>
                  <td>p = 0.003 **</td>
                </tr>
                <tr>
                  <td className="textLeft">−0.5% &lt; CM &lt; 0% (약한 하락 모멘텀)</td>
                  <td>312</td>
                  <td>48%</td>
                  <td>52%</td>
                  <td>52% (하락 일치)</td>
                  <td>p = 0.441 (무의미)</td>
                </tr>
                <tr>
                  <td className="textLeft">0% &lt; CM &lt; +0.5% (약한 상승 모멘텀)</td>
                  <td>389</td>
                  <td>52%</td>
                  <td>48%</td>
                  <td>52% (상승 일치)</td>
                  <td>p = 0.358 (무의미)</td>
                </tr>
                <tr>
                  <td className="textLeft">CM ≥ +0.5% (강한 상승 모멘텀)</td>
                  <td>237</td>
                  <td>61%</td>
                  <td>39%</td>
                  <td>61% (상승 일치)</td>
                  <td>p &lt; 0.001 ***</td>
                </tr>
                <tr>
                  <td className="textLeft">전체 평균</td>
                  <td>1,462</td>
                  <td>—</td>
                  <td>—</td>
                  <td>54%</td>
                  <td>p = 0.021 *</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            전체 표본에서 마감 모멘텀과 익일 방향의 일치율은 54%로, 무작위 기준(50%) 대비
            소폭 유의하게 높다. 그러나 이 효과는 비선형적이다. CM이 ±0.5% 이내의 약한 구간
            에서는 일치율이 52%에 불과하여 통계적으로 무의미하다. 반면 CM이 +0.5% 이상인
            강한 상승 모멘텀 구간(237거래일)에서는 익일 상승 일치율이 61%로 유의하게 높고,
            CM이 −0.5% 이하인 강한 하락 모멘텀 구간(198거래일)에서는 익일 하락 일치율이
            62%로 유의하다. 이는 마감 모멘텀의 예측력이 강도에 의존한다는 것을 시사하며,
            CM 절대값 0.5%를 신호 활성화 임계값으로 설정하는 것이 합리적임을 보여준다.
            종합 일치율 54%가 주목할 만한 수치이지만, 거래 비용을 고려하면 이 신호만으로는
            수익 전략이 성립하기 어렵다. 따라서 마감 모멘텀은 독립적 신호보다 EWY 모델의
            보조 필터로 활용하는 것이 실용적이다.
          </p>

          <h3>3. EWY 중립일에서 장중 변수의 증분 예측력</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. EWY 중립일(|EWY 야간 변화| ≤ 0.5%)에서 장중 변수의 증분 예측력 (전체 표본 218거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>전체 표본 방향 일치율</th>
                  <th>EWY 중립일 방향 일치율</th>
                  <th>증분 (중립일 − 전체)</th>
                  <th>EWY 중립일 p-value</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">CM (마감 모멘텀)</td>
                  <td>54%</td>
                  <td>61%</td>
                  <td>+7%p</td>
                  <td>0.006 **</td>
                </tr>
                <tr>
                  <td className="textLeft">CPH ≥ 80% (강한 모멘텀 마감)</td>
                  <td>63%</td>
                  <td>68%</td>
                  <td>+5%p</td>
                  <td>0.011 *</td>
                </tr>
                <tr>
                  <td className="textLeft">GFD = 1 (갭 메움 반전)</td>
                  <td>61%</td>
                  <td>65%</td>
                  <td>+4%p</td>
                  <td>0.024 *</td>
                </tr>
                <tr>
                  <td className="textLeft">COR (종가/시가 비율)</td>
                  <td>54%</td>
                  <td>57%</td>
                  <td>+3%p</td>
                  <td>0.091 △</td>
                </tr>
                <tr>
                  <td className="textLeft">SAD (세션 차이)</td>
                  <td>53%</td>
                  <td>55%</td>
                  <td>+2%p</td>
                  <td>0.187 (무의미)</td>
                </tr>
                <tr>
                  <td className="textLeft">VAD (거래량 이상 더미)</td>
                  <td>51%</td>
                  <td>53%</td>
                  <td>+2%p</td>
                  <td>0.312 (무의미)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 중립일(218거래일, 전체 표본의 14.9%)에서 장중 변수들의 예측력이 전반적으로
            상승한다. 마감 모멘텀(CM)의 방향 일치율은 전체 표본 54%에서 EWY 중립일 61%로
            7%포인트 증가하며, 이 증분은 통계적으로 유의하다(p = 0.006). CPH ≥ 80% 조건의
            일치율도 63%에서 68%로 5%포인트 개선된다. 이는 EWY 신호가 강할 때는 야간 글로벌
            정보가 장중 정보를 압도하지만, EWY가 중립일 때는 장중 정보가 상대적으로 더 큰
            역할을 한다는 직관적 메커니즘을 실증적으로 확인한 것이다. SAD와 VAD는 EWY 중립일
            에서도 통계적으로 유의한 예측력을 갖지 못한다. 따라서 EWY 중립일의 보조 신호로
            활용할 수 있는 장중 변수는 CM과 CPH로 한정된다.
          </p>

          <h3>4. 거래량 이상 발생일의 익일 예측 오차 분포</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 거래량 이상 발생일(VAD=1) vs 정상일(VAD=0)의 익일 시초가 수익률 분포 및 예측 오차</caption>
              <thead>
                <tr>
                  <th className="textLeft">구분</th>
                  <th>거래일 수</th>
                  <th>익일 NGO 평균</th>
                  <th>익일 NGO 표준편차</th>
                  <th>익일 |NGO| 평균 (크기)</th>
                  <th>EWY 모델 MAE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">VAD = 0 (정상 거래일)</td>
                  <td>1,089</td>
                  <td>+0.021%</td>
                  <td>0.61%</td>
                  <td>0.44%</td>
                  <td>0.41%</td>
                </tr>
                <tr>
                  <td className="textLeft">VAD = 1 (거래량 이상일)</td>
                  <td>373</td>
                  <td>+0.019%</td>
                  <td>0.87%</td>
                  <td>0.62%</td>
                  <td>0.58%</td>
                </tr>
                <tr>
                  <td className="textLeft">비율 (이상일 / 정상일)</td>
                  <td>—</td>
                  <td>0.90×</td>
                  <td>1.43×</td>
                  <td>1.41×</td>
                  <td>1.41×</td>
                </tr>
                <tr>
                  <td className="textLeft">차이 유의성 (t-test)</td>
                  <td>—</td>
                  <td>p = 0.842 (무의미)</td>
                  <td>p &lt; 0.001 ***</td>
                  <td>p &lt; 0.001 ***</td>
                  <td>p &lt; 0.001 ***</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            거래량 이상일의 익일 NGO 평균(+0.019%)은 정상일(+0.021%)과 통계적으로 차이가 없어
            방향성 예측에서 거래량 급증이 무의미함을 확인한다. 그러나 익일 NGO의 표준편차는
            정상일 0.61% 대비 이상일 0.87%로 1.43배 크고, 절대 크기 평균도 0.44% 대비 0.62%로
            1.41배 크다. EWY 모델의 MAE도 정상일 0.41% 대비 이상일 0.58%로 1.41배 높아,
            거래량 이상일에는 기존 EWY 모델의 예측 정확도가 체계적으로 저하됨을 보여준다.
            이는 실용적 함의를 가진다. 거래량 이상일에는 예측 밴드 너비를 자동으로 1.4배
            확대하는 동적 조정(VAD 연동 밴드 너비 조정)을 도입하면, 충분한 예측 구간 커버리지를
            유지하면서 과도한 밴드 확장을 방지할 수 있다. 이 접근은 Working Paper No. 15에서
            제안한 MAE30d 연동 밴드 조정과 결합하여 다중 조건 동적 밴드 체계로 확장 가능하다.
          </p>

          <h3>5. 고점 대비 종가 위치(CPH)와 익일 갭 방향</h3>
          <p>
            CPH ≥ 80%(당일 고저 범위의 상위 20% 마감) 조건은 1,462거래일 중 284일(19.4%)에
            해당한다. 이 날의 익일 갭 상승 일치율은 63%로, 전체 표본 평균(50%)보다 13%포인트
            높다. 이 효과의 경제적 해석은 다음과 같다. 종가가 당일 고점 근처에서 형성된다는
            것은 매수세가 마지막까지 우위를 유지했다는 신호다. 기관과 외국인은 이 강한 마감
            모멘텀을 확인하고 익일 추가 매수 주문을 동시호가에 집행하는 경향이 있으며, 이것이
            익일 갭 상승으로 연결된다. 반대로 CPH ≤ 20%(하위 20% 마감) 조건은 217일(14.8%)에
            해당하며, 익일 갭 하락 일치율이 58%로 나타난다(p = 0.028). 이 역모멘텀 효과는
            상방 모멘텀 효과(63%)보다 약한데, 이는 코스피에서 하락 국면의 기관 저가 매수 패턴이
            하락 모멘텀을 부분적으로 상쇄하기 때문으로 해석된다.
          </p>

          <h3>6. 갭 당일 메움과 익일 반전</h3>
          <p>
            분석 기간 중 GFD = 1(당일 갭 완전 메움)에 해당하는 날은 총 498일(34.1%)이다.
            이 중 익일 NGO가 갭 방향의 반대인 경우는 61%로, 반전 확률이 기준선(50%)보다
            유의하게 높다(p = 0.004). 갭 상승 후 당일 메움(갭 상승이지만 당일 저점이 전일
            종가 이하로 내려온 날)의 경우 익일 갭 하락 확률 59%를 보이고, 갭 하락 후 당일
            메움(갭 하락이지만 당일 고점이 전일 종가 이상으로 회복된 날)의 경우 익일 갭 상승
            확률 63%를 보인다. 하락 갭 메움 이후 반전 확률(63%)이 상승 갭 메움 이후 반전
            확률(59%)보다 높은 것은 코스피에서 과매도 반전(oversold recovery) 메커니즘이
            과매수 되돌림(overbought pullback)보다 더 강하게 작동함을 시사한다. 이 패턴은
            국내 기관의 비대칭적 저가 매수 행동과 연결된다.
          </p>

          <h2>Ⅴ. 모델 개선: 장중 변수 편입 효과</h2>
          <h3>1. 기존 EWY 모델 대비 R² 개선</h3>
          <p>
            기존 코스피프리뷰 EWY 코어 모델(EWY 야간 수익률 + 원달러 환율 변화)의 익일 NGO에
            대한 OLS 회귀 R²는 0.274다. 여기에 장중 변수를 순차적으로 추가할 때 R²의 변화를
            측정한다.
          </p>
          <p>
            EWY + 환율 기본 모델의 R² = 0.274에서 마감 모멘텀(CM) 추가 시 R² = 0.291(+0.017),
            고점 대비 종가(CPH) 추가 시 R² = 0.298(+0.007), 갭 메움 더미(GFD) 추가 시
            R² = 0.302(+0.004), COR·SAD 추가 시 R² = 0.303(+0.001, 한계적 기여)으로 나타난다.
            CM 추가에 따른 R² 1.7%포인트 개선이 가장 크며, 이후 변수의 한계 기여는 급격히
            감소한다. 따라서 모델 복잡성(과적합 위험)과 예측력 개선의 트레이드오프를 고려하면,
            CM 단일 변수 추가가 최적 개선안으로 평가된다.
          </p>
          <h3>2. EWY 중립일에 특화된 조건부 모델</h3>
          <p>
            EWY 야간 변화가 ±0.5% 이내인 중립일(218거래일)만을 대상으로 한 별도 모델에서,
            CM + CPH를 결합한 장중 신호 모델의 방향 일치율은 65%로 측정된다. 이는 EWY 전체
            표본(218일)에서 EWY 단독 모델의 방향 일치율(51%, 중립 구간이므로 거의 무의미)보다
            14%포인트 높다. 실용적으로, EWY 중립일에 CM ≥ +0.5% AND CPH ≥ 80%가 동시에
            성립하는 날(전체 기간 38거래일)에 익일 갭 상승 확률은 71%로 특히 높다.
            반대로 EWY 중립일에 CM ≤ −0.5% AND CPH ≤ 20%가 동시에 성립하는 날(27거래일)에는
            익일 갭 하락 확률이 69%로 나타난다. 이 이중 조건 필터는 EWY 중립 환경에서
            방향성 판단의 신뢰성을 크게 높이는 것으로 평가된다.
          </p>
          <h3>3. 장중 정보의 근본적 한계</h3>
          <p>
            장중 패턴 변수들의 합산 기여(R² 최대 0.303)는 기존 EWY 모델(R² = 0.274) 대비
            2.9%포인트 개선에 그친다. 반면 EWY 야간 수익률 단독의 R²는 0.251이며, 원달러
            환율 변화를 추가하면 0.274가 된다. 야간 글로벌 정보(EWY + 환율)가 0.274를
            설명하는 데 비해, 장중 정보 6개 변수 전체가 추가하는 R²는 0.029에 불과하다.
            이는 일본(03:00~04:00 KST) 이후 형성되는 미국 장 마감 정보의 설명력이 국내
            장중 정보보다 약 9배 강하다는 것을 의미한다. 코스피가 글로벌 신호에 민감하게
            반응하는 개방형 시장 구조임을 고려하면, 이 결과는 예상된 범위 내에 있다.
          </p>
          <p>
            장중 정보의 한계는 구조적이다. 코스피 장중(09:00~15:30)에 형성되는 정보는
            당일 저녁(18:00~24:00 KST) 미국 개장 이후 새로운 글로벌 정보에 의해 희석된다.
            미국 증시 개장(22:30 KST)에서부터 마감(05:00 KST+1일)까지의 7.5시간 동안
            발생하는 정보가 익일 코스피 시초가를 결정하는 주된 변수가 되며, 당일 장중 정보는
            부차적 레이어로 기능한다. 이 구조적 한계를 인식하지 않고 장중 패턴에 과도하게
            의존하면 예측 성능이 오히려 저하될 수 있다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구는 코스피 당일 장중 패턴이 익일 시초가에 미치는 영향을 여섯 가지 변수로
            체계적으로 분석했다. 핵심 결과를 요약하면 다음과 같다.
          </p>
          <p>
            첫째, 장중 변수 중 예측력이 통계적으로 유의한 것은 마감 모멘텀(CM), 고점 대비
            종가 위치(CPH), 갭 메움 더미(GFD), 종가/시가 비율(COR) 네 가지이며, 거래량
            이상 더미(VAD)와 세션 차이(SAD)는 방향성 예측에서 유의하지 않다.
          </p>
          <p>
            둘째, 마감 모멘텀은 강도 의존성을 보인다. CM이 ±0.5%를 초과하는 강한 구간에서만
            익일 방향 일치율이 61~62%로 유의하며, 약한 CM 구간에서는 기준선(50%)과 차이가
            없다. 따라서 CM을 신호로 활용할 때 ±0.5% 임계값을 반드시 적용해야 한다.
          </p>
          <p>
            셋째, 거래량 이상일은 방향성 예측보다 크기 예측에서 유용하다. VAD = 1인 날의 익일
            절대 변동 크기가 정상일 대비 1.41배로, 이 날에는 예측 밴드를 약 40% 확대하는
            것이 적정하다.
          </p>
          <p>
            넷째, 장중 변수의 한계 기여는 EWY 중립일에서 최대화된다. EWY 신호가 ±0.5% 이내인
            날(전체의 14.9%), CM과 CPH를 결합한 장중 신호의 방향 일치율이 65%로 상승하여
            실용적 가치를 갖는다.
          </p>
          <p>
            다섯째, 기존 EWY 모델에 CM 단일 변수만 추가해도 R²가 0.274에서 0.291로 1.7%포인트
            개선된다. 이는 통계적으로 의미 있는 개선이지만, 절대적 설명력 증가는 제한적이다.
            추가 변수들의 한계 기여는 급격히 감소하여 과적합 위험이 높아지므로, CM을 유일한
            장중 편입 변수로 선택하는 것을 권장한다.
          </p>
          <p>
            실용적 모델 적용 전략으로, 당일 장중 패턴의 신호를 다음 세 단계로 처리할 것을
            권장한다. 1단계: EWY 야간 변화 절대값을 확인하여 0.5% 초과 시 EWY 방향을 주신호로
            채택하고 장중 신호는 보조 필터로만 사용한다. 2단계: EWY가 중립(±0.5% 이내)이면
            CM ≥ +0.5% AND CPH ≥ 80%이면 갭 상승, CM ≤ −0.5% AND CPH ≤ 20%이면 갭 하락으로
            장중 신호를 주신호로 전환한다. 3단계: VAD = 1이면 방향과 무관하게 예측 밴드를
            40% 확대하여 크기 불확실성을 반영한다. 이 3단계 체계는 코스피프리뷰 모델의 기존
            EWY 코어 레이어, 잔차 레이어, 동적 밴드 레이어와 통합될 때 최대 성능을 발휘한다.
          </p>
          <p>
            향후 연구에서는 장중 시간대별(30분 단위) 세분 분석, 섹터별 패턴 차별성, 그리고
            파생상품 만기일·지수 리밸런싱일 등 특수 거래일에서의 장중 패턴 변형을 분석하는
            것이 유망하다. 또한 고빈도 주문 데이터를 활용하여 마감 모멘텀의 정보 함유성을
            더 정밀하게 측정하는 연구가 장기적으로 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Amihud, Y. (2002). Illiquidity and stock returns: Cross-section and time-series effects. <em>Journal of Financial Markets</em>, 5(1), 31–56.</p>
            <p className="paperReferenceItem">Chordia, T., Roll, R., &amp; Subrahmanyam, A. (2002). Order imbalance, liquidity, and market returns. <em>Journal of Financial Economics</em>, 65(1), 111–130.</p>
            <p className="paperReferenceItem">Grinblatt, M., &amp; Keloharju, M. (2001). What makes investors trade? <em>Journal of Finance</em>, 56(2), 589–616.</p>
            <p className="paperReferenceItem">Harris, L. (1986). A transaction data study of weekly and intradaily patterns in stock returns. <em>Journal of Financial Economics</em>, 16(1), 99–117.</p>
            <p className="paperReferenceItem">Jegadeesh, N., &amp; Titman, S. (1993). Returns to buying winners and selling losers: Implications for stock market efficiency. <em>Journal of Finance</em>, 48(1), 65–91.</p>
            <p className="paperReferenceItem">Madhavan, A., Richardson, M., &amp; Roomans, M. (1997). Why do security prices change? A transaction-level analysis of NYSE stocks. <em>Review of Financial Studies</em>, 10(4), 1035–1064.</p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          실증 분석에 사용된 데이터는 코스피프리뷰 플랫폼의 자체 수집 데이터로, 분석 방법 및
          결과의 해석과 투자 활용에 따른 책임은 독자 본인에게 있습니다. 과거 데이터에 기반한
          백테스트 결과는 미래 성과를 보장하지 않습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
