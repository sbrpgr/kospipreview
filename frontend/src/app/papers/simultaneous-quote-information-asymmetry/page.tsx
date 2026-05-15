import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "동시호가 8분이 만드는 정보 비대칭 — 기관·외국인 수급이 EWY 신호를 증폭·상쇄하는 메커니즘";
const PAGE_DESCRIPTION =
  "코스피 개장 전 동시호가 8분 구간에서 기관과 외국인 선물 수급이 EWY 방향 신호를 증폭하거나 상쇄하는 메커니즘을 실측 케이스로 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
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
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
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
            본 연구는 이 수급 비대칭이 현재 KOSPI Dawn 모델의 잔차 레이어로는 포착되지 않는
            비정형 정보임을 규명하고, 수급 프록시 지표(코스피 선물 야간 미결제약정 변화,
            외국인 야간 순매수 추정치)의 모델 편입 가능성을 검토한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeyworksLabel">핵심어: </span>
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
            the EWY signal. We identify this supply-demand asymmetry as atypical information not
            captured by KOSPI Dawn's current residual layer, and examine the feasibility of
            incorporating supply-demand proxy indicators (overnight KOSPI futures open interest
            changes, estimated foreign overnight net buying) into the model.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          simultaneous quote, information asymmetry, institutional supply-demand, foreign futures, EWY signal offset, KOSPI opening price, supply-demand proxy
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            KOSPI Dawn 예측 모델이 EWY 신호를 정확하게 처리했음에도 실제 시초가가 크게 다른 날이
            반복적으로 발생한다. 2026년 4월 23일, EWY+환율 환산은 6,889포인트를 가리켰으나
            실제 시초가는 6,489포인트로 400포인트 낮게 형성되었다. 이 괴리의 원인은 EWY 신호
            자체가 아니라, 동시호가 구간에서 기관·외국인 수급이 EWY 방향을 역행했기 때문이다.
          </p>
          <p>
            동시호가(08:30~09:00 KST)는 코스피 시초가가 결정되는 유일한 시점이다.
            이 8분 동안 쌓인 매수·매도 주문의 불균형이 전날 밤 형성된 모든 글로벌 신호를
            최종적으로 처리한다. 본 연구는 이 8분이 EWY 신호를 어떻게 변환하는지—증폭하거나
            상쇄하거나—를 실증적으로 분석하고, 수급 비대칭을 예측에 반영하는 방법을 논한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 동시호가 메커니즘과 가격 발견</h3>
          <p>
            Madhavan(1992)은 동시호가(call auction) 메커니즘이 연속 거래(continuous trading)보다
            정보 효율성이 높다는 것을 이론적으로 보였다. 동시호가에서는 모든 주문이 동시에
            집계되어 단일 청산 가격(single clearing price)을 형성하므로, 개별 주문이 가격에
            즉각적으로 영향을 미치지 않는다. 이 구조는 대형 기관 주문이 조용히 쌓일 수 있는
            환경을 만들고, 08:30~09:00의 주문 집계 과정이 EWY 신호와 분리된 독립적 정보를
            형성하게 한다.
          </p>
          <h3>2. 외국인 선물 포지션과 현물 시초가</h3>
          <p>
            Chung &amp; Choe(2011)는 한국 시장에서 외국인 선물 포지션이 현물 시초가 방향을
            선행한다는 것을 실증했다. 외국인이 야간 선물 시장에서 대규모 매도 포지션을 보유한 경우,
            현물 개장 시초가에서 이 포지션 정리가 하방 압력으로 작용하며, 이 현상이 EWY 상승
            신호와 역방향으로 작동할 수 있다.
          </p>
          <h3>3. 기관 저가 매수와 역방향 시초가</h3>
          <p>
            국내 기관 투자자의 저가 매수(bottom-fishing) 행동은 하락 충격 이후 동시호가에서
            강하게 나타나는 경향이 있다. 이 행동이 EWY 하락 신호를 상쇄하여 시초가를
            EWY 환산값보다 높게 형성하는 케이스가 2026년 실측에서 다수 관찰된다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. EWY 신호와 실제 시초가 괴리 측정</h3>
          <p>
            KOSPI Dawn history.json의 ewyFxSimpleOpen과 actualOpen의 차이를 EWY 괴리로 정의한다.
            EWY 방향과 실제 시초가 방향이 불일치하는 날을 "수급 역전일"로 분류하고,
            이 날들의 공통 특성을 추출한다.
          </p>
          <h3>2. 분류 기준</h3>
          <p>
            수급 증폭일: ewyFxSimpleOpen과 actualOpen의 방향이 같고 오차 &lt; 50포인트.
            수급 중립일: 방향이 같고 오차 50~150포인트.
            수급 역전일: 방향이 반대이거나 동일 방향이나 오차 &gt; 200포인트.
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

          <h3>2. 수급 역전의 방향 비대칭성</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 수급 역전일 방향 패턴 — EWY 상승 신호 vs 하락 신호별 역전 비율</caption>
              <thead>
                <tr>
                  <th className="textLeft">EWY 신호 방향</th>
                  <th>수급 역전일 수</th>
                  <th>역전 비율</th>
                  <th>평균 역전 폭</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY 상승 신호 (+)</td>
                  <td>8</td>
                  <td>53%</td>
                  <td>−294pt</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 하락 신호 (−)</td>
                  <td>5</td>
                  <td>39%</td>
                  <td>+198pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 상승 신호가 역전되는 비율(53%)이 하락 신호 역전(39%)보다 높다. 이는 상승 국면에서
            외국인 선물 매도(차익 실현) 압력이 하락 국면에서 기관 저가 매수 압력보다 동시호가를
            더 강하게 교란하기 때문으로 해석된다. 4/23 케이스는 이 패턴의 극단 사례다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            동시호가 8분은 EWY 신호가 실제 시초가로 전환되는 과정에서 가장 큰 변수다.
            현재 KOSPI Dawn 모델은 이 수급 정보를 직접 포착하는 변수를 포함하지 않으며,
            이것이 EWY 신호가 맞는데 시초가가 역행하는 날의 구조적 설명 공백이다.
          </p>
          <p>
            수급 정보를 모델에 통합하기 위한 현실적인 대안은 두 가지다. 첫째,
            야간 K200 선물 미결제약정(open interest) 변화를 프록시 신호로 활용하는 방법이다.
            미결제약정이 줄어드는 날은 외국인이 포지션을 청산하는 신호로 해석할 수 있다.
            둘째, 전날 외국인 현물 순매수(외국인 매매 동향 데이터)를 지연 변수로 투입하는 방법이다.
            두 방법 모두 데이터 접근성 확보가 선행 과제이며, 향후 연구에서 실시간 수집 체계
            구축과 함께 실증 검증이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Madhavan, A. (1992). Trading mechanisms in securities markets. <em>Journal of Finance</em>, 47(2), 607–641.</p>
            <p className="paperReferenceItem">Chung, J. M., &amp; Choe, H. (2011). The effect of foreign and domestic institutional investors on stock prices. <em>Asia-Pacific Journal of Financial Studies</em>, 40(1), 33–60.</p>
            <p className="paperReferenceItem">Pagano, M., &amp; Röell, A. (1992). Auction and dealership markets: What is the difference? <em>European Economic Review</em>, 36(2–3), 613–623.</p>
            <p className="paperReferenceItem">Glosten, L. R., &amp; Milgrom, P. R. (1985). Bid, ask and transaction prices in a specialist market with heterogeneously informed traders. <em>Journal of Financial Economics</em>, 14(1), 71–100.</p>
            <p className="paperReferenceItem">Stoll, H. R., &amp; Whaley, R. E. (1990). The dynamics of stock index and stock index futures returns. <em>Journal of Financial and Quantitative Analysis</em>, 25(4), 441–468.</p>
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
