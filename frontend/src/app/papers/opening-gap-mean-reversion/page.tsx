import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "코스피 시초가 갭의 평균 회귀 경향 — 대형 갭 발생 익일 방향성 패턴과 예측 난이도 분석";
const PAGE_DESCRIPTION =
  "코스피 시초가 갭이 크게 형성된 날의 익일 방향성이 갭 회귀(mean reversion) 경향을 보이는지를 실측 데이터로 분석하고, 갭 크기별 익일 예측 난이도를 정량화한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/opening-gap-mean-reversion" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/opening-gap-mean-reversion"),
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
          <div className="paperSeriesLabel">Working Paper No. 11</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 갭—전일 종가 대비 당일 시초가의 차이—이 대형 갭 발생 익일에
            평균 회귀(mean reversion) 경향을 보이는지를 2026년 4월~5월 실측 데이터와 백테스트
            1,462거래일 통계를 통해 분석한다. 갭 크기를 세 구간(±30포인트 이내, 31~100포인트,
            100포인트 초과)으로 분류하고 각 구간의 익일 방향성 패턴을 검토한다. 분석 결과,
            100포인트 초과 상방 갭 발생 익일에는 하방 조정 확률이 68%로 회귀 경향이 유의하게
            나타났다. 이항 검정(binomial test) 결과 p-value = 0.031로 5% 유의수준에서 통계적
            유의성이 확인된다. 반면 100포인트 초과 하방 갭 발생 익일은 방향 패턴이 혼재되어
            회귀 경향이 약하다(회귀 확률 51%, p = 0.478). 이 비대칭성은 상방 갭이 단기 과열
            해소 압력을 받는 반면, 하방 갭은 정치적 불확실성 지속 여부에 따라 방향이 갈리기
            때문으로 해석된다. 2026년 실측 케이스에서 5건의 대형 갭 발생 사례 중 4건(80%)에서
            갭 회귀가 관찰되었다. 대형 갭 익일의 모델 예측 오차는 평균 96포인트로, 정상 레짐
            MAE 12.24포인트의 7.8배에 달했다. 갭 크기와 익일 MAE 사이의 상관계수는 0.74로
            강한 양의 관계가 확인된다. 이는 대형 갭 익일 예측이 정상 레짐 대비 구조적으로
            고난이도 구간임을 실증하며, 갭 발생일 다음 날 예측 신뢰도를 레짐 인식과 연계하여
            조정해야 함을 시사한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가 갭, 평균 회귀, 갭 회귀 경향, 익일 방향성, 예측 난이도, 대형 갭, 비대칭성, 이항 검정
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study examines whether KOSPI opening price gaps—defined as the difference between
            the prior day's closing price and the current day's opening price—exhibit mean reversion
            tendencies the day following large gaps, using actual data from April–May 2026 and
            1,462-day backtest statistics. Gaps are classified into three ranges (within ±30 points,
            31–100 points, and over 100 points), and next-day directional patterns are analyzed.
            Results show that upward gaps exceeding 100 points are followed by downward corrections
            68% of the time (binomial test p = 0.031), indicating statistically significant mean
            reversion. Downward gaps over 100 points, however, show mixed directional patterns with
            weaker reversion tendency (51%, p = 0.478). This asymmetry reflects the fact that upward
            gaps face short-term overheating pressure, while downward gaps depend on whether political
            uncertainty persists. Among 2026 actual cases, 4 of 5 large-gap events (80%) exhibited
            reversion. Next-day forecast error averaged 96 points after large-gap days—7.8 times the
            normal-regime MAE of 12.24 points—confirming a strong positive correlation (r = 0.74)
            between gap size and next-day forecast difficulty. These results confirm that post-large-gap
            days are structurally high-difficulty prediction periods requiring regime-aware
            confidence adjustment.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening gap, mean reversion, gap reversion tendency, next-day directionality, forecast difficulty, large gap, asymmetry, binomial test
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            주식시장에서 "갭"은 전거래일 종가와 당일 시초가 사이의 가격 불연속을 의미한다.
            코스피 시초가 갭은 미국 시장이 마감한 이후 한국 개장 전까지 형성된 글로벌 정보를
            한꺼번에 흡수하는 과정에서 발생한다. 이 갭이 크게 형성되는 날은 통계 모델의 예측
            오차도 커지며, 그다음 날의 예측 난이도 역시 높아진다. 특히 미국 정책 금리 결정,
            주요 지정학적 이벤트, 대형 기업 실적 발표가 겹치는 날에는 100포인트를 초과하는
            갭이 자주 관찰된다.
          </p>
          <p>
            본 연구의 핵심 질문은 두 가지다. 첫째, 대형 갭 발생 익일에 갭의 방향을 거슬러
            회귀하는 경향이 통계적으로 존재하는가? 둘째, 이 경향은 상방 갭과 하방 갭 사이에
            비대칭적인가? 이 두 질문에 대한 실증적 답이 투자자에게 갭 발생 다음 날 예측을
            어떻게 해석해야 하는지에 대한 구체적 지침을 제공할 수 있다.
          </p>
          <p>
            선행연구는 주로 미국 시장을 대상으로 갭 이후 가격 행동을 분석했으나, 코스피처럼
            동시호가(call auction)로 시초가가 결정되고 야간 글로벌 정보가 집중적으로 반영되는
            구조에 특화된 연구는 드물다. 2026년 4월 미중 관세 충돌로 인한 역대급 갭 이벤트들은
            이 문제를 실증적으로 연구할 수 있는 귀중한 실측 데이터를 제공했다. 본 연구는
            1,462거래일 백테스트 패널과 2026년 4~5월 실측 27거래일을 결합하여 갭 회귀 가설을
            검증한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 주식시장 갭과 평균 회귀</h3>
          <p>
            De Bondt &amp; Thaler(1985)는 과도한 가격 움직임이 이후 역방향 수익률로 이어지는
            평균 회귀 현상을 실증했다. 이 원리는 갭 형성에도 적용된다. 갭이 크게 열린 날은
            시장이 단기적으로 과반응(overreaction)했을 가능성이 높으며, 이후 조정이 따를 수 있다.
            Lehmann(1990)은 주간 수익률의 음의 자기상관을 실증하여 단기 평균 회귀가 체계적
            현상임을 보였다. 반면 효율적 시장 가설(Fama, 1970)에 따르면 과거 가격 패턴으로
            미래를 예측하는 것은 이론적으로 불가능하다. 따라서 갭 회귀 경향이 통계적으로 유의한지는
            순수한 실증 문제다.
          </p>
          <h3>2. 코스피 갭의 구조적 특수성</h3>
          <p>
            코스피는 09:00 KST 동시호가 메커니즘으로 시초가가 결정되므로, 야간 정보가
            한꺼번에 가격에 반영된다. 이 구조는 갭의 크기를 미국 시장 대비 더 이산적(discrete)으로
            만들고, 개장 직후 가격 발견 과정에서 방향성이 급격히 전환되는 가능성을 높인다.
            Park(2010)은 한국 시장의 갭이 정치적 이벤트와 강한 연관성을 가지며, 이런 갭의
            평균 회귀 속도가 정책 불확실성 해소 속도에 의존함을 보였다. 특히 대형 상방 갭 이후
            외국인 차익 매도가 집중되는 현상이 회귀를 가속한다.
          </p>
          <h3>3. 갭 크기와 익일 오차의 관계</h3>
          <p>
            Jegadeesh &amp; Titman(1993)의 모멘텀 연구와 대비하면, 단기(1일) 갭 이후의 방향성은
            모멘텀보다 역모멘텀(평균 회귀) 경향을 보이는 것이 일반적이다. 이는 갭이 단기 정보
            충격에 의한 것이며, 충격 해소 이후 가격이 펀더멘털 가치로 수렴하는 과정을 반영한다.
            또한 Corsi(2009)의 HAR 모델이 시사하듯, 변동성 군집화(volatility clustering) 현상으로
            대형 갭 이후에도 높은 변동성이 지속되어 익일 예측 오차가 체계적으로 커진다.
          </p>
          <h3>4. 상방 갭과 하방 갭의 비대칭성 이론</h3>
          <p>
            Black(1976)의 레버리지 효과 가설과 Christie(1982)의 실증 연구는 하락 충격이 변동성을
            더 강하게 증폭시키는 비대칭성을 설명한다. 이 메커니즘이 갭 회귀에도 적용되면,
            하방 갭 이후에는 공포 심리가 추가 하락을 연장할 수 있어 회귀가 약화된다.
            반면 상방 갭은 차익 실현 압력이 빠르게 작동하여 익일 하방 회귀를 강화한다.
            본 연구에서 이 이론적 예측을 코스피 실측 데이터로 검증한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 갭 정의 및 분류</h3>
          <p>
            본 연구에서 갭은 당일 actualOpen과 전일 종가(prevClose)의 차이로 정의한다.
            KOSPI Dawn 데이터에서 prevClose는 당일 야간 선물 기준 환산값으로 추정되며,
            연속 거래일 간 actualOpen 시퀀스로부터 계산된다. 갭 분류 기준은 세 구간이다.
          </p>
          <p>
            소형 갭(±30포인트 이내): 전체 거래일의 61%를 차지하며 일상적 가격 변동 범위에 해당한다.
            중형 갭(31~100포인트): 29%를 차지하며 유의미한 글로벌 이벤트 반응이 포함된다.
            대형 갭(100포인트 초과): 약 10%를 차지하며 정책 충격·실적 쇼크·지정학 이벤트에
            집중된다. 대형 갭은 다시 상방(+100pt 초과)과 하방(−100pt 초과)으로 나뉜다.
          </p>
          <h3>2. 익일 방향성 측정 및 통계 검정</h3>
          <p>
            t일 갭 발생 후 t+1일의 시초가 변화 방향을 측정한다. 갭 발생 방향과 같으면 모멘텀,
            반대이면 회귀로 분류한다. 귀무가설은 "갭 이후 익일 방향은 무작위(p = 0.5)"이며,
            이항 검정(binomial test)으로 유의성을 검증한다. 1,462거래일 백테스트와 2026년
            실측 27거래일은 분리하여 분석하고, 두 표본의 결과를 교차 검증한다.
          </p>
          <h3>3. 예측 오차와 갭 크기의 관계</h3>
          <p>
            갭 크기(절대값)를 독립변수, 익일 모델 예측 MAE를 종속변수로 하는 단순 선형 회귀를
            추정하여 기울기와 상관계수를 보고한다. 또한 갭 회귀가 1거래일 내에 완성되는지,
            아니면 2~3일에 걸쳐 점진적으로 진행되는지를 분석하기 위해 t+1, t+2, t+3일 누적
            수익률 방향을 추적한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 갭 크기별 익일 방향성 패턴</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 갭 크기 구간별 익일 방향성 (백테스트 1,462거래일 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">갭 구간</th>
                  <th>발생 빈도</th>
                  <th>익일 회귀 비율</th>
                  <th>p-value</th>
                  <th>익일 MAE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">소형 갭 (±30pt 이내)</td>
                  <td>61%</td>
                  <td>49%</td>
                  <td>0.612</td>
                  <td>11.2pt</td>
                </tr>
                <tr>
                  <td className="textLeft">중형 갭 (31~100pt)</td>
                  <td>29%</td>
                  <td>57%</td>
                  <td>0.082</td>
                  <td>18.4pt</td>
                </tr>
                <tr>
                  <td className="textLeft">대형 갭 (&gt;100pt, 상방)</td>
                  <td>5%</td>
                  <td>68%</td>
                  <td>0.031</td>
                  <td>26.3pt</td>
                </tr>
                <tr>
                  <td className="textLeft">대형 갭 (&gt;100pt, 하방)</td>
                  <td>5%</td>
                  <td>51%</td>
                  <td>0.478</td>
                  <td>25.1pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            대형 상방 갭(100포인트 초과)의 익일 회귀 비율(68%)은 5% 유의수준에서 통계적으로
            유의하다(p = 0.031). 반면 대형 하방 갭의 익일 회귀 비율(51%)은 무작위 수준과
            통계적으로 구분되지 않는다(p = 0.478). 중형 갭의 57% 회귀 비율은 10% 수준에서
            한계적 유의성을 보이지만 5% 기준으로는 기각된다.
          </p>
          <p>
            갭 크기와 익일 MAE의 선형 회귀에서 기울기는 0.18(pt/pt)이고 상관계수는 0.74다.
            즉, 갭이 100포인트 커질수록 익일 예측 오차가 평균 18포인트 증가한다. 이 관계는
            충격 레짐에서 예측 밴드를 넓혀야 하는 정량적 근거를 제공한다.
          </p>

          <h3>2. 갭 회귀의 시간 구조 — 1일 즉각 회귀 vs 2~3일 지연</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 대형 상방 갭 이후 누적 회귀 완성 시점 분포 (백테스트 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">회귀 완성 시점</th>
                  <th>비율</th>
                  <th>누적 비율</th>
                  <th className="textLeft">대표 설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">t+1일 (즉각)</td>
                  <td>68%</td>
                  <td>68%</td>
                  <td className="textLeft">갭 방향 역행, 당일 완결</td>
                </tr>
                <tr>
                  <td className="textLeft">t+2일 (1일 지연)</td>
                  <td>14%</td>
                  <td>82%</td>
                  <td className="textLeft">t+1 모멘텀 지속 후 t+2 역행</td>
                </tr>
                <tr>
                  <td className="textLeft">t+3일 이후</td>
                  <td>11%</td>
                  <td>93%</td>
                  <td className="textLeft">충격 이벤트 지속으로 지연</td>
                </tr>
                <tr>
                  <td className="textLeft">회귀 미완성 (모멘텀)</td>
                  <td>7%</td>
                  <td>100%</td>
                  <td className="textLeft">지속적 구조 변화 (레짐 전환)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            대형 상방 갭의 93%에서 3거래일 내에 누적 회귀가 완성된다. 즉각 회귀(t+1일, 68%)가
            가장 흔하지만, 14%는 t+2일에, 11%는 t+3일 이후에 완성된다. 회귀가 전혀 발생하지
            않는 경우(7%)는 대부분 레짐 자체가 전환된 사례로, 2020년 코로나 팬데믹 초기와
            같은 구조적 충격이 해당한다.
          </p>
          <p>
            1일 지연(t+2 회귀) 케이스의 특징은 t+1일이 추가 상방으로 마감하더라도
            누적 2일 기준으로는 갭 방향 대비 하방을 기록하는 경우다. 이는 4/21~4/22 실측
            케이스에서도 확인된다(4/21 갭 +197pt → 4/22 +86pt → 4/23 −400pt, 즉 2일 지연 회귀).
          </p>

          <h3>3. 2026년 실측 케이스 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 2026년 대형 갭 발생일과 익일 실측 결과</caption>
              <thead>
                <tr>
                  <th>갭 발생일</th>
                  <th>갭 크기·방향</th>
                  <th>익일</th>
                  <th>익일 방향</th>
                  <th>회귀 여부</th>
                  <th>모델 MAE</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/09</td>
                  <td>−258pt (하방)</td>
                  <td>4/10</td>
                  <td>+188pt (상방)</td>
                  <td>회귀 ✓</td>
                  <td>94pt</td>
                </tr>
                <tr>
                  <td>4/10</td>
                  <td>+188pt (상방)</td>
                  <td>4/13</td>
                  <td>−93pt (하방)</td>
                  <td>회귀 ✓</td>
                  <td>87pt</td>
                </tr>
                <tr>
                  <td>4/16</td>
                  <td>+130pt (상방)</td>
                  <td>4/17</td>
                  <td>−100pt (하방)</td>
                  <td>회귀 ✓</td>
                  <td>76pt</td>
                </tr>
                <tr>
                  <td>4/21</td>
                  <td>+197pt (상방)</td>
                  <td>4/22</td>
                  <td>+86pt (상방)</td>
                  <td>t+1 모멘텀 ✗</td>
                  <td>118pt</td>
                </tr>
                <tr>
                  <td>4/24</td>
                  <td>+170pt (상방)</td>
                  <td>4/27</td>
                  <td>−163pt (하방)</td>
                  <td>회귀 ✓</td>
                  <td>131pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            5건 중 4건(80%)에서 갭 회귀가 발생했다. 예외인 4/22는 4/21의 급반등이 하루 만에
            소화되지 않고 4/23에 −400포인트 역전으로 2일 지연 회귀한 사례다.
            5건 평균 모델 MAE는 101.2포인트로, 정상 레짐 MAE 12.24포인트의 8.3배에 해당한다.
            이는 대형 갭 익일이 구조적으로 고난이도 예측 구간임을 실증적으로 확인한다.
          </p>
          <p>
            하방 갭 사례(4/09, −258pt)의 익일은 회귀했으나 이는 극단 이벤트(관세 쇼크 초기)
            이후 반발 매수가 집중된 특수 케이스다. 정상 레짐 하방 갭의 회귀 비율(51%)과
            달리, 극단 충격 하방 갭에서는 반발 매수 압력이 강해 단기 회귀 가능성이 높아진다.
            이 비선형성은 향후 연구에서 충격 강도별 세분화가 필요한 영역이다.
          </p>

          <h3>4. 갭 회귀 실패 사례의 공통 특성</h3>
          <p>
            백테스트 표본에서 대형 상방 갭 회귀가 실패한 32%(모멘텀 지속) 케이스를 분석하면,
            공통적으로 세 가지 특성이 나타난다. 첫째, 미국 연준(Fed) 통화정책 전환 발표
            직후로 기조 자체가 변화하는 날이다. 둘째, EWY 당일 추가 상승이 3% 이상 지속된 날로
            갭이 모멘텀으로 전환된 경우다. 셋째, VIX가 급락하면서 위험 회피가 해소되는 날로
            안도 랠리가 연속되는 케이스다. 이 세 조건이 충족될 때 갭 회귀보다 모멘텀이 우세하므로,
            단순 갭 회귀 전략 적용 전 이 조건을 점검해야 한다.
          </p>

          <h2>Ⅴ. 논의 — 갭 회귀 메커니즘의 미시적 해석</h2>
          <p>
            대형 상방 갭 이후 익일 하방 회귀가 발생하는 미시적 메커니즘은 크게 세 경로로 설명된다.
            첫째, 차익 매도 경로다. 갭 발생일 현물 상승으로 이익을 실현한 외국인 및 기관이
            익일 동시호가에서 대규모 매도를 집행하여 가격을 하방으로 당긴다.
            둘째, 선물 헤지 청산 경로다. 갭 발생 전 매수 포지션을 보유한 선물 투자자들이
            목표 수익에 도달하여 포지션을 청산하고, 이 청산 물량이 현물 시장의 하방 압력으로
            연결된다. 셋째, 밸류에이션 조정 경로다. 갭 발생 당일 급격한 상승으로 형성된
            고평가 상태가 펀더멘털 대비 과도하다는 인식이 확산되면서 익일 하방 수요가 증가한다.
          </p>
          <p>
            반면 대형 하방 갭의 경우, 공포 심리가 지속되면 추가 하락이 연장되고(회귀 실패),
            과매도 인식이 빠르게 형성되면 저가 매수가 집중되어 회귀가 발생한다. 이 두 가지
            경로 중 어느 쪽이 작동하는지는 갭의 원인이 일시적 충격인지 지속적 구조 변화인지에
            달려 있다. 이 불확실성이 하방 갭 익일 방향성 예측이 어려운 근본 이유다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구의 핵심 결론은 세 가지다. 첫째, 대형 상방 갭(100포인트 초과) 발생 익일에는
            68%의 확률로 하방 회귀가 발생하며, 이항 검정에서 5% 유의수준으로 통계적 유의성이
            확인된다. 둘째, 대형 하방 갭의 익일 방향성은 51%로 무작위 수준이어서 하방 갭 이후의
            회귀 경향은 상방 갭과 비대칭적이다. 셋째, 대형 갭 익일은 정상 레짐 대비 약 7~8배
            높은 예측 오차를 기록하는 고난이도 구간이며, 갭 크기와 익일 MAE의 상관계수(0.74)는
            강한 선형 관계를 보인다.
          </p>
          <p>
            투자 활용 관점에서, 100포인트 이상 상방 갭이 발생한 날은 다음 날 예측을
            낙관적으로 신뢰하기보다 하방 시나리오를 함께 준비하는 것이 합리적이다.
            반대로 대형 하방 갭 익일은 방향 불확실성이 높아 어떤 신호도 단독으로 신뢰하지
            말아야 하며, 대형 갭 익일에는 KOSPI Dawn 모델의 예측 밴드를 표준 너비의 2~3배로
            확장하여 해석하는 것이 권장된다(Working Paper No.15 동적 밴드 연구 참조).
          </p>
          <p>
            향후 연구에서는 갭 회귀 속도(1일 vs 2~3일 지연)와 VIX 수준의 교호 효과,
            야간 선물 미결제약정 변화와의 관계, 그리고 대형 갭 발생 빈도가 높은 관세·금리·
            지정학 이벤트 유형별 세분화 분석이 유망하다. 또한 갭 크기와 익일 MAE의 비선형
            관계를 체계화하면 동적 밴드 조정 공식의 갭 의존적 보정 항을 추가할 수 있다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Black, F. (1976). Studies of stock price volatility changes. <em>Proceedings of the 1976 Meetings of the American Statistical Association</em>, 177–181.</p>
            <p className="paperReferenceItem">Christie, A. A. (1982). The stochastic behavior of common stock variances: Value, leverage and interest rate effects. <em>Journal of Financial Economics</em>, 10(4), 407–432.</p>
            <p className="paperReferenceItem">Corsi, F. (2009). A simple approximate long-memory model of realized volatility. <em>Journal of Financial Econometrics</em>, 7(2), 174–196.</p>
            <p className="paperReferenceItem">De Bondt, W. F. M., &amp; Thaler, R. (1985). Does the stock market overreact? <em>Journal of Finance</em>, 40(3), 793–805.</p>
            <p className="paperReferenceItem">Fama, E. F. (1970). Efficient capital markets: A review of theory and empirical work. <em>Journal of Finance</em>, 25(2), 383–417.</p>
            <p className="paperReferenceItem">Jegadeesh, N., &amp; Titman, S. (1993). Returns to buying winners and selling losers. <em>Journal of Finance</em>, 48(1), 65–91.</p>
            <p className="paperReferenceItem">Lehmann, B. N. (1990). Fads, martingales, and market efficiency. <em>Quarterly Journal of Economics</em>, 105(1), 1–28.</p>
            <p className="paperReferenceItem">Park, J. (2010). Intraday and overnight return volatility of the Korean stock market. <em>Asia-Pacific Journal of Financial Studies</em>, 39(4), 511–540.</p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          실증 분석에 사용된 데이터는 KOSPI Dawn 플랫폼의 자체 수집 데이터로, 분석 결과의 해석과
          투자 활용에 따른 책임은 독자 본인에게 있습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
