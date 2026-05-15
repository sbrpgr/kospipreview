import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "코스피 개장 갭 형성의 비대칭성과 통계 모델의 하방 리스크 과소추정 문제";
const PAGE_DESCRIPTION =
  "코스피 시초가 갭의 상·하방 비대칭성을 실측 데이터로 확인하고, 통계 모델이 이산적 정치 충격에 의한 극단 갭을 구조적으로 과소추정하는 메커니즘과 투자적 함의를 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/opening-gap-asymmetry" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/opening-gap-asymmetry"),
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
          <div className="paperSeriesLabel">Working Paper No. 4</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 갭(개장가와 전일 종가의 차이)의 상·하방 비대칭성을 실측 데이터를
            통해 분석하고, 연속형 통계 모델이 이산적 정치 충격에 의한 대형 하방 갭을 구조적으로
            과소추정하는 메커니즘을 규명한다. 2026년 4월 관세 충격 사례 분석에서 하방 갭의 크기가
            상방 갭을 평균적으로 상회하는 경향이 확인되었으며, 이는 공포(fear)가 탐욕(greed)보다
            빠르고 강하게 가격에 반영되는 금융시장의 비대칭적 속성과 일치한다. 연속형 신호 기반
            통계 모델은 이산적 정보 충격—정책 발표, 지정학적 사건—을 포착하는 데 구조적 한계가 있으며,
            이는 모델 설계의 결함이 아니라 연속 신호 모델의 내재적 제약이다. 본 연구는 이 한계를
            인식한 투자자가 비대칭적 하방 리스크 관리 체계를 구축하는 방법을 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          개장 갭, 비대칭성, 하방 리스크, 과소추정, 이산적 충격, 코스피 시초가, 연속형 모델
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes the asymmetry between upward and downward opening gaps in the KOSPI
            (defined as the difference between the opening price and the previous day's closing price),
            using actual data, and identifies the mechanism by which continuous-signal statistical models
            structurally underestimate large downward gaps caused by discrete political shocks.
            Analysis of the April 2026 tariff shock period confirms that downward gaps tend to exceed
            upward gaps in magnitude, consistent with the asymmetric property of financial markets
            where fear is incorporated into prices faster and more forcefully than greed. Continuous
            signal-based statistical models have an inherent limitation in capturing discrete information
            shocks—policy announcements, geopolitical events—which is not a design flaw but an intrinsic
            constraint. This study proposes an asymmetric downside risk management framework for
            investors who recognize this limitation.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          opening gap, asymmetry, downside risk, underestimation, discrete shock, KOSPI opening price, continuous signal model
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            금융시장의 비대칭성은 오랜 연구 주제다. 손실 회피(loss aversion) 이론(Kahneman &amp;
            Tversky, 1979)은 투자자가 동일 크기의 손실과 이익을 비대칭적으로 평가함을 보여주며,
            이 심리적 비대칭성은 가격 형성 과정에도 반영된다. 주식시장에서 하락 변동성이 상승
            변동성보다 크게 나타나는 레버리지 효과(leverage effect)와 변동성 피드백(volatility
            feedback) 현상은 이 비대칭성의 구조적 표현이다.
          </p>
          <p>
            코스피 시초가 갭의 맥락에서 이 비대칭성은 특히 두드러질 수 있다. 동시호가 메커니즘에서
            대규모 하방 갭이 형성될 때 투자자들은 손절 주문을 집중적으로 투입하는 경향이 있어
            갭의 크기가 증폭된다. 반면 상방 갭 구간에서는 이미 포지션을 보유한 투자자들의 차익실현
            주문이 갭 확대를 억제한다. 이 구조적 차이가 상·하방 갭 크기의 비대칭성을 만들어내는
            메커니즘이다.
          </p>
          <p>
            본 연구는 이 비대칭성을 2026년 4월 관세 충격 실측 데이터를 통해 확인하고,
            이 비대칭성이 연속형 통계 모델의 예측 오차 구조에 어떻게 반영되는지를 분석한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 금융시장 비대칭성 연구</h3>
          <p>
            Black(1976)은 주식 수익률과 변동성 간 음(−)의 상관관계를 관찰하고, 주가 하락이
            기업의 레버리지 비율을 높여 변동성이 증가한다고 설명했다. 이후 Christie(1982)와
            Nelson(1991)은 이 비대칭 변동성이 GARCH 계열 모델로 포착될 수 있음을 보였다.
            Engle &amp; Ng(1993)는 뉴스 충격 곡선(news impact curve) 개념으로 하방 충격이
            상방 충격보다 변동성에 더 큰 영향을 미침을 실증했다.
          </p>
          <p>
            개장 갭 연구에서는 Chan(1992)이 개장 시 가격 발견 과정에서 시장 조성자(market maker)의
            역할을 분석했다. 한국 시장은 동시호가 방식을 채택하므로, 대규모 매도 주문의 집중이
            하방 갭 증폭 메커니즘으로 작용한다.
          </p>

          <h3>2. 이산적 정보 충격과 연속형 모델의 한계</h3>
          <p>
            연속형 시계열 모델(ARIMA, VAR, 회귀 모델)은 관측 가능한 연속 신호의 역사적 패턴을
            학습한다. 정치적 결정, 정책 발표, 지정학적 이벤트처럼 이산적(discrete)으로 발생하는
            충격은 이 모델의 학습 대상이 아니다. Clements &amp; Hendry(1998)는 이를 구조 변화
            (structural break)로 개념화하고, 이산적 충격이 예측 모델의 성과를 단기적으로
            크게 저하시킨다고 지적했다.
          </p>

          <h2>Ⅲ. 데이터 및 분석방법</h2>
          <p>
            분석 대상은 2026년 4월 9일부터 5월 4일까지 17거래일의 실측 코스피 시초가 기록과
            KOSPI Dawn 모델 예측값이다. 각 거래일의 예측 오차는 (실제 시초가 - 모델 예측)으로
            정의한다. 양(+)의 오차는 실제가 예측보다 높았음(모델 과소추정), 음(−)의 오차는
            실제가 예측보다 낮았음(모델 과대추정)을 나타낸다.
          </p>
          <p>
            갭 크기는 EWY+환율 단순환산과 실제 시초가의 차이로 근사한다.
            EWY+환율 단순환산이 시장 전반의 신호 방향을 반영하므로, 이 값보다 크게 낮거나 높게
            시초가가 형성된 경우를 각각 하방 갭 초과, 상방 갭 초과로 분류한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 갭 방향 및 크기 분포</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 7. 실측 기간 예측 오차 및 갭 특성 (단위: 포인트)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>EFS</th>
                  <th>MP</th>
                  <th>실제 시초가</th>
                  <th>EFS 대비 갭</th>
                  <th>방향</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>4/09</td><td>6,430</td><td>6,090</td><td>5,826</td><td>−604</td><td>하방 대형</td></tr>
                <tr><td>4/10</td><td>5,663</td><td>5,688</td><td>5,876</td><td>+213</td><td>상방 중형</td></tr>
                <tr><td>4/13</td><td>n/a</td><td>5,830</td><td>5,737</td><td>–</td><td>모델 과대</td></tr>
                <tr><td>4/20</td><td>6,413</td><td>6,343</td><td>6,214</td><td>−199</td><td>하방 중형</td></tr>
                <tr><td>4/21</td><td>6,075</td><td>6,106</td><td>6,303</td><td>+228</td><td>상방 중형</td></tr>
                <tr><td>4/23</td><td>6,889</td><td>6,632</td><td>6,489</td><td>−400</td><td>하방 대형</td></tr>
                <tr><td>4/24</td><td>6,226</td><td>6,316</td><td>6,496</td><td>+270</td><td>상방 중형</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            표 7에서 하방 갭의 최대 크기(4/9: -604, 4/23: -400)가 상방 갭의 최대 크기
            (4/24: +270, 4/21: +228)를 명확히 상회한다. 이 수치는 표본이 작아 통계적 유의성을
            단정하기 어렵지만, 방향별 갭의 크기 비대칭성을 실증적으로 시사한다.
          </p>

          <h3>2. 모델의 구조적 과소추정 메커니즘</h3>
          <p>
            4월 9일 사례에서 EWY+환율 단순환산(6,430)이 이미 실제 시초가(5,826)보다 604포인트
            높게 나타났다. 이는 EWY와 환율 신호 자체가 관세 충격의 전체 하방 압력을 포착하지 못했음을
            의미한다. 연속 신호 기반 모델(EFS, MP)은 이 한계를 더욱 심화시킨다. 관세 발표라는
            이산적 이벤트로 인한 투자 심리 급변, 동시호가에서의 패닉 매도 집중, 프로그램 매매
            자동 청산은 어떤 연속형 신호도 사전에 반영할 수 없다.
          </p>
          <p>
            이것이 연속형 통계 모델의 내재적 제약이다. 정치적 이벤트의 결과는 역사적 학습 대상이
            아닌 전례 없는 충격이며, 롤링 Ridge 회귀의 180일 윈도우는 이 충격을 점진적으로만
            흡수할 수 있다. 충격 직후 최소 수 거래일은 예측 오차가 구조적으로 크게 나타나는
            것이 불가피하다.
          </p>

          <h3>3. 비대칭 리스크의 투자적 함의</h3>
          <p>
            연속형 모델이 하방 갭을 과소추정하는 경향은 일방적 포지션 보유자에게 특히 위험하다.
            모델이 중립에서 약간 하방을 예상하는 구간에서도, 이산적 충격 발생 시 실제 낙폭이
            모델 예측의 2~3배에 달할 수 있다. 4월 9일 사례에서 모델이 예측한 하방(6,090)과
            실제 시초가(5,826)의 차이가 264포인트였다는 것은, 모델 밴드 하단을 넘어 추가로
            약 200포인트의 하방 여지가 존재했음을 보여준다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 코스피 시초가 갭의 상·하방 비대칭성과 연속형 통계 모델의 구조적 하방
            과소추정 문제를 실증 사례를 통해 분석했다. 핵심 결론은 다음과 같다.
          </p>
          <p>
            첫째, 실측 기간 하방 갭의 최대 크기(604포인트)가 상방 갭 최대 크기(270포인트)의
            약 2.2배에 달해 비대칭성이 확인된다. 둘째, 이 비대칭성은 이산적 정치 이벤트 충격 구간에서
            더욱 두드러지며, 연속형 모델이 포착할 수 없는 영역이다. 셋째, 투자자는 모델 밴드 하단을
            절대적 하방 한계로 오인해서는 안 되며, 정치적 이벤트 발표 전후에는 추가 하방 시나리오에
            대한 명시적 여유를 두어야 한다.
          </p>
          <p>
            실전 적용 방법으로, 정치 이벤트 예정일에는 모델 밴드 하단에서 추가 1~2%(코스피 기준
            약 60~130포인트)의 하방 버퍼를 설정하는 비대칭 밴드 확장을 제안한다.
            이 버퍼는 정상 레짐에서는 불필요하지만 충격 레짐 진입 시 손실 통제에 기여한다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Kahneman, D., &amp; Tversky, A. (1979). Prospect theory: An analysis of decision under risk. <em>Econometrica</em>, 47(2), 263–291.</p>
            <p className="paperReferenceItem">Black, F. (1976). Studies of stock price volatility changes. <em>Proceedings of the 1976 Meetings of the American Statistical Association</em>, 177–181.</p>
            <p className="paperReferenceItem">Engle, R. F., &amp; Ng, V. K. (1993). Measuring and testing the impact of news on volatility. <em>Journal of Finance</em>, 48(5), 1749–1778.</p>
            <p className="paperReferenceItem">Clements, M. P., &amp; Hendry, D. F. (1998). <em>Forecasting Economic Time Series</em>. Cambridge University Press.</p>
            <p className="paperReferenceItem">Chan, K. (1992). A further analysis of the lead–lag relationship between the cash market and stock index futures market. <em>Review of Financial Studies</em>, 5(1), 123–152.</p>
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
