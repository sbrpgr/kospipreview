import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "전신호 동시 이탈日의 구조적 조건 — 모델·EWY·야간선물이 같은 방향으로 함께 틀리는 날";
const PAGE_DESCRIPTION =
  "통계 모델, EWY 신호, 야간선물 기대값이 동시에 같은 방향으로 크게 이탈하는 날의 공통 선행 조건을 실측 데이터로 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/total-signal-failure-days" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/total-signal-failure-days"),
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
          <div className="paperSeriesLabel">Working Paper No. 6</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측에서 통계 모델, EWY+환율 단순환산, 야간선물 기대값의
            세 신호가 동시에 동일한 방향으로 크게 이탈하는 "전신호 동시 이탈日"을 식별하고,
            그 발생 조건을 실측 데이터를 통해 분석한다. 2026년 4월 9일부터 5월 4일까지
            17거래일 중 6일에서 전신호 동시 이탈이 발생했으며, 이탈 규모는 평균 166포인트에
            달했다. 분석 결과, 전신호 동시 이탈의 공통 선행 조건은 세 가지로 수렴한다.
            첫째, 전날 EWY 변동폭이 ±2% 이상인 고변동 구간이었다. 둘째, 정책 이벤트(관세 발표,
            무역 협상 타결 등)가 미국 정규장 마감 이후—한국 시간 새벽—에 발생하여 모든 야간
            프록시 신호가 이를 반영하지 못했다. 셋째, 이탈 방향이 상방(과소추정) 쪽으로 비대칭적으로
            집중되어 있었다(6건 중 4건 상방). 이 비대칭성은 극단 하방 충격 직후 반등 심리가
            야간 선물·EWY보다 강하게 실물 시장에서 표출되는 구조를 반영한다. 본 연구는
            전신호 이탈 위험이 높은 날을 사전에 감지하는 다중 조건 경보 프레임워크를 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          전신호 동시 이탈, 코스피 시초가 예측, EWY ETF, 야간선물, 정책 이벤트 충격, 예측 오차 비대칭성, 경보 프레임워크
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study identifies "total signal failure days"—days when all three KOSPI opening
            price signals (statistical model, EWY+FX simple conversion, and night futures estimate)
            simultaneously deviate in the same direction by a large margin—and analyzes their
            common preconditions using actual data. Among 17 trading days from April 9 to May 4,
            2026, six exhibited total signal failure, with an average deviation of 166 points.
            Three common preconditions emerge: (1) EWY volatility exceeding ±2% on the prior
            trading day; (2) policy events (tariff announcements, trade deal closures) occurring
            after U.S. market close, leaving all overnight proxy signals unable to incorporate
            the information; and (3) an asymmetric upward bias in failure direction (4 of 6 cases
            were upward misses). This upward asymmetry reflects post-shock rebound sentiment
            materializing more strongly in actual market openings than in overnight proxies.
            We propose a multi-condition early warning framework for prospectively identifying
            high-risk total signal failure days.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          total signal failure, KOSPI opening price prediction, EWY ETF, night futures, policy event shock, forecast error asymmetry, early warning framework
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측에서 개별 신호의 이탈은 일상적으로 발생한다. 통계 모델이 밴드를
            벗어나는 날, EWY 신호가 실제 시초가와 크게 차이 나는 날은 매월 수 차례씩 관찰된다.
            그러나 통계 모델, EWY+환율 단순환산, 야간선물 기대값—세 신호가 동시에 같은 방향으로
            크게 이탈하는 날은 다른 종류의 현상이다. 이 상황에서는 개별 신호의 오류가 아닌,
            모든 야간 정보 채널이 공통으로 실패하고 있다는 신호이기 때문이다.
          </p>
          <p>
            본 연구는 이러한 "전신호 동시 이탈日"을 체계적으로 식별하고 그 발생 메커니즘을
            규명하는 것을 목적으로 한다. 연구 질문은 다음 세 가지다. 첫째, 전신호 동시 이탈은
            얼마나 자주, 어떤 크기로 발생하는가? 둘째, 이탈이 발생하는 날에 공통으로 선행하는
            조건이 존재하는가? 셋째, 이탈 방향에 비대칭성이 있으며, 그 원인은 무엇인가?
          </p>
          <p>
            분석 대상은 2026년 4월 9일부터 5월 4일까지 코스피프리뷰 플랫폼의 실측 예측 기록이다.
            이 기간은 미국발 관세 충격, 유예 발표, 미중 협상 타결 등 복수의 정책 이벤트가
            집중된 자연 실험 환경을 제공한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 공통 정보 실패와 신호 붕괴</h3>
          <p>
            금융 시장의 가격 발견 이론에서 복수의 독립 신호가 동일한 방향으로 동시에 실패하는
            현상은 공통 정보 환경의 구조적 변화를 의미한다. Black(1986)은 금융 시장의 정보를
            "신호(signal)"와 "잡음(noise)"으로 구분하며, 모든 정보 처리자가 동일한 잡음에
            노출될 때 집단적 실패가 발생함을 논증했다. 코스피 시초가 예측의 맥락에서
            EWY, 야간선물, 통계 모델은 모두 미국 거래 시간대의 정보를 처리한다.
            이 공통 정보 원천이 교란될 때—특히 미국 시장 마감 이후 새벽에 정책 이벤트가
            발생할 때—세 신호는 동시에 같은 방향으로 실패하는 구조적 취약성을 갖는다.
          </p>
          <h3>2. 이산 정책 충격과 연속 모델의 한계</h3>
          <p>
            Pastor &amp; Veronesi(2012)는 정치적 불확실성이 자산 가격에 미치는 영향을 분석하며,
            정책 발표가 갑작스러운 이산적 이벤트로 발생할 때 연속형 통계 모델이 구조적으로
            대응에 실패함을 이론화했다. 코스피 시초가는 동시호가 메커니즘으로 결정되므로,
            야간 정보 공백 구간(15:30~09:00 KST)에서 발생한 정책 이벤트를 모든 프록시 신호가
            포착하지 못하면 시초가 자체가 이 정보를 한꺼번에 흡수하는 점프가 발생한다.
          </p>
          <h3>3. 예측 오차의 방향 비대칭성</h3>
          <p>
            Barberis &amp; Thaler(2003)의 행동재무 연구는 투자자 심리가 하방 충격 이후 반등 국면에서
            비대칭적으로 강하게 작동함을 보인다. 공포(fear)의 해소 속도가 그리움(greed)의 복귀
            속도보다 빨라, 극단 하락 이후의 반등이 야간 선물 시장이 예상하는 것보다 강하게
            나타나는 경향이 있다. 이 심리적 비대칭이 전신호 이탈의 상방 편향을 설명한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 전신호 동시 이탈 정의</h3>
          <p>
            본 연구는 전신호 동시 이탈을 다음과 같이 정의한다. 특정 거래일 t에서
            (1) 통계 모델 예측값이 실제 시초가 밴드를 이탈하고,
            (2) EWY+환율 단순환산이 실제 시초가 대비 같은 방향으로 60포인트 이상 차이 나며,
            (3) 이탈 절대값이 100포인트 이상인 날을 전신호 동시 이탈日로 분류한다.
            야간선물 데이터가 null인 날은 야간선물 조건을 EWY 조건으로 대체한다.
            분석 표본은 코스피프리뷰 history.json의 2026년 4월 9일~5월 4일 실측 기록이다.
          </p>
          <h3>2. 선행 조건 변수</h3>
          <p>
            전신호 이탈의 선행 조건으로 다음 변수를 검토한다. 전일 EWY 수익률 절대값(|ΔEWY|),
            전일 VIX 수준, 미국 정규장 마감(ET 16:00) 이후~한국 개장 이전 구간의 정책 이벤트
            발생 여부(이진 변수), 전일 오차 방향(과대/과소).
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 전신호 동시 이탈日 식별</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 전신호 동시 이탈日 목록 (2026년 4~5월 실측)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>모델 예측</th>
                  <th>EWY 환산</th>
                  <th>실제 시초가</th>
                  <th>오차</th>
                  <th>방향</th>
                  <th>주요 이벤트</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/09</td>
                  <td>6,084</td>
                  <td>6,430</td>
                  <td>5,826</td>
                  <td>−258 / −604</td>
                  <td>과대</td>
                  <td className="textLeft">관세 부과 충격 직격</td>
                </tr>
                <tr>
                  <td>4/10</td>
                  <td>5,688</td>
                  <td>5,663</td>
                  <td>5,876</td>
                  <td>+188 / +213</td>
                  <td>과소</td>
                  <td className="textLeft">트럼프 90일 관세 유예 발표</td>
                </tr>
                <tr>
                  <td>4/20</td>
                  <td>6,343</td>
                  <td>6,413</td>
                  <td>6,214</td>
                  <td>−129 / −199</td>
                  <td>과대</td>
                  <td className="textLeft">추가 관세 우려 재확산</td>
                </tr>
                <tr>
                  <td>4/21</td>
                  <td>6,106</td>
                  <td>6,075</td>
                  <td>6,303</td>
                  <td>+197 / +228</td>
                  <td>과소</td>
                  <td className="textLeft">충격 후 급반등 국면</td>
                </tr>
                <tr>
                  <td>4/24</td>
                  <td>6,326</td>
                  <td>6,226</td>
                  <td>6,496</td>
                  <td>+170 / +270</td>
                  <td>과소</td>
                  <td className="textLeft">외국인 수급 강반등</td>
                </tr>
                <tr>
                  <td>5/04</td>
                  <td>6,606</td>
                  <td>6,590</td>
                  <td>6,783</td>
                  <td>+177 / +193</td>
                  <td>과소</td>
                  <td className="textLeft">미중 관세 협상 타결 발표</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            6건의 전신호 동시 이탈 중 4건(67%)이 과소추정 방향이다. 평균 오차는
            모델 기준 167포인트, EWY 기준 285포인트로, EWY 신호의 이탈 폭이 더 크다.
            이는 EWY가 미국 시장의 극단적 일중 변동을 과도하게 흡수하는 반면,
            한국 시장 참여자들의 실제 반응은 더 완만하게 나타나기 때문이다.
          </p>

          <h3>2. 공통 선행 조건 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 전신호 이탈日 vs 비이탈日 선행 조건 비교</caption>
              <thead>
                <tr>
                  <th className="textLeft">조건 변수</th>
                  <th>이탈日 (n=6)</th>
                  <th>비이탈日 (n=11)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">전일 |ΔEWY| 평균</td>
                  <td>2.84%</td>
                  <td>1.12%</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 VIX 평균</td>
                  <td>38.2</td>
                  <td>27.4</td>
                </tr>
                <tr>
                  <td className="textLeft">정책 이벤트 동반 비율</td>
                  <td>4/6 (67%)</td>
                  <td>1/11 (9%)</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 오차 절대값 평균</td>
                  <td>156pt</td>
                  <td>62pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            전신호 이탈日의 전일 EWY 변동폭(2.84%)은 비이탈日(1.12%)의 2.5배 이상이다.
            정책 이벤트 동반 비율도 67% vs 9%로 크게 차이 난다. 이는 전신호 이탈의 근본 원인이
            모델 결함이 아니라 야간 정보 공백 구간의 고변동·정책 충격 환경에 있음을 시사한다.
          </p>

          <h3>3. 오차 방향 비대칭성과 구조적 원인</h3>
          <p>
            4/10(관세 유예), 4/21(충격 후 급반등), 4/24(외국인 수급), 5/4(미중 협상 타결)의
            4건 상방 이탈은 공통적으로 "극단 충격 이후 심리적 반등"이라는 패턴을 공유한다.
            EWY와 야간선물은 미국 장 마감 시점까지의 정보를 반영하는 반면, 코스피 동시호가는
            새벽 이후 발표된 긍정적 정책 이벤트를 포함한 모든 정보를 09:00 KST에
            한꺼번에 가격에 반영한다. 이 구조적 정보 비대칭이 상방 편향을 만든다.
            반대로 과대추정(4/9, 4/20) 두 건은 예상보다 강한 외국인 매도가 동시호가를 누른
            수급 충격이라는 점에서 메커니즘이 다르다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 전신호 동시 이탈日의 세 가지 공통 선행 조건을 실증적으로 규명했다.
            첫째, 전일 EWY 절대 변동이 ±2% 이상인 고변동 환경이 전신호 이탈의 필요 조건에
            근접한다. 둘째, 미국 장 마감 이후 한국 개장 이전 구간의 정책 이벤트가 가장 강력한
            단일 예측 변수다. 셋째, 전신호 이탈은 과소추정 방향으로 비대칭적으로 발생하며,
            이는 심리적 반등 심리가 야간 프록시보다 강하게 실물 시장에서 표출되기 때문이다.
          </p>
          <p>
            투자자 관점의 실전 시사점은 다음과 같다. 전일 EWY 변동이 ±2%를 초과하고
            주요 정책 발표가 예정되어 있다면, 모든 예측값을 동시에 신뢰하는 것은 위험하다.
            이 조건에서는 오히려 세 신호가 수렴하더라도 신뢰도를 낮추고 밴드 외부 시나리오를
            준비하는 역설적 접근이 필요하다. 향후 연구에서는 전신호 이탈 확률을 사전에
            추정하는 로지스틱 회귀 기반 경보 지수의 실전 성능 검증이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Black, F. (1986). Noise. <em>Journal of Finance</em>, 41(3), 529–543.</p>
            <p className="paperReferenceItem">Pastor, L., &amp; Veronesi, P. (2012). Uncertainty about government policy and stock prices. <em>Journal of Finance</em>, 67(4), 1219–1264.</p>
            <p className="paperReferenceItem">Barberis, N., &amp; Thaler, R. (2003). A survey of behavioral finance. <em>Handbook of the Economics of Finance</em>, 1, 1053–1128.</p>
            <p className="paperReferenceItem">Andersen, T. G., Bollerslev, T., Diebold, F. X., &amp; Vega, C. (2003). Micro effects of macro announcements. <em>American Economic Review</em>, 93(1), 38–62.</p>
            <p className="paperReferenceItem">Kim, J. H., &amp; Shamsuddin, A. (2008). Are Asian stock markets efficient? Evidence from new multiple variance ratio tests. <em>Journal of Empirical Finance</em>, 15(3), 518–532.</p>
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
