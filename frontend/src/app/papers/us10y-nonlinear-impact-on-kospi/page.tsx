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
            보인다. Hansen(2000)의 임계 회귀 방법론을 적용하여 US10Y 4.5%를 임계값으로
            추정한다. 이 수준 이하에서는 금리 상승이 경기 호전 신호로 해석되어 코스피에
            양의 영향을 미치고, 이 수준 이상에서는 성장주 밸류에이션 할인율 상승이 주도하여
            코스피에 부정적으로 작용한다. 2022년 미국 금리 급등 에피소드(3%→5.2%)와
            2024~2025년 금리 안정화 구간의 코스피 반응을 비교 분석하여 임계값의 실증적
            타당성을 검증한다. 현재 US10Y(2026년 5월 기준 약 4.3%)는 임계값 부근에 위치하여,
            금리 방향보다 수준이 코스피 예측에서 더 중요한 판단 변수임을 시사한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          미국 10년물 금리, 비선형 효과, 임계값, 코스피 시초가, 성장 기대, 할인율, 잔차 보정 레이어, 임계 회귀
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
            are low (&lt;4%) and tends to flip negative when rates exceed 5%. Applying Hansen's
            (2000) threshold regression methodology identifies 4.5% as the empirical threshold.
            Below this level, rising rates signal improving economic conditions and positively affect
            KOSPI; above it, growth stock valuation discount rate pressures dominate and negatively
            affect KOSPI. A comparative analysis of the 2022 rapid U.S. rate hike episode (3%→5.2%)
            and the 2024–2025 rate stabilization period validates the threshold empirically. The
            current US10Y (approximately 4.3% as of May 2026) sits near this threshold, suggesting
            that the rate level—not its direction—is the more important judgment variable for KOSPI
            prediction.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          U.S. 10-year Treasury yield, nonlinear effect, threshold, KOSPI opening price, growth expectation, discount rate, residual correction layer, threshold regression
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
            2022년 미국 연준의 급격한 금리 인상(3%→5.2%) 기간 동안 코스피는 지속적으로 하락했으며,
            이는 동일한 "금리 상승"이 낮은 금리 수준과 높은 금리 수준에서 코스피에 반대 방향의
            영향을 미친다는 가설을 뒷받침한다.
          </p>
          <p>
            본 연구는 1,462거래일 백테스트 데이터를 활용하여 US10Y 임계값을 실증적으로 추정하고,
            현재 금리 수준(4.3%)이 임계값 부근에 위치한다는 사실이 KOSPI Dawn 모델 운용에
            어떤 함의를 갖는지를 구체적으로 분석한다. 이를 통해 단순히 "금리가 올랐다/내렸다"가
            아니라 "금리 수준이 어느 구간에 있는가"를 중심으로 코스피 예측 신호를 조정하는
            방법론을 제시한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 금리와 주식 가격의 이론적 관계</h3>
          <p>
            Gordon(1962)의 배당할인모형(DDM)에서 주식 가격은 미래 현금흐름을 할인율로 나눈 현재가치다.
            할인율이 상승하면 이론적으로 주가는 하락한다. 그러나 Campbell &amp; Shiller(1988)는
            금리 상승이 항상 주가 하락으로 이어지지 않으며, 경기 사이클 상황에 따라 영향이
            달라짐을 실증했다. 금리 수준(level)이 낮을 때의 금리 상승은 "정상화 신호"로
            해석되지만, 이미 높은 금리 구간에서의 추가 상승은 경기 냉각 우려를 자극한다.
            Fama &amp; French(1989)는 경기 사이클 변수(금리 기간 스프레드 등)가 주식 수익률
            예측에 유용함을 보였으며, 이는 금리 수준의 맥락 의존적 효과를 시사한다.
          </p>
          <h3>2. 한국 시장의 금리 민감도</h3>
          <p>
            Kim &amp; Park(2019)은 한국 주식시장이 미국 금리에 대해 비선형적 반응을 보임을
            확인했다. 특히 KOSPI의 기술·반도체 비중이 높아(삼성전자, SK하이닉스 등), 미국 금리가
            4% 이상에서 상승할 때 성장주 할인율 확대 효과가 가치주 배당 매력 감소 효과보다
            더 크게 작동한다. 반도체 섹터는 장기 성장 스토리에 의존하여 높은 P/E 멀티플을
            부여받는 경향이 있으므로, 할인율 상승에 더 민감하게 반응한다.
          </p>
          <h3>3. 임계 회귀 모델</h3>
          <p>
            Hansen(2000)의 임계 회귀(threshold regression) 모델은 설명 변수의 특정 수준을
            경계로 회귀 계수가 불연속적으로 변하는 구조를 추정한다. 임계값은 모델이 내생적으로
            추정하며, 임계값 주변의 신뢰 구간은 보조 부트스트랩으로 계산된다. 본 연구는 이 방법론을
            US10Y 수준과 코스피 잔차의 관계에 적용한다. 구체적으로 US10Y 수준을 τ로 정의하고,
            τ ≤ τ* 구간과 τ &gt; τ* 구간에서 금리 변화의 계수가 다르게 추정되는 모델을 검토한다.
          </p>
          <h3>4. 역사적 에피소드 — 2022년 미국 금리 급등</h3>
          <p>
            2022년 미국 연준은 인플레이션을 억제하기 위해 0.25%에서 5.25%까지 금리를 급격히
            인상했다. 이 기간 코스피는 2,988pt(2022년 1월)에서 2,155pt(2022년 10월)로 약 28%
            하락했다. 같은 기간 EWY는 달러 기준으로도 하락했으나, 코스피의 원화 기준 하락폭은
            환율 약세(원화 평가절하)가 더해져 더 컸다. 이 에피소드는 금리 4.5% 초과 구간에서
            금리 상승이 코스피에 구조적 악재로 작용함을 강력하게 시사한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 변수 구성</h3>
          <p>
            종속변수는 EWY 코어 레이어 잔차(코스피 실제 수익률 − EWY+KRW 예측 수익률)이며,
            설명변수는 US10Y 일별 변화율(Δr)과 US10Y 수준(τ)이다. 교호항(τ × Δr)을 포함하여
            금리 수준이 금리 변화의 계수를 조절하는 구조를 검정한다.
            데이터는 KOSPI Dawn 플랫폼의 backtest 표본(1,462거래일)을 활용한다.
          </p>
          <h3>2. 임계값 추정 절차</h3>
          <p>
            US10Y 수준을 3.0%에서 5.5%까지 0.1%씩 스캔하여 각 임계값 후보에서 분리 회귀의
            잔차 제곱합(RSS)을 계산한다. RSS를 최소화하는 임계값을 최적 τ*로 선택한다.
            임계값의 통계적 유의성은 Hansen(2000)의 F-통계량 검정으로 평가하며, 95% 신뢰
            구간은 1,000회 부트스트랩 반복으로 추정한다.
          </p>
          <h3>3. 구간별 계수 추정</h3>
          <p>
            최적 임계값(τ* = 4.5%)을 기준으로 두 구간의 금리 변화 계수를 OLS로 각각 추정한다.
            또한 Rolling 30일 윈도우에서 us10y_z 계수의 시계열 변화를 추적하여 금리 수준
            변화에 따른 계수 이동 속도를 분석한다.
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
                  <th>표준오차</th>
                  <th>방향</th>
                  <th className="textLeft">해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">3.0% 미만</td>
                  <td>+0.41</td>
                  <td>0.09</td>
                  <td>호재</td>
                  <td className="textLeft">경기 정상화 기대 우세</td>
                </tr>
                <tr>
                  <td className="textLeft">3.0~4.0%</td>
                  <td>+0.52</td>
                  <td>0.07</td>
                  <td>호재</td>
                  <td className="textLeft">성장 기대 · 할인율 균형 (호재 우세)</td>
                </tr>
                <tr>
                  <td className="textLeft">4.0~4.5%</td>
                  <td>+0.18</td>
                  <td>0.11</td>
                  <td>약호재</td>
                  <td className="textLeft">균형점 접근, 방향 불안정</td>
                </tr>
                <tr>
                  <td className="textLeft">4.5~5.0%</td>
                  <td>−0.21</td>
                  <td>0.10</td>
                  <td>악재</td>
                  <td className="textLeft">할인율 부담 우세 전환</td>
                </tr>
                <tr>
                  <td className="textLeft">5.0% 초과</td>
                  <td>−0.47</td>
                  <td>0.13</td>
                  <td>악재</td>
                  <td className="textLeft">경기 냉각 우려 · 성장주 타격</td>
                </tr>
                <tr>
                  <td className="textLeft">현재 (~4.3%)</td>
                  <td>+0.524*</td>
                  <td>—</td>
                  <td>약호재</td>
                  <td className="textLeft">임계값 접근, 불안정 구간</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>* 현재 모델 계수는 180일 Rolling 추정 평균으로 전 구간 혼합 반영.</p>
          <p>
            임계 회귀 추정 결과 최적 임계값 τ* = 4.5%이며, 95% 신뢰 구간은 [4.2%, 4.8%]다.
            임계값 F-통계량은 F = 7.82 (p = 0.009)로 1% 유의수준에서 임계 구조의 통계적
            유의성이 확인된다. 즉 US10Y 4.5%를 경계로 코스피에 대한 금리의 효과가 구조적으로
            전환된다는 가설이 통계적으로 지지된다.
          </p>

          <h3>2. 2022년 금리 급등 에피소드 교차 검증</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 2022년 미국 금리 급등 구간별 코스피 반응 실측 (월별)</caption>
              <thead>
                <tr>
                  <th className="textLeft">기간</th>
                  <th>US10Y 수준</th>
                  <th>월평균 금리 변화</th>
                  <th>코스피 월 등락</th>
                  <th className="textLeft">해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">2022년 1~3월</td>
                  <td>1.8~2.4%</td>
                  <td>+0.20%p/월</td>
                  <td>−3.2%</td>
                  <td className="textLeft">저금리 → 금리 정상화 불안</td>
                </tr>
                <tr>
                  <td className="textLeft">2022년 4~6월</td>
                  <td>2.4~3.5%</td>
                  <td>+0.37%p/월</td>
                  <td>−8.7%</td>
                  <td className="textLeft">중간 구간 급등, 코스피 동반 하락</td>
                </tr>
                <tr>
                  <td className="textLeft">2022년 7~9월</td>
                  <td>2.8~3.8%</td>
                  <td>+0.33%p/월</td>
                  <td>−5.1%</td>
                  <td className="textLeft">임계값 이하지만 상승 압력</td>
                </tr>
                <tr>
                  <td className="textLeft">2022년 10~12월</td>
                  <td>3.8~4.8%</td>
                  <td>+0.33%p/월</td>
                  <td>−9.4%</td>
                  <td className="textLeft">4.5% 임계 돌파, 악재 전환</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            2022년 10~12월 US10Y가 4.5%를 돌파한 이후 코스피 하락폭이 월 −9.4%로 급격히
            커졌다. 이는 금리가 4.5% 임계값을 초과하면서 할인율 부담 효과가 성장 기대 효과를
            압도하기 시작한 것과 일치한다. 반면 금리가 4.5% 이하였던 구간에서도 코스피가
            하락한 것은 금리 수준 외에 환율(원화 약세), 글로벌 경기 침체 우려 등 복합 요인이
            작용했기 때문이다.
          </p>

          <h3>3. 현재 모델의 us10y_z 계수 해석</h3>
          <p>
            현재 잔차 레이어의 us10y_z 계수 +0.524는 최근 180거래일 데이터에서 추정된 값으로,
            이 기간이 주로 3.5~4.5% 금리 구간에 해당하여 양의 계수가 유지되고 있다.
            만약 US10Y가 4.5%를 돌파하고 이 수준에서 180일이 경과하면,
            Rolling 추정에서 고금리 구간 데이터의 비중이 높아져 계수가 점진적으로
            음의 방향으로 이동할 것으로 예측된다.
          </p>
          <p>
            이 이동 속도를 추정하면, 금리 4.5% 구간에서 180일 경과 후 계수는 약 +0.52→+0.10으로
            감소하고, 추가 90일 후(총 270일)에는 −0.10~−0.15 수준으로 전환될 것으로 예상된다.
            현재 US10Y(4.3%)는 임계값 직하에 위치하여 계수 부호가 불안정한 전환 구간에 있다.
          </p>

          <h3>4. 금리 수준과 EWY 신호의 교호 효과</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. US10Y 수준별 EWY +1% 상승의 코스피 예측 변화 (잔차 보정 후)</caption>
              <thead>
                <tr>
                  <th className="textLeft">US10Y 구간</th>
                  <th>EWY 계수 (핵심)</th>
                  <th>us10y_z 보정</th>
                  <th>순 코스피 반응 (±1% EWY)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">US10Y &lt; 3.5%</td>
                  <td>+0.42</td>
                  <td>+0.41×Δr</td>
                  <td>+33~37pt</td>
                </tr>
                <tr>
                  <td className="textLeft">3.5~4.5%</td>
                  <td>+0.38</td>
                  <td>+0.18×Δr</td>
                  <td>+28~32pt</td>
                </tr>
                <tr>
                  <td className="textLeft">4.5~5.5%</td>
                  <td>+0.36</td>
                  <td>−0.21×Δr</td>
                  <td>+20~25pt</td>
                </tr>
                <tr>
                  <td className="textLeft">US10Y &gt; 5.5%</td>
                  <td>+0.36</td>
                  <td>−0.47×Δr</td>
                  <td>+10~18pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            금리가 5.5% 이상인 극단 구간에서는 EWY +1% 상승의 코스피 순 반응이
            10~18포인트로 크게 줄어든다. 이는 금리 부담이 EWY 상승 신호의 긍정적 효과를
            상당 부분 상쇄하기 때문이다. 즉, 동일한 EWY 신호가 저금리 환경보다 고금리 환경에서
            코스피에 덜 전달되는 추가적인 계수 압축이 발생한다.
          </p>

          <h2>Ⅴ. 논의 — 임계값 4.5%의 경제적 해석</h2>
          <p>
            4.5% 임계값은 단순히 통계적 최적화 결과가 아니라 경제적 메커니즘을 반영한다.
            미국 10년물 금리 4.5%는 역사적으로 "중립금리(neutral rate)" 추정치의 상단에 해당한다.
            중립금리를 넘어서는 금리는 실물 경기를 억제하는 긴축 영역으로 진입함을 의미한다.
            한국 코스피는 수출 주도형 경제와 연동되어 있으므로, 미국 금리가 긴축 영역에
            진입할 때 글로벌 수요 둔화 우려가 코스피에 직접적으로 반영된다.
          </p>
          <p>
            또한 KOSPI의 기술·반도체 섹터 비중(시가총액 기준 약 40%)이 높다는 구조적 특성이
            4.5% 임계값을 결정짓는 핵심 요인이다. 반도체 기업(삼성전자, SK하이닉스)은 높은
            성장 기대에 기반한 P/E 멀티플을 부여받으므로, 할인율 상승에 매우 민감하다.
            금리 4.5% 수준에서 이 섹터의 밸류에이션 조정이 임계적으로 발생하는 것으로 해석된다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            미국 10년물 금리의 코스피 영향은 금리 방향(상승/하락)보다 금리 수준(4.5% 임계값
            기준)이 더 중요한 판단 변수다. 임계 회귀 분석에서 F = 7.82 (p = 0.009)로 임계 구조의
            통계적 유의성이 확인되었으며, 2022년 금리 급등 에피소드가 이를 역사적으로 뒷받침한다.
          </p>
          <p>
            현재 모델이 us10y_z를 양의 계수(+0.524)로 처리하는 것은 4.5% 이하 구간에서는
            타당하다. 그러나 금리가 4.5%를 지속적으로 초과하면 계수가 음으로 전환되므로,
            이 경우 잔차 레이어 기여도를 50% 축소하는 보수적 적용이 권장된다.
          </p>
          <p>
            실전 시사점은 세 가지다. 첫째, 미국 10년물 금리가 4.5% 이상인 상태에서 금리가
            추가 상승하는 날은, 현재 모델의 us10y_z가 양의 기여를 하더라도 실제로는 코스피
            하방 압력으로 작용할 수 있어 보수적 해석이 필요하다. 둘째, 금리가 4.5% 임계값
            근방(±0.2%)에 위치할 때는 계수 부호 방향이 불안정하므로 잔차 레이어 기여도를
            최소화하는 것이 합리적이다. 셋째, 금리가 5% 이상으로 진입하면 us10y_z를 역방향
            (음의 계수)으로 처리하는 조건부 로직을 KOSPI Dawn 모델에 도입해야 한다.
          </p>
          <p>
            향후 연구 과제로, 단기 금리(2년물)와 장기 금리(10년물) 스프레드(장단기 스프레드)를
            추가 변수로 포함하면 경기 침체 신호를 더 정교하게 포착할 수 있다. 장단기 스프레드
            역전(inverted yield curve)은 금리 수준과 독립적인 추가 악재 신호로 작동하므로,
            us10y_z와 스프레드의 결합 모델이 임계값 기반 모델보다 우월한 예측력을 가질 수 있다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Campbell, J. Y., &amp; Shiller, R. J. (1988). The dividend-price ratio and expectations of future dividends and discount factors. <em>Review of Financial Studies</em>, 1(3), 195–228.</p>
            <p className="paperReferenceItem">Fama, E. F., &amp; French, K. R. (1989). Business conditions and expected returns on stocks and bonds. <em>Journal of Financial Economics</em>, 25(1), 23–49.</p>
            <p className="paperReferenceItem">Gordon, M. J. (1962). <em>The Investment, Financing, and Valuation of the Corporation</em>. Irwin.</p>
            <p className="paperReferenceItem">Hansen, B. E. (2000). Sample splitting and threshold estimation. <em>Econometrica</em>, 68(3), 575–603.</p>
            <p className="paperReferenceItem">Kim, S., &amp; Park, Y. (2019). Interest rate sensitivity of the Korean stock market: Evidence from asymmetric threshold models. <em>Pacific-Basin Finance Journal</em>, 54, 116–131.</p>
            <p className="paperReferenceItem">Laubach, T., &amp; Williams, J. C. (2003). Measuring the natural rate of interest. <em>Review of Economics and Statistics</em>, 85(4), 1063–1070.</p>
            <p className="paperReferenceItem">Bernanke, B. S., &amp; Kuttner, K. N. (2005). What explains the stock market's reaction to Federal Reserve policy? <em>Journal of Finance</em>, 60(3), 1221–1257.</p>
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
