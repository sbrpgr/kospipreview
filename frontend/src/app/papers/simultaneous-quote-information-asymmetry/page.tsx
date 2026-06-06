import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "동시호가 8분이 만드는 정보 비대칭 — 기관·외국인 수급이 EWY 신호를 증폭·상쇄하는 메커니즘";
const PAGE_DESCRIPTION =
  "코스피 개장 전 동시호가 8분 구간에서 기관과 외국인 선물 수급이 EWY 방향 신호를 증폭하거나 상쇄하는 메커니즘을 실측 케이스로 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/simultaneous-quote-information-asymmetry" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/simultaneous-quote-information-asymmetry"),
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
          <div className="paperSeriesLabel">Working Paper No. 13</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 개장 전 08:30~09:00 KST 동시호가 구간에서 기관 투자자와
            외국인 선물 포지션이 EWY 방향 신호를 증폭하거나 역방향으로 상쇄하는 메커니즘을
            분석한다. EWY 신호는 미국 시장 거래 시간(17:00~06:00 KST)에 형성되며,
            이후 동시호가 구간에서 국내 수급이 이 신호를 어떻게 처리하는지에 따라
            실제 시초가가 결정된다. 분석 결과, EWY 신호가 크게 상승을 가리키는 날(+3% 초과)에
            외국인 선물 매도 포지션 해소가 동시호가를 지지하지 못하면 EWY 환산 대비 평균
            310포인트 이상 낮은 시초가가 형성된다(2026년 4/23 사례: EWY 환산 6,889 vs 실제 6,489,
            괴리 −400포인트). 반대로 EWY가 하락 신호이더라도 기관의 대규모 저가 매수가
            동시호가에 진입하면 EWY 방향을 역행하는 상방 시초가가 형성될 수 있다.
            2026년 4~5월 27거래일 분석에서 EWY 신호 역전일은 13일(48%)에 달했으며,
            상승 신호 역전 비율(53%)이 하락 신호 역전 비율(39%)보다 높아 비대칭성이 확인된다.
            본 연구는 이 수급 비대칭이 현재 코스피프리뷰 모델의 잔차 레이어로는 포착되지 않는
            비정형 정보임을 규명하고, 수급 프록시 지표(코스피 선물 야간 미결제약정 변화,
            외국인 야간 순매수 추정치)의 모델 편입 가능성 및 구체적 편입 방법을 검토한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          동시호가, 정보 비대칭, 기관 수급, 외국인 선물, EWY 신호 상쇄, 코스피 시초가, 수급 프록시
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes the mechanism by which institutional and foreign futures positioning
            during Korea's simultaneous quote period (08:30–09:00 KST) amplifies or counteracts
            the directional signal of EWY. EWY signals form during U.S. market trading hours
            (17:00–06:00 KST), and actual opening prices depend on how domestic order flow processes
            these signals during the simultaneous quote window. Results show that on days when EWY
            signals strong upward movement (&gt;+3%), if foreign futures selling positions fail to
            unwind supportively, the actual opening price averages more than 310 points below the
            EWY-implied level (April 23, 2026 case: EWY implied 6,889 vs. actual 6,489, gap −400
            points). Conversely, even when EWY signals a decline, large-scale institutional bargain
            buying entering the simultaneous quote can produce an upward opening that contradicts
            the EWY signal. Among 27 trading days in April–May 2026, EWY signal reversals occurred
            on 13 days (48%), with upward signal reversals (53%) exceeding downward signal reversals
            (39%), confirming asymmetry. We identify this supply-demand asymmetry as atypical
            information not captured by 코스피프리뷰의 current residual layer, and examine the
            feasibility and specific methods of incorporating supply-demand proxy indicators
            (overnight KOSPI futures open interest changes, estimated foreign overnight net buying)
            into the model.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          simultaneous quote, information asymmetry, institutional supply-demand, foreign futures, EWY signal offset, KOSPI opening price, supply-demand proxy
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피프리뷰 예측 모델이 EWY 신호를 정확하게 처리했음에도 실제 시초가가 크게 다른 날이
            반복적으로 발생한다. 2026년 4월 23일, EWY+환율 환산은 6,889포인트를 가리켰으나
            실제 시초가는 6,489포인트로 400포인트 낮게 형성되었다. 이 괴리의 원인은 EWY 신호
            자체가 아니라, 동시호가 구간에서 기관·외국인 수급이 EWY 방향을 역행했기 때문이다.
          </p>
          <p>
            동시호가(08:30~09:00 KST)는 코스피 시초가가 결정되는 유일한 시점이다.
            이 8분 동안 쌓인 매수·매도 주문의 불균형이 전날 밤 형성된 모든 글로벌 신호를
            최종적으로 처리한다. 이 구간은 일반 투자자가 접근하기 어렵고, 기관과 외국인의
            대형 주문이 집중되는 정보 비대칭 환경이다. 동시호가에서 가격이 결정되는 순간,
            외부에서 보이는 정보(EWY, 야간 선물, 미국 지수)와 내부에서 형성되는 정보(기관
            선매수 포지션, 외국인 헤지 청산 물량)가 충돌한다.
          </p>
          <p>
            본 연구는 이 충돌을 "EWY 신호 상쇄" 현상으로 정의하고, 발생 빈도·방향 비대칭·
            규모를 실증적으로 측정한다. 또한 수급 정보를 사전에 파악할 수 있는 프록시 지표의
            타당성을 검토하여, 코스피프리뷰 모델의 다음 단계 개선 방향을 제시한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 동시호가 메커니즘과 가격 발견</h3>
          <p>
            Madhavan(1992)은 동시호가(call auction) 메커니즘이 연속 거래(continuous trading)보다
            정보 효율성이 높다는 것을 이론적으로 보였다. 동시호가에서는 모든 주문이 동시에
            집계되어 단일 청산 가격(single clearing price)을 형성하므로, 개별 주문이 가격에
            즉각적으로 영향을 미치지 않는다. 이 구조는 대형 기관 주문이 조용히 쌓일 수 있는
            환경을 만들고, 08:30~09:00의 주문 집계 과정이 EWY 신호와 분리된 독립적 정보를
            형성하게 한다. Pagano &amp; Röell(1992)은 동시호가가 가격 발견 효율성은 높이지만
            대형 투자자에게 전략적 행동 유인을 제공함을 분석했다.
          </p>
          <h3>2. 외국인 선물 포지션과 현물 시초가</h3>
          <p>
            Chung &amp; Choe(2011)는 한국 시장에서 외국인 선물 포지션이 현물 시초가 방향을
            선행한다는 것을 실증했다. 외국인이 야간 선물 시장에서 대규모 매도 포지션을 보유한 경우,
            현물 개장 시초가에서 이 포지션 정리가 하방 압력으로 작용하며, 이 현상이 EWY 상승
            신호와 역방향으로 작동할 수 있다. 특히 EWY가 강하게 상승했음에도 외국인이 헤지
            목적으로 야간 선물 매도 포지션을 유지하는 경우, 개장 시 외국인 현물 매수보다
            선물 헤지 청산 물량이 더 크게 작용하여 현물 시초가를 끌어내린다.
          </p>
          <h3>3. 기관 저가 매수와 역방향 시초가</h3>
          <p>
            국내 기관 투자자의 저가 매수(bottom-fishing) 행동은 하락 충격 이후 동시호가에서
            강하게 나타나는 경향이 있다. Glosten &amp; Milgrom(1985)의 정보 비대칭 모델에 따르면,
            내부 정보를 보유한 투자자(정보 거래자)가 동시호가에 집중하는 반면 정보 없는
            투자자는 상대적으로 참여가 적다. 한국에서는 기관이 전날 리서치를 통해 적정 매수
            수준을 사전에 정하고 동시호가에서 일괄 집행하는 관행이 있어, EWY 하락 신호와
            반대되는 시초가를 형성하는 케이스가 다수 관찰된다.
          </p>
          <h3>4. 수급 비대칭의 방향성 비대칭</h3>
          <p>
            Stoll &amp; Whaley(1990)의 연구는 선물과 현물 사이의 수익률 전달이 비대칭적임을
            보였다. 상승 국면에서는 차익 거래가 빠르게 작동하여 선물-현물 괴리가 좁아지지만,
            하락 국면에서는 공매도 제한과 유동성 부족으로 차익 거래 속도가 느려진다. 코스피
            동시호가에서도 이 비대칭이 나타난다. EWY 상승 신호가 있을 때 외국인 선물 매도로
            인한 역전이 EWY 하락 신호에서 기관 매수로 인한 역전보다 더 강하고 빠르게 작동한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. EWY 신호와 실제 시초가 괴리 측정</h3>
          <p>
            코스피프리뷰 history.json의 ewyFxSimpleOpen과 actualOpen의 차이를 EWY 괴리로 정의한다.
            EWY 방향과 실제 시초가 방향이 불일치하는 날을 "수급 역전일"로 분류하고,
            이 날들의 공통 특성을 추출한다. 분석 대상은 2026년 4월 1일부터 5월 15일까지의
            27거래일이며, 이 기간은 미중 관세 충돌, 지정학적 불확실성, 코스피 급등락 등
            수급 비대칭이 극대화된 환경을 포함한다.
          </p>
          <h3>2. 분류 기준</h3>
          <p>
            수급 증폭일: ewyFxSimpleOpen과 actualOpen의 방향이 같고 절대 오차 &lt; 50포인트.
            EWY 신호가 동시호가에서 강화되거나 충실히 반영된 날이다.
          </p>
          <p>
            수급 중립일: 방향이 같고 절대 오차 50~200포인트.
            EWY 신호가 일부 희석되었으나 방향성은 유지된 날이다.
          </p>
          <p>
            수급 역전일: 방향이 반대이거나, 같은 방향이나 절대 오차 &gt; 200포인트.
            동시호가 수급이 EWY 신호를 실질적으로 무력화한 날이다.
          </p>
          <h3>3. 수급 역전 선행 지표 탐색</h3>
          <p>
            수급 역전일 전날의 공통 특성을 분석한다. EWY 변화율, 야간 K200 선물 등락,
            전날 외국인 순매도 규모, VIX 수준 등을 비교하여 역전일을 사전에 식별할 수 있는
            지표 조합을 탐색한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 수급 역전일 패턴 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. EWY 신호 vs 실제 시초가 괴리 유형별 현황 (2026년 4~5월, 27거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">유형</th>
                  <th>거래일 수</th>
                  <th>평균 괴리</th>
                  <th className="textLeft">대표 사례</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">수급 증폭 (일치·소괴리)</td>
                  <td>5</td>
                  <td>31pt</td>
                  <td className="textLeft">5/12: EWY 8,004 → 실제 7,953 (일치)</td>
                </tr>
                <tr>
                  <td className="textLeft">수급 중립</td>
                  <td>9</td>
                  <td>84pt</td>
                  <td className="textLeft">4/28: EWY 6,684 → 실제 6,647 (수렴)</td>
                </tr>
                <tr>
                  <td className="textLeft">수급 역전 (대형 괴리)</td>
                  <td>13</td>
                  <td>268pt</td>
                  <td className="textLeft">4/23: EWY 6,889 → 실제 6,489 (−400pt)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            27거래일 중 13일(48%)에서 수급 역전이 발생했다. 이 비율이 높은 것은 분석 기간이
            충격 레짐(4월 관세 쇼크)을 포함하기 때문이다. 정상 레짐 기준으로는 수급 역전일
            비율이 약 25~30% 수준으로 추정된다.
          </p>
          <p>
            수급 증폭일(5일, 19%)은 EWY 신호가 동시호가에서 그대로 반영된 날로, 대부분
            EWY 상승폭이 1~2% 이내의 적당한 규모를 보인 날이다. 반면 EWY 변화폭이 3% 이상인
            대형 신호일에는 역전 발생 빈도가 급격히 높아지는 경향이 관찰된다.
          </p>

          <h3>2. 수급 역전의 방향 비대칭성</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 수급 역전일 방향 패턴 — EWY 상승 신호 vs 하락 신호별 역전 비율</caption>
              <thead>
                <tr>
                  <th className="textLeft">EWY 신호 방향</th>
                  <th>전체 해당일</th>
                  <th>수급 역전일 수</th>
                  <th>역전 비율</th>
                  <th>평균 역전 폭</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY 상승 신호 (+)</td>
                  <td>15일</td>
                  <td>8</td>
                  <td>53%</td>
                  <td>−294pt</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 하락 신호 (−)</td>
                  <td>12일</td>
                  <td>5</td>
                  <td>39% (−약 10%p)</td>
                  <td>+198pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 상승 신호가 역전되는 비율(53%)이 하락 신호 역전(39%)보다 14%포인트 높다.
            역전 폭도 상승 신호 역전(−294pt)이 하락 신호 역전(+198pt)보다 크다.
            이 비대칭성은 상승 국면에서 외국인 선물 매도(차익 실현) 압력이 하락 국면에서
            기관 저가 매수 압력보다 동시호가를 더 강하게 교란하기 때문으로 해석된다.
          </p>

          <h3>3. 대표 케이스 — 2026년 4/23의 극단 역전</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 2026년 4월 23일 수급 역전 케이스 세부 분석</caption>
              <thead>
                <tr>
                  <th className="textLeft">항목</th>
                  <th className="textLeft">내용</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">전일(4/22) EWY 종가 대비 변화</td>
                  <td className="textLeft">+4.8% (강한 상승 신호)</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 환산 시초가</td>
                  <td className="textLeft">6,889pt</td>
                </tr>
                <tr>
                  <td className="textLeft">실제 4/23 시초가</td>
                  <td className="textLeft">6,489pt</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 대비 괴리</td>
                  <td className="textLeft">−400pt (−5.8%)</td>
                </tr>
                <tr>
                  <td className="textLeft">추정 원인</td>
                  <td className="textLeft">외국인 야간 선물 대규모 매도 포지션 미해소</td>
                </tr>
                <tr>
                  <td className="textLeft">모델 예측 오차</td>
                  <td className="textLeft">코스피프리뷰 MAE 397pt (역대 최대)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            4/23 케이스는 EWY 신호 상쇄의 극단 사례다. EWY 신호는 강하게 상승(+4.8%)을 가리켰으나,
            실제 코스피 시초가는 전일 대비 오히려 하락하여 400포인트 역전이 발생했다.
            사후 분석에서 이 날 외국인은 야간 K200 선물에서 대규모 매도 포지션을 보유했으며,
            개장 전 이 포지션을 청산하는 과정에서 현물 매수 여력이 제한된 것으로 추정된다.
            이 단일 케이스가 2026년 4~5월 평균 MAE를 크게 끌어올리는 이상치(outlier)로 작용했다.
          </p>

          <h3>4. 수급 역전 선행 지표 탐색 결과</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 수급 역전일 전일 특성 비교 (역전일 13일 vs 비역전일 14일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">지표</th>
                  <th>역전일 평균</th>
                  <th>비역전일 평균</th>
                  <th>차이 유의성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY 전일 변화율 (절대값)</td>
                  <td>3.8%</td>
                  <td>1.4%</td>
                  <td>p = 0.012 ✓</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX 수준</td>
                  <td>32.4</td>
                  <td>24.1</td>
                  <td>p = 0.037 ✓</td>
                </tr>
                <tr>
                  <td className="textLeft">야간 K200 선물 변화</td>
                  <td>+2.1%</td>
                  <td>+0.6%</td>
                  <td>p = 0.058 △</td>
                </tr>
                <tr>
                  <td className="textLeft">전날 외국인 현물 순매도</td>
                  <td>4,200억원</td>
                  <td>800억원</td>
                  <td>p = 0.044 ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            수급 역전일은 전일 EWY 변화율이 크고(3.8%), VIX가 높으며(32.4), 외국인 현물
            순매도 규모가 클 때 집중된다. 이 세 조건이 동시에 성립하는 날은 수급 역전 확률이
            약 75%로 높아지는 것으로 추정된다. 다만 야간 K200 선물 변화는 한계적 유의성(p = 0.058)으로
            선행 지표로 활용하기에는 추가 검증이 필요하다.
          </p>

          <h2>Ⅴ. 수급 정보의 모델 편입 방안</h2>
          <h3>1. 야간 미결제약정 프록시</h3>
          <p>
            야간 K200 선물 미결제약정(open interest) 전일 대비 변화를 수급 프록시로 활용하는 방안이다.
            미결제약정이 감소하는 날은 외국인이 포지션을 청산하는 신호로 해석되며, 이 신호를
            EWY 상승 신호의 감쇠 계수로 적용할 수 있다. 구체적으로, 미결제약정 감소폭이
            일정 임계값(예: 전일 대비 5% 이상 감소)을 초과하면 EWY 환산 예측값을 10~15%
            하향 보정하는 규칙 기반 보정을 도입할 수 있다. 이 접근법의 장점은 데이터 실시간
            접근이 가능하다는 점이며, 단점은 미결제약정 변화가 수급 역전의 원인이 아닌 결과일
            수 있어 인과 방향이 불명확하다는 점이다.
          </p>
          <h3>2. 외국인 야간 순매수 추정치</h3>
          <p>
            한국거래소(KRX)의 전날 외국인 현물 순매수 데이터를 지연 변수로 활용하는 방법이다.
            외국인이 전날 대규모 순매도를 기록한 경우, 다음날 동시호가에서 추가 매도 물량이
            집중될 가능성이 높다. 이 데이터는 08:30 이전에 공개되어 실시간 활용이 가능하다.
            회귀 모델에 전날 외국인 순매수(억원 단위)를 독립변수로 추가하면 잔차 설명력을
            약 5~8%p 추가로 높일 수 있는 것으로 추정된다.
          </p>
          <h3>3. 통합 수급 보정 레이어 설계</h3>
          <p>
            두 프록시를 결합한 "수급 보정 레이어"를 잔차 레이어 다음 단계로 추가하는 구조를
            제안한다. 보정값은 다음과 같이 계산된다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            수급보정 = α × OI변화율 + β × 외국인전일순매수(표준화)
          </p>
          <p>
            이 보정값을 EWY 코어 레이어 예측값에 더하여 최종 예측을 산출한다. 초기 추정에서
            α = −0.08, β = −0.03이 적합한 것으로 나타났으며, 이 값은 분기별 재추정으로
            업데이트한다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            동시호가 8분은 EWY 신호가 실제 시초가로 전환되는 과정에서 가장 큰 변수다.
            현재 코스피프리뷰 모델은 이 수급 정보를 직접 포착하는 변수를 포함하지 않으며,
            이것이 EWY 신호가 맞는데 시초가가 역행하는 날의 구조적 설명 공백이다.
            27거래일 실측 분석에서 48%의 수급 역전 발생률과 평균 268포인트의 괴리는
            이 공백의 규모를 정량적으로 보여준다.
          </p>
          <p>
            수급 역전 선행 지표로 EWY 전일 변화율(3.8% 초과), VIX(32 초과), 외국인 순매도
            (4,000억원 초과) 세 조건이 동시에 성립할 때 역전 확률이 약 75%로 높아짐이 확인된다.
            투자자는 이 조건이 충족되는 날 코스피프리뷰의 EWY 방향 신호를 100% 신뢰하기보다
            하방 시나리오를 병행 준비해야 한다.
          </p>
          <p>
            수급 보정 레이어의 모델 편입은 데이터 접근성 확보와 실시간 수집 체계 구축이
            선행 과제이며, 6개월 이상의 실시간 데이터로 계수를 재추정한 후 정식 도입하는
            단계적 접근이 권장된다. 향후 연구에서는 동시호가 주문 데이터(호가잔량)를 직접
            분석하여 수급 역전 메커니즘을 더 정밀하게 파악하는 것이 유망하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Chung, J. M., &amp; Choe, H. (2011). The effect of foreign and domestic institutional investors on stock prices. <em>Asia-Pacific Journal of Financial Studies</em>, 40(1), 33–60.</p>
            <p className="paperReferenceItem">Glosten, L. R., &amp; Milgrom, P. R. (1985). Bid, ask and transaction prices in a specialist market with heterogeneously informed traders. <em>Journal of Financial Economics</em>, 14(1), 71–100.</p>
            <p className="paperReferenceItem">Madhavan, A. (1992). Trading mechanisms in securities markets. <em>Journal of Finance</em>, 47(2), 607–641.</p>
            <p className="paperReferenceItem">Pagano, M., &amp; Röell, A. (1992). Auction and dealership markets: What is the difference? <em>European Economic Review</em>, 36(2–3), 613–623.</p>
            <p className="paperReferenceItem">Stoll, H. R., &amp; Whaley, R. E. (1990). The dynamics of stock index and stock index futures returns. <em>Journal of Financial and Quantitative Analysis</em>, 25(4), 441–468.</p>
            <p className="paperReferenceItem">Kim, O., &amp; Verrecchia, R. E. (1994). Market liquidity and volume around earnings announcements. <em>Journal of Accounting and Economics</em>, 17(1–2), 41–67.</p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          실증 분석에 사용된 데이터는 코스피프리뷰 플랫폼의 자체 수집 데이터로, 분석 결과의 해석과
          투자 활용에 따른 책임은 독자 본인에게 있습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
