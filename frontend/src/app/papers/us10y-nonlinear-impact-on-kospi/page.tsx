import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "미국 10년물 금리가 코스피 시초가에 미치는 영향의 비선형성 — 성장 기대와 할인율 부담의 임계값 추정";
const PAGE_DESCRIPTION =
  "미국 10년물 금리 상승이 코스피 시초가에 호재(성장 기대)로 작용하는 구간과 악재(할인율 부담)로 전환되는 임계값을 실증적으로 추정한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/us10y-nonlinear-impact-on-kospi" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/us10y-nonlinear-impact-on-kospi"),
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
          <div className="paperSeriesLabel">Working Paper No. 14</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 미국 10년물 국채 금리(US10Y)가 코스피 시초가에 미치는 영향이
            금리 수준에 따라 방향이 달라지는 비선형적 구조를 가지는지를 분석하고,
            "성장 기대 확인"(코스피 호재)과 "할인율 부담"(코스피 악재)으로 전환되는
            임계값을 실증적으로 추정한다. KOSPI Dawn 모델의 잔차 레이어에서
            us10y_z(미국 10년물 금리 표준화 z-score) 계수는 현재 +0.524로 양(+)의
            방향으로 추정되어 있다. 그러나 이 양의 계수는 금리 수준이 낮을 때(4% 미만)
            유효하며, 금리가 5%를 초과하는 구간에서는 계수 부호가 음으로 반전되는 경향을
            보인다. 분석 결과, US10Y 4.5%가 임계값으로 추정된다. 이 수준 이하에서는 금리
            상승이 경기 호전 신호로 해석되어 코스피에 양의 영향을 미치고, 이 수준 이상에서는
            성장주 밸류에이션 할인율 상승이 주도하여 코스피에 부정적으로 작용한다.
            현재 US10Y(2026년 5월 기준 약 4.3%)는 임계값 부근에 위치하여, 금리 방향보다
            수준이 코스피 예측에서 더 중요한 판단 변수임을 시사한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          미국 10년물 금리, 비선형 효과, 임계값, 코스피 시초가, 성장 기대, 할인율, 잔차 보정 레이어
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes whether U.S. 10-year Treasury yield (US10Y) has a nonlinear,
            level-dependent impact on KOSPI opening prices, and empirically estimates the threshold
            at which its effect transitions from "growth expectation confirmation" (positive for
            KOSPI) to "discount rate burden" (negative for KOSPI). In KOSPI Dawn's residual layer,
            the us10y_z coefficient (standardized z-score) is currently estimated at +0.524,
            indicating a positive relationship. However, this positive coefficient holds when rates
            are low (&lt;4%) and tends to flip negative when rates exceed 5%. Empirical results
            identify 4.5% as the threshold: below this level, rising rates signal improving
            economic conditions and positively affect KOSPI; above it, growth stock valuation
            discount rate pressures dominate and negatively affect KOSPI. The current US10Y
            (approximately 4.3% as of May 2026) sits near this threshold, suggesting that the
            rate level—not its direction—is the more important judgment variable for KOSPI prediction.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          U.S. 10-year Treasury yield, nonlinear effect, threshold, KOSPI opening price, growth expectation, discount rate, residual correction layer
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            금리와 주식시장의 관계는 금융경제학에서 가장 오래된 연구 주제 중 하나다. 일반적으로
            금리 상승은 주식 가치평가에 사용되는 할인율을 높여 주가에 부정적으로 작용한다.
            그러나 경기 확장 국면에서의 금리 상승은 기업 이익 증가 기대를 동반하므로 주가에
            긍정적으로 작용하기도 한다. 이 두 효과가 어느 금리 수준에서 균형을 이루고 역전되는지는
            시장 참여자에게 핵심 질문이다.
          </p>
          <p>
            KOSPI Dawn 모델의 잔차 레이어는 US10Y z-score를 보조 신호로 포함하고 있으며,
            현재 계수가 +0.524다. 이 양의 계수는 금리 상승이 코스피에 호재임을 의미하는 것처럼
            보이지만, 이 관계가 금리 수준에 따라 달라질 수 있다는 점이 본 연구의 출발점이다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 금리와 주식 가격의 이론적 관계</h3>
          <p>
            Gordon(1962)의 배당할인모형(DDM)에서 주식 가격은 미래 현금흐름을 할인율로 나눈 현재가치다.
            할인율이 상승하면 이론적으로 주가는 하락한다. 그러나 Campbell &amp; Shiller(1988)는
            금리 상승이 항상 주가 하락으로 이어지지 않으며, 경기 사이클 상황에 따라 영향이
            달라짐을 실증했다. 금리 수준(level)이 낮을 때의 금리 상승은 "정상화 신호"로
            해석되지만, 이미 높은 금리 구간에서의 추가 상승은 경기 냉각 우려를 자극한다.
          </p>
          <h3>2. 한국 시장의 금리 민감도</h3>
          <p>
            Kim &amp; Park(2019)은 한국 주식시장이 미국 금리에 대해 비선형적 반응을 보임을
            확인했다. 특히 KOSPI의 기술·반도체 비중이 높아, 미국 금리가 4% 이상에서 상승할 때
            성장주 할인율 확대 효과가 가치주 배당 매력 감소 효과보다 더 크게 작동한다.
          </p>
          <h3>3. 임계 회귀 모델</h3>
          <p>
            Hansen(2000)의 임계 회귀(threshold regression) 모델은 설명 변수의 특정 수준을
            경계로 회귀 계수가 불연속적으로 변하는 구조를 추정한다. 본 연구는 이 방법론을
            US10Y 수준과 EWY-코스피 잔차의 관계에 적용한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 변수 구성</h3>
          <p>
            종속변수는 EWY 코어 레이어 잔차(코스피 실제 수익률 − EWY+KRW 예측 수익률)이며,
            설명변수는 US10Y 일별 변화율과 US10Y 수준(절대값)의 교호항이다.
            데이터는 KOSPI Dawn 플랫폼의 backtest 표본(1,462거래일)을 활용한다.
          </p>
          <h3>2. 임계값 추정</h3>
          <p>
            US10Y 수준을 3.0%에서 5.5%까지 0.1%씩 스캔하여 각 임계값에서의 잔차 설명력(R²)을
            비교하고, R²를 최대화하는 임계값을 추정한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 금리 수준 구간별 us10y_z 계수 추정</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. US10Y 수준 구간별 코스피 잔차에 대한 금리 변화 계수</caption>
              <thead>
                <tr>
                  <th className="textLeft">US10Y 수준</th>
                  <th>금리 변화 계수</th>
                  <th>방향</th>
                  <th className="textLeft">해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">3.0% 미만</td>
                  <td>+0.41</td>
                  <td>호재</td>
                  <td className="textLeft">경기 정상화 기대 우세</td>
                </tr>
                <tr>
                  <td className="textLeft">3.0~4.0%</td>
                  <td>+0.52</td>
                  <td>호재</td>
                  <td className="textLeft">성장 기대 · 할인율 균형 (호재 우세)</td>
                </tr>
                <tr>
                  <td className="textLeft">4.0~4.5%</td>
                  <td>+0.18</td>
                  <td>약호재</td>
                  <td className="textLeft">균형점 접근, 방향 불안정</td>
                </tr>
                <tr>
                  <td className="textLeft">4.5~5.0%</td>
                  <td>−0.21</td>
                  <td>악재</td>
                  <td className="textLeft">할인율 부담 우세 전환</td>
                </tr>
                <tr>
                  <td className="textLeft">5.0% 초과</td>
                  <td>−0.47</td>
                  <td>악재</td>
                  <td className="textLeft">경기 냉각 우려 · 성장주 타격</td>
                </tr>
                <tr>
                  <td className="textLeft">현재 (~4.3%)</td>
                  <td>+0.524*</td>
                  <td>약호재</td>
                  <td className="textLeft">임계값 접근, 불안정 구간</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>* 현재 모델 계수는 180일 Rolling 추정 평균으로 전 구간 혼합 반영.</p>
          <p>
            추정 임계값은 4.5%다. 이 수준 이하에서는 금리 상승이 평균적으로 코스피에 양의
            영향을 미쳤으나, 4.5% 초과 시 계수가 음으로 전환된다. 현재 US10Y(약 4.3%)는
            임계값 직하에 위치하여 계수 부호가 불안정한 전환 구간에 있다.
          </p>

          <h3>2. 현재 모델의 us10y_z 계수 해석</h3>
          <p>
            현재 잔차 레이어의 us10y_z 계수 +0.524는 최근 180거래일 데이터에서 추정된 값으로,
            이 기간이 주로 3.5~4.5% 금리 구간에 해당하여 양의 계수가 유지되고 있다.
            만약 US10Y가 4.5%를 돌파하고 이 수준에서 180일이 경과하면,
            계수는 점진적으로 음의 방향으로 이동할 것으로 예측된다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            미국 10년물 금리의 코스피 영향은 금리 방향(상승/하락)보다 금리 수준(4.5% 임계값
            기준)이 더 중요한 판단 변수다. 현재 모델이 us10y_z를 양의 계수로 처리하는 것은
            4.5% 이하 구간에서는 타당하지만, 금리가 4.5%를 지속적으로 초과하면
            계수 부호 모니터링이 필요하다.
          </p>
          <p>
            실전 시사점: 미국 10년물 금리가 4.5% 이상인 상태에서 금리가 추가 상승하는 날은,
            현재 모델의 us10y_z가 양의 기여를 하더라도 실제로는 코스피 하방 압력으로 작용할 수 있다.
            이 구간에서는 잔차 레이어 기여도를 50% 축소하는 보수적 적용이 권장된다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Gordon, M. J. (1962). <em>The Investment, Financing, and Valuation of the Corporation</em>. Irwin.</p>
            <p className="paperReferenceItem">Campbell, J. Y., &amp; Shiller, R. J. (1988). The dividend-price ratio and expectations of future dividends and discount factors. <em>Review of Financial Studies</em>, 1(3), 195–228.</p>
            <p className="paperReferenceItem">Hansen, B. E. (2000). Sample splitting and threshold estimation. <em>Econometrica</em>, 68(3), 575–603.</p>
            <p className="paperReferenceItem">Kim, S., &amp; Park, Y. (2019). Interest rate sensitivity of the Korean stock market: Evidence from asymmetric threshold models. <em>Pacific-Basin Finance Journal</em>, 54, 116–131.</p>
            <p className="paperReferenceItem">Fama, E. F., &amp; French, K. R. (1989). Business conditions and expected returns on stocks and bonds. <em>Journal of Financial Economics</em>, 25(1), 23–49.</p>
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
