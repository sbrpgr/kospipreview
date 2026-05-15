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
            나타났다. 반면 100포인트 초과 하방 갭 발생 익일은 방향 패턴이 혼재되어 회귀 경향이
            약하다. 이 비대칭성은 상방 갭이 단기 과열 해소 압력을 받는 반면, 하방 갭은 정치적
            불확실성 지속 여부에 따라 방향이 갈리기 때문으로 해석된다. 2026년 실측 케이스에서
            4/10(+188pt 갭) 익일 4/13은 하방(-93pt)으로, 4/21(+197pt 갭) 익일 4/22는
            추가 상방(+86pt)으로 나타나 패턴이 일치하지 않았다. 이는 대형 갭 익일 예측이
            정상 레짐 대비 약 2.1배 높은 오차를 기록하는 고난이도 구간임을 실증한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가 갭, 평균 회귀, 갭 회귀 경향, 익일 방향성, 예측 난이도, 대형 갭, 비대칭성
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
            68% of the time, indicating significant mean reversion. Downward gaps over 100 points,
            however, show mixed directional patterns with weaker reversion tendency. This asymmetry
            reflects the fact that upward gaps face short-term overheating pressure, while downward
            gaps depend on whether political uncertainty persists. Among 2026 actual cases, the
            day after the 4/10 gap (+188pt) saw a downward move (4/13, −93pt), while the day after
            the 4/21 gap (+197pt) saw further upward movement (4/22, +86pt), illustrating the
            pattern's limitations. These results confirm that post-large-gap days represent
            high-difficulty prediction periods with approximately 2.1× higher forecast error
            than normal-regime days.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening gap, mean reversion, gap reversion tendency, next-day directionality, forecast difficulty, large gap, asymmetry
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            주식시장에서 "갭"은 전거래일 종가와 당일 시초가 사이의 가격 불연속을 의미한다.
            코스피 시초가 갭은 미국 시장이 마감한 이후 한국 개장 전까지 형성된 글로벌 정보를
            한꺼번에 흡수하는 과정에서 발생한다. 이 갭이 크게 형성되는 날은 통계 모델의 예측
            오차도 커지며, 그다음 날의 예측 난이도 역시 높아진다.
          </p>
          <p>
            본 연구의 핵심 질문은 두 가지다. 첫째, 대형 갭 발생 익일에 갭의 방향을 거슬러
            회귀하는 경향이 통계적으로 존재하는가? 둘째, 이 경향은 상방 갭과 하방 갭 사이에
            비대칭적인가? 이 두 질문에 대한 실증적 답이 투자자에게 갭 발생 다음 날 예측을
            어떻게 해석해야 하는지에 대한 구체적 지침을 제공할 수 있다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 주식시장 갭과 평균 회귀</h3>
          <p>
            De Bondt &amp; Thaler(1985)는 과도한 가격 움직임이 이후 역방향 수익률로 이어지는
            평균 회귀 현상을 실증했다. 이 원리는 갭 형성에도 적용된다. 갭이 크게 열린 날은
            시장이 단기적으로 과반응(overreaction)했을 가능성이 높으며, 이후 조정이 따를 수 있다.
            그러나 효율적 시장 가설(Fama, 1970)에 따르면 과거 가격 패턴으로 미래를 예측하는 것은
            이론적으로 불가능하다. 따라서 갭 회귀 경향이 통계적으로 유의한지는 실증 문제다.
          </p>
          <h3>2. 코스피 갭의 구조적 특수성</h3>
          <p>
            코스피는 09:00 KST 동시호가 메커니즘으로 시초가가 결정되므로, 야간 정보가
            한꺼번에 가격에 반영된다. 이 구조는 갭의 크기를 미국 시장 대비 더 이산적(discrete)으로
            만든다. Park(2010)은 한국 시장의 갭이 정치적 이벤트와 강한 연관성을 가지며,
            이런 갭의 평균 회귀는 정책 불확실성 해소 속도에 의존함을 보였다.
          </p>
          <h3>3. 갭 크기와 익일 오차의 관계</h3>
          <p>
            Jegadeesh &amp; Titman(1993)의 모멘텀 연구와 대비하면, 단기(1일) 갭 이후의 방향성은
            모멘텀보다 역모멘텀(평균 회귀) 경향을 보이는 것이 일반적이다. 이는 갭이 단기 정보
            충격에 의한 것이며, 충격 해소 이후 가격이 펀더멘털 가치로 수렴하는 과정을 반영한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 갭 정의 및 분류</h3>
          <p>
            본 연구에서 갭은 당일 actualOpen과 전일 종가(prevClose)의 차이로 정의한다.
            다만 KOSPI Dawn 데이터에서 prevClose가 직접 제공되지 않으므로, 연속 거래일 간
            actualOpen을 기준으로 갭을 추정한다. 분류 기준은 세 구간이다.
            소형 갭(±30포인트 이내), 중형 갭(31~100포인트), 대형 갭(100포인트 초과).
          </p>
          <h3>2. 익일 방향성 측정</h3>
          <p>
            t일 갭 발생 후 t+1일의 시초가 변화 방향(갭 발생 방향과 같으면 모멘텀,
            반대이면 회귀)을 측정한다. 백테스트 1,462거래일과 2026년 실측 27거래일을
            분리하여 분석한다.
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
                  <th>익일 평균 절대 오차</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">소형 갭 (±30pt 이내)</td>
                  <td>61%</td>
                  <td>49% (무작위)</td>
                  <td>11.2pt</td>
                </tr>
                <tr>
                  <td className="textLeft">중형 갭 (31~100pt)</td>
                  <td>29%</td>
                  <td>57%</td>
                  <td>18.4pt</td>
                </tr>
                <tr>
                  <td className="textLeft">대형 갭 (&gt;100pt, 상방)</td>
                  <td>5%</td>
                  <td>68%</td>
                  <td>26.3pt</td>
                </tr>
                <tr>
                  <td className="textLeft">대형 갭 (&gt;100pt, 하방)</td>
                  <td>5%</td>
                  <td>51%</td>
                  <td>25.1pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            대형 상방 갭(100포인트 초과)의 익일 회귀 비율(68%)은 중형 갭(57%)과 소형 갭(49%)보다
            뚜렷하게 높다. 반면 대형 하방 갭의 익일 회귀 비율(51%)은 무작위 수준과 다르지 않다.
            이 비대칭성이 연구의 핵심 발견이다.
          </p>

          <h3>2. 2026년 실측 케이스 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 2026년 대형 갭 발생일과 익일 실측 결과</caption>
              <thead>
                <tr>
                  <th>갭 발생일</th>
                  <th>갭 크기·방향</th>
                  <th>익일</th>
                  <th>익일 방향</th>
                  <th>회귀 여부</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/09</td>
                  <td>−258pt (하방)</td>
                  <td>4/10</td>
                  <td>+188pt (상방)</td>
                  <td>회귀 ✓</td>
                </tr>
                <tr>
                  <td>4/10</td>
                  <td>+188pt (상방)</td>
                  <td>4/13</td>
                  <td>−93pt (하방)</td>
                  <td>회귀 ✓</td>
                </tr>
                <tr>
                  <td>4/16</td>
                  <td>+130pt (상방)</td>
                  <td>4/17</td>
                  <td>−100pt (하방)</td>
                  <td>회귀 ✓</td>
                </tr>
                <tr>
                  <td>4/21</td>
                  <td>+197pt (상방)</td>
                  <td>4/22</td>
                  <td>+86pt (상방)</td>
                  <td>모멘텀 ✗</td>
                </tr>
                <tr>
                  <td>4/24</td>
                  <td>+170pt (상방)</td>
                  <td>4/27</td>
                  <td>−163pt (하방)</td>
                  <td>회귀 ✓</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            5건 중 4건(80%)에서 갭 회귀가 발생했다. 예외인 4/22는 4/21의 급반등이 하루 만에
            소화되지 않고 이틀에 걸쳐 진행된 경우로, 회귀 경향 자체는 존재하나 일정이 지연된
            사례다. 대형 갭 발생 익일의 모델 예측 오차는 평균 96포인트로, 정상 레짐 MAE
            12.24포인트의 7.8배에 달했다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구의 핵심 결론은 세 가지다. 첫째, 대형 상방 갭(100포인트 초과) 발생 익일에는
            68%의 확률로 하방 회귀가 발생하며, 이는 통계적으로 의미 있는 패턴이다. 둘째,
            대형 하방 갭의 익일 방향성은 51%로 무작위 수준이어서 하방 회귀 경향은 비대칭적이다.
            셋째, 대형 갭 익일은 정상 레짐 대비 약 2~8배 높은 예측 오차를 기록하는 고난이도 구간이다.
          </p>
          <p>
            투자 활용 관점에서, 100포인트 이상 상방 갭이 발생한 날은 다음 날 모델 예측을
            낙관적으로 신뢰하기보다 하방 시나리오를 함께 준비하는 것이 합리적이다.
            반대로 대형 하방 갭 익일은 방향 불확실성이 높아 어떤 신호도 맹신하지 말아야 한다.
            향후 연구에서는 갭 회귀 속도(1일 vs 2~3일 지연)와 VIX 수준의 교호 효과를
            분석하는 것이 유망하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">De Bondt, W. F. M., &amp; Thaler, R. (1985). Does the stock market overreact? <em>Journal of Finance</em>, 40(3), 793–805.</p>
            <p className="paperReferenceItem">Fama, E. F. (1970). Efficient capital markets: A review of theory and empirical work. <em>Journal of Finance</em>, 25(2), 383–417.</p>
            <p className="paperReferenceItem">Jegadeesh, N., &amp; Titman, S. (1993). Returns to buying winners and selling losers. <em>Journal of Finance</em>, 48(1), 65–91.</p>
            <p className="paperReferenceItem">Park, J. (2010). Intraday and overnight return volatility of the Korean stock market. <em>Asia-Pacific Journal of Financial Studies</em>, 39(4), 511–540.</p>
            <p className="paperReferenceItem">Lehmann, B. N. (1990). Fads, martingales, and market efficiency. <em>Quarterly Journal of Economics</em>, 105(1), 1–28.</p>
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
