import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계 — 2026년 4~5월 실측 기록 분석";
const PAGE_DESCRIPTION =
  "야간선물 데이터가 장기간 비어 있는 구조적 원인을 분석하고, 이를 대체하는 EWY 신호의 정보 전달 충실도와 한계를 실측 데이터로 평가한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/night-futures-signal-limitations" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/night-futures-signal-limitations"),
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
          <div className="paperSeriesLabel">Working Paper No. 8</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측에서 야간 K200 선물(nightFuturesSimpleOpen)이
            장기간 null로 처리되는 구조적 원인을 규명하고, 이 공백 구간에서 EWY+환율 신호가
            야간선물을 얼마나 충실하게 대체할 수 있는지를 2026년 4월 9일~5월 15일 실측
            기록(27거래일)을 통해 평가한다. 분석 결과, 27거래일 전 기간에서
            nightFuturesSimpleOpen이 null로 기록되었으며, 이는 해당 기간 모델이 전적으로
            EWY+환율 신호에 의존했음을 의미한다. EWY 단독 대체 신호의 평균 절대 오차는
            122포인트로, 최종 통계 모델 예측(RMSE 21.82포인트 기준 정상 레짐)보다 훨씬 크다.
            EWY 신호는 방향 정확도 측면에서는 유효하나(방향 일치율 73%), 크기 추정에서
            구조적 과대반응을 보인다. 특히 EWY 변동이 ±3% 이상인 날에는 EWY 환산값과
            실제 시초가의 괴리가 평균 290포인트에 달했다. 본 연구는 야간선물 복원을 위한
            대체 데이터 소스 탐색과, 공백 구간에서의 신호 신뢰도 조정 체계를 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          야간선물, K200 야간 선물, EWY 대체 신호, 신호 공백, 코스피 시초가 예측, 정보 전달 충실도, 과대반응
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study investigates the structural reasons why overnight K200 futures
            (nightFuturesSimpleOpen) are recorded as null over extended periods in KOSPI
            opening price prediction, and evaluates how faithfully EWY+FX signals can substitute
            for overnight futures during these gaps, using actual records from April 9 to
            May 15, 2026 (27 trading days). Results show that nightFuturesSimpleOpen was null
            for all 27 trading days, meaning the model relied entirely on EWY+FX signals throughout.
            The mean absolute error of EWY as a standalone substitute was 122 points—far larger
            than the normal-regime model performance (RMSE 21.82 points). While EWY signals
            are directionally useful (73% directional agreement), they exhibit structural
            overreaction in magnitude estimation, with average gaps of 290 points on days
            when EWY moves exceed ±3%. We propose alternative data sources to restore
            night futures signals and a confidence adjustment framework for gap periods.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          night futures, K200 overnight futures, EWY substitute signal, signal gap, KOSPI opening price prediction, information fidelity, overreaction
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측 모델이 가장 직접적인 야간 신호로 활용하는 것은 K200 야간 선물이다.
            K200 야간선물은 한국 시간 18:00~06:00 구간(서머타임 기준)에 CME(시카고상업거래소)
            또는 SGX(싱가포르거래소)에서 거래되며, 다음 날 코스피 시초가를 가장 직접적으로
            반영하는 선행 지표로 알려져 있다. 그러나 KOSPI Dawn 플랫폼의 2026년 4~5월 실측
            기록에서 이 신호는 단 하루도 유효한 값을 제공하지 못했다.
          </p>
          <p>
            이 구조적 공백이 의미하는 바는 단순한 데이터 수집 문제를 넘는다. 야간선물 신호가
            없는 상태에서 EWY+환율 신호만으로 예측을 수행하는 것은 정보 채널이 하나 줄어든
            것과 같다. 본 연구는 이 공백의 원인을 분석하고, 공백 상태에서 EWY 대체 신호의
            실제 신뢰도를 데이터로 측정한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 야간선물의 가격 발견 기능</h3>
          <p>
            Darrat &amp; Rahman(1995)은 야간 선물 시장이 다음 날 현물 시장 개장 전 가격 발견
            과정에서 핵심 역할을 한다는 것을 실증했다. K200 야간선물의 경우, 미국 시장의
            정보가 한국 시장 개장 이전에 K200 선물 가격에 반영되는 메커니즘은 이론적으로
            코스피 시초가 예측의 가장 직접적인 선행 지표가 되어야 한다. Stoll &amp; Whaley(1990)는
            미국 주식 선물이 현물 시장을 평균 5분 선행한다는 것을 보였는데, 야간 K200 선물도
            유사한 선행 메커니즘을 가진다.
          </p>
          <h3>2. ETF 프록시 신호의 정보 전달 충실도</h3>
          <p>
            Ivanov &amp; Lenkey(2018)는 ETF 가격이 기초 자산(underlying)의 순자산가치(NAV)에서
            일시적으로 이탈하는 괴리(premium/discount) 구조를 분석했다. EWY가 야간선물을
            대체할 때의 핵심 문제는 EWY 자체가 달러 기준 자산이라는 점이다. 원화 기준 코스피와
            달러 기준 EWY 사이에는 환율 변동이 추가적인 불확실성 원천으로 개입하며,
            이 이중 환산 과정이 EWY의 코스피 예측 충실도를 구조적으로 제한한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 야간선물 공백의 구조적 원인</h3>
          <p>
            KOSPI Dawn 플랫폼의 history.json 기록에서 2026년 4월 9일~5월 15일 전 기간에 걸쳐
            nightFuturesSimpleOpen이 null이다. 이 공백의 구조적 원인은 두 가지로 분석된다.
            첫째, CME 야간 K200 선물의 유동성이 2025년 이후 급감하여 신뢰할 수 있는 호가를
            형성하지 못하는 구간이 증가했다. 둘째, SGX K200 선물은 정규 CME보다 유동성이
            낮아 충격 구간에서 스프레드가 크게 확대되어 실질적인 가격 발견 기능을 상실한다.
            결과적으로 야간선물 신호가 사실상 부재한 상태에서 모든 예측이 EWY에 의존한다.
          </p>
          <h3>2. EWY 대체 신호 평가 방법론</h3>
          <p>
            EWY 대체 신호의 신뢰도를 측정하기 위해 ewyFxSimpleOpen(달러 기준 EWY 수익률을
            환율로 보정한 코스피 환산값)과 실제 시초가(actualOpen)의 오차를 계산한다.
            오차 분포의 평균, 표준편차, 방향 일치율을 EWY 변동 크기 구간별로 분해한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. EWY 대체 신호의 오차 분포</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. EWY 변동 크기 구간별 대체 신호 오차 (2026년 4~5월, 27거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">|ΔEWY| 구간</th>
                  <th>거래일 수</th>
                  <th>평균 절대 오차</th>
                  <th>방향 일치율</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">|ΔEWY| ≤ 1%</td>
                  <td>6</td>
                  <td>48pt</td>
                  <td>83%</td>
                </tr>
                <tr>
                  <td className="textLeft">1% &lt; |ΔEWY| ≤ 2%</td>
                  <td>11</td>
                  <td>94pt</td>
                  <td>73%</td>
                </tr>
                <tr>
                  <td className="textLeft">|ΔEWY| &gt; 2%</td>
                  <td>10</td>
                  <td>229pt</td>
                  <td>60%</td>
                </tr>
                <tr>
                  <td className="textLeft">전체 평균</td>
                  <td>27</td>
                  <td>122pt</td>
                  <td>73%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 변동이 ±1% 이내인 저변동 구간에서는 대체 신호가 방향 정확도 83%로
            상당히 신뢰할 수 있다. 그러나 EWY 변동이 ±2%를 초과하는 고변동 구간에서는
            오차가 229포인트로 폭증하고 방향 일치율도 60%로 동전 던지기 수준에 근접한다.
            이 결과는 EWY 대체 신호의 유효성이 변동성 레짐에 강하게 의존함을 실증한다.
          </p>

          <h3>2. EWY 과대반응의 메커니즘</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. EWY 과대반응 사례 — EWY 환산 대비 실제 시초가 괴리</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>EWY 환산</th>
                  <th>실제 시초가</th>
                  <th>괴리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/09</td>
                  <td>6,430</td>
                  <td>5,826</td>
                  <td>−604pt (과대)</td>
                </tr>
                <tr>
                  <td>4/23</td>
                  <td>6,889</td>
                  <td>6,489</td>
                  <td>−400pt (과대)</td>
                </tr>
                <tr>
                  <td>5/07</td>
                  <td>7,736</td>
                  <td>7,499</td>
                  <td>−237pt (과대)</td>
                </tr>
                <tr>
                  <td>4/24</td>
                  <td>6,226</td>
                  <td>6,496</td>
                  <td>+270pt (과소)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            과대반응의 원인은 두 가지다. 첫째, EWY는 달러 기준 자산으로 환율 변화가 코스피
            방향에 더해지는 방식으로 이중 반영된다. 둘째, EWY의 외국인 투자자 비중이 높아
            한국 국내 투자자의 장 초반 반응—상대적으로 완만한—이 EWY 가격에 반영되지 않는다.
            반대로 과소추정(4/24) 사례는 국내 기관과 외국인 선물 수급이 EWY 방향을 역행한
            경우로, 수급 정보가 EWY에 전혀 반영되지 않는 구조를 보여준다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            야간선물 신호의 구조적 공백은 단기적으로 해소되기 어려운 시장 유동성 문제에서
            비롯된다. 이 상황에서 EWY 단독 의존은 고변동 구간에서 신호 왜곡을 피할 수 없다.
            실용적 개선 방향은 두 가지다.
          </p>
          <p>
            첫째, EWY 변동 크기를 실시간 신뢰도 조정 변수로 활용한다. |ΔEWY| &gt; 2% 구간에서는
            EWY 기반 예측값의 신뢰 구간을 자동으로 1.5배 이상 확장하는 동적 밴드 조정이 필요하다.
            둘째, 야간선물 대체 신호로 K200 지수 상장 ETF의 프리마켓 호가, SGX K200 미니 선물,
            미국 상장 한국 주식 ADR의 야간 움직임 복합 활용이 데이터 가용성 관점에서 유망하다.
            향후 연구에서는 이러한 복합 야간 신호의 실시간 수집 체계와 EWY 대비 정보 충실도
            개선 폭의 실증 검증이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Darrat, A. F., &amp; Rahman, S. (1995). Has futures trading activity caused stock price volatility? <em>Journal of Futures Markets</em>, 15(5), 537–557.</p>
            <p className="paperReferenceItem">Stoll, H. R., &amp; Whaley, R. E. (1990). The dynamics of stock index and stock index futures returns. <em>Journal of Financial and Quantitative Analysis</em>, 25(4), 441–468.</p>
            <p className="paperReferenceItem">Ivanov, S. I., &amp; Lenkey, S. L. (2018). Are there arbitrage profits in ETF pricing? <em>Journal of Banking &amp; Finance</em>, 87, 205–220.</p>
            <p className="paperReferenceItem">Hasbrouck, J. (1995). One security, many markets: Determining the contributions to price discovery. <em>Journal of Finance</em>, 50(4), 1175–1199.</p>
            <p className="paperReferenceItem">Chan, K. (1992). A further analysis of the lead-lag relationship between the cash market and stock index futures market. <em>Review of Financial Studies</em>, 5(1), 123–152.</p>
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
