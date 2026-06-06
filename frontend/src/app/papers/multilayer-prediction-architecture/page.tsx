import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "코스피 시초가 예측 모델의 계층적 설계 체계 — EWY Synthetic K200 Ridge 아키텍처의 구조와 설계 원리";
const PAGE_DESCRIPTION =
  "코스피 시초가 예측을 위한 4계층 모델 아키텍처의 설계 원리와 각 레이어의 기여 구조를 실증 데이터와 함께 체계적으로 기술한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/multilayer-prediction-architecture" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/multilayer-prediction-architecture"),
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
          <div className="paperSeriesLabel">Working Paper No. 7</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피프리뷰 플랫폼에서 코스피 시초가를 예측하기 위해 구축된
            EWY Synthetic K200 Ridge 아키텍처의 설계 원리, 각 레이어의 구조와 기여도,
            그리고 레이어 간 상호작용 메커니즘을 체계적으로 기술한다. 이 모델은 단일 회귀가 아닌
            4개 계층으로 구성된다. 제1계층(Core EWY+FX)은 EWY 로그수익률(계수 0.364)과
            달러-원 환율(계수 0.200)을 기반으로 Rolling Ridge 회귀를 통해 합성 K200 수익률을
            추정하며, R²=0.274로 분산의 27.4%를 설명한다. 제2계층(Residual Ridge)은 코어 잔차를
            SOX, 광의 미국지수 팩터, WTI, Gold, 미국 10년물 금리 신호로 추가 설명하며,
            최근 성능에 따라 가중치(현재 0.0)가 자동 조정된다. 제3계층(K200 Mapping)은
            합성 K200 수익률을 실제 KOSPI 포인트 변화로 변환하는 240일 롤링 회귀다(β=0.340).
            제4계층(Trend Follow Floor)은 신호가 임계값을 초과할 때 K200 매핑의 과소반응을
            교정하는 비선형 조정 레이어다. 실증 분석 결과, 이 4계층 구조는 백테스트 기준
            밴드 적중률 75.26%, 방향 적중률 76.53%, RMSE 21.82포인트를 달성했다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가 예측, 계층적 모델 설계, EWY ETF, Ridge 회귀, K200 매핑, 잔차 보정, 트렌드팔로우
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study systematically describes the design principles, layer-by-layer structure,
            and inter-layer interaction mechanisms of the EWY Synthetic K200 Ridge architecture
            used in the 코스피프리뷰 platform for predicting KOSPI opening prices. The model
            consists of four layers rather than a single regression. Layer 1 (Core EWY+FX)
            estimates a synthetic KOSPI200 return using Rolling Ridge regression on EWY log
            returns (coefficient 0.364) and USD/KRW exchange rates (coefficient 0.200), achieving
            R²=0.274. Layer 2 (Residual Ridge) adds explanatory power for core residuals using
            SOX, broad U.S. index factors, WTI, Gold, and U.S. 10-year yield signals, with
            auto-adjusted weight (currently 0.0) based on recent performance. Layer 3 (K200 Mapping)
            converts synthetic K200 returns to actual KOSPI point changes via 240-day rolling
            regression (β=0.340). Layer 4 (Trend Follow Floor) applies nonlinear adjustments to
            correct underreaction in K200 mapping when signals exceed thresholds. Empirical
            backtesting across 1,462 trading days achieved a band accuracy rate of 75.26%,
            directional accuracy of 76.53%, and RMSE of 21.82 points.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening price prediction, hierarchical model design, EWY ETF, Ridge regression, K200 mapping, residual correction, trend follow floor
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측을 위한 단일 회귀 모델의 한계는 잘 알려져 있다. EWY 하나만으로는
            코스피 변동의 일부만 설명되며, 환율을 추가해도 설명력(R²)이 0.27 수준에 머문다.
            잔여 73%의 변동은 글로벌 섹터 흐름, 원자재 변화, 금리 신호, 시장 레짐 등
            다양한 요인에 기인한다. 이 잔차를 체계적으로 분해하면서도 과적합(overfitting)을
            방지하는 것이 예측 모델 설계의 핵심 과제다.
          </p>
          <p>
            본 연구는 코스피프리뷰 플랫폼이 채택한 4계층 아키텍처의 설계 철학을 기술한다.
            각 레이어가 왜 독립적으로 설계되었는지, 레이어 간 정보 흐름이 어떻게 구성되는지,
            그리고 각 레이어의 실증적 기여가 무엇인지를 현재 파라미터 수치와 함께 규명한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 계층적 앙상블 설계의 이론적 근거</h3>
          <p>
            Breiman(1996)이 제안한 stacking 앙상블 방법론은 복수의 모델이 서로 다른 오차 패턴을
            가질 때 이를 계층적으로 결합하면 개별 모델보다 우월한 예측력을 달성할 수 있음을 보였다.
            금융 시계열에서 이 원리를 적용할 때의 핵심 제약은 과적합이다. Tibshirani(1996)의
            LASSO와 Hoerl &amp; Kennard(1970)의 Ridge 회귀는 계수에 정규화 제약을 부과하여
            계층 간 전파되는 과적합을 억제하는 대표적 방법론이다. 본 모델은 각 계층에서
            Ridge 제약을 독립적으로 적용하는 방식으로 이 문제를 해결한다.
          </p>
          <h3>2. 합성 선물 접근법</h3>
          <p>
            Hasbrouck(1995)는 선물과 현물 시장 간 가격 발견 기여를 측정하는 정보 점유율
            (Information Share) 방법론을 제안했다. EWY를 합성 K200 선물의 프록시로 활용하는
            본 연구의 접근은 이 가격 발견 개념의 응용으로 해석할 수 있다. EWY는 뉴욕시장에서
            거래되는 한국 주식 바스켓이므로, 그 로그수익률은 한국 시장이 마감한 이후
            미국 시장이 형성하는 "한국에 대한 글로벌 합의"를 실시간으로 반영한다.
          </p>
          <h3>3. 비선형 조정 레이어의 필요성</h3>
          <p>
            선형 회귀는 신호의 크기에 비례하는 반응을 가정한다. 그러나 코스피 시초가는
            신호가 극단값을 보일 때 선형 모델이 예측하는 것보다 약하게 반응하는 경향이 있다.
            이는 동시호가 메커니즘에서 강세 신호에 대한 매도 물량이 동시에 증가하고,
            약세 신호에 대한 매수 물량이 지지선 역할을 하기 때문이다. 트렌드팔로우 플로어
            레이어는 이 비선형성을 교정하기 위한 조건부 최솟값 보정 메커니즘이다.
          </p>

          <h2>Ⅲ. 모델 아키텍처 상세 기술</h2>
          <h3>1. 제1계층 — Core EWY+FX (Rolling Ridge)</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 코어 레이어 현재 추정 파라미터 (2026년 5월 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">파라미터</th>
                  <th>값</th>
                  <th className="textLeft">설명</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">절편(Intercept)</td>
                  <td>0.294</td>
                  <td className="textLeft">신호 중립 시 상방 드리프트</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 계수</td>
                  <td>0.364</td>
                  <td className="textLeft">EWY 1% → K200 0.364% 상승</td>
                </tr>
                <tr>
                  <td className="textLeft">KRW 계수</td>
                  <td>0.200</td>
                  <td className="textLeft">환율 1% 상승(원화약세) → 하방</td>
                </tr>
                <tr>
                  <td className="textLeft">R²</td>
                  <td>0.274</td>
                  <td className="textLeft">분산 설명률 27.4%</td>
                </tr>
                <tr>
                  <td className="textLeft">샘플 윈도우</td>
                  <td>180거래일</td>
                  <td className="textLeft">롤링 재추정 기간</td>
                </tr>
                <tr>
                  <td className="textLeft">MAE (코어만)</td>
                  <td>1.084%</td>
                  <td className="textLeft">수익률 단위 평균절대오차</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 계수(0.364)가 KRW 계수(0.200)보다 높다. 이는 달러 기준 한국 주식 바스켓의
            방향성이 환율 변화보다 원화 기준 코스피에 더 직접적으로 전달됨을 의미한다.
            KRW 계수를 고정(0.200)으로 설정하는 이유는 180일 롤링 추정에서
            환율 계수가 과도하게 불안정해지는 수치적 문제를 Ridge 정규화로도 완전히 제거하기
            어렵기 때문으로, 실증적으로 0.20이 안정적 하한임을 확인했다.
          </p>

          <h3>2. 제2계층 — Residual Ridge (보조 신호 잔차 보정)</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 잔차 보정 레이어 계수 (2026년 5월 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>계수</th>
                  <th className="textLeft">해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">tech_factor (나스닥 팩터)</td>
                  <td>−0.541</td>
                  <td className="textLeft">기술주 초과 강도 → 코스피 조정</td>
                </tr>
                <tr>
                  <td className="textLeft">semi_factor (SOX 팩터)</td>
                  <td>−0.514</td>
                  <td className="textLeft">반도체 초과 강도 → 국내 반도체 차별</td>
                </tr>
                <tr>
                  <td className="textLeft">us10y_z (미국 10Y 금리)</td>
                  <td>+0.524</td>
                  <td className="textLeft">금리 상승 → 성장 기대 확인</td>
                </tr>
                <tr>
                  <td className="textLeft">wti_z (WTI 유가)</td>
                  <td>+0.424</td>
                  <td className="textLeft">유가 상승 → 리스크온 신호</td>
                </tr>
                <tr>
                  <td className="textLeft">gold_z (금 가격)</td>
                  <td>−0.202</td>
                  <td className="textLeft">금 상승 → 안전자산 선호</td>
                </tr>
                <tr>
                  <td className="textLeft">broad_factor (S&amp;P/DOW 팩터)</td>
                  <td>−0.112</td>
                  <td className="textLeft">광의 지수 초과 강도 보정</td>
                </tr>
                <tr>
                  <td className="textLeft">현재 레이어 가중치</td>
                  <td>0.0</td>
                  <td className="textLeft">자동 비활성화 (coreMae &lt; fullMae)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            잔차 레이어는 현재 가중치 0.0으로 비활성 상태다. 활성화 조건은
            fullMAE(잔차 포함) &lt; coreMae(코어만)일 때, 즉 보조 신호가 코어 대비 추가 설명력을
            제공할 때만 작동한다. 충격 구간에서는 보조 신호들이 오히려 잡음으로 작용하여
            자동 비활성화된다. 이 설계는 레이어가 해를 끼치지 않도록 보장하는 안전장치다.
          </p>

          <h3>3. 제3계층 — K200 Mapping (KOSPI 포인트 변환)</h3>
          <p>
            합성 K200 수익률을 실제 KOSPI 포인트 변화로 변환하는 240일 롤링 회귀다.
            현재 β=0.340(절편 0.276)으로, K200이 1% 움직일 때 KOSPI는 0.340% 움직이는
            관계를 나타낸다. 코어 레이어(180일)보다 긴 240일 윈도우를 사용하는 이유는
            K200-KOSPI 매핑 관계가 더 장기적으로 안정적인 구조적 관계이기 때문이다.
          </p>

          <h3>4. 제4계층 — Trend Follow Floor (비선형 최솟값 보정)</h3>
          <p>
            신호 크기가 medium 임계값(0.45%) 또는 high 임계값(2.0%)을 초과할 때 작동한다.
            medium 트리거에서는 신호의 70%를 최소한 반영하도록 강제하고,
            high 트리거에서는 78%를 최소 반영한다. 이 레이어는 K200 매핑이
            극단 신호를 과도하게 축소(shrink)하는 것을 방지하는 하방 경계(floor) 역할을 한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 전체 백테스트 성과</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 4계층 아키텍처 백테스트 성과 요약 (1,462거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">지표</th>
                  <th>값</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="textLeft">밴드 적중률</td><td>75.26%</td></tr>
                <tr><td className="textLeft">방향 적중률</td><td>76.53%</td></tr>
                <tr><td className="textLeft">RMSE</td><td>21.82포인트</td></tr>
                <tr><td className="textLeft">MAE</td><td>12.24포인트</td></tr>
                <tr><td className="textLeft">최근 30일 MAE (2026.5월)</td><td>31.52포인트</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            최근 30일 MAE(31.52)가 백테스트 MAE(12.24)를 크게 상회하는 것은
            2026년 4월 충격 레짐의 영향이다. 이는 4계층 아키텍처의 설계 결함이 아니라
            레짐 의존적 성과 변동의 표현이며, 레짐 정상화와 함께 회복이 예상된다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            4계층 아키텍처의 핵심 설계 철학은 세 가지다. 첫째, 각 레이어가 독립적으로
            추정되어 레이어 간 과적합 전파를 차단한다. 둘째, 잔차 레이어의 자동 가중치
            조정이 충격 구간에서 레이어가 해를 끼치지 않도록 보장한다. 셋째, 트렌드팔로우
            플로어가 선형 회귀의 수축 편향을 실용적으로 교정한다.
          </p>
          <p>
            향후 연구 방향으로는 제2계층(Residual Ridge)의 활성화 조건을 단순 MAE 비교에서
            레짐 인식 조건으로 고도화하는 방법, 그리고 제4계층의 임계값을 VIX와 연동하여
            동적으로 조정하는 방법이 유망하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Breiman, L. (1996). Stacked regressions. <em>Machine Learning</em>, 24(1), 49–64.</p>
            <p className="paperReferenceItem">Tibshirani, R. (1996). Regression shrinkage and selection via the lasso. <em>Journal of the Royal Statistical Society: Series B</em>, 58(1), 267–288.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Hasbrouck, J. (1995). One security, many markets: Determining the contributions to price discovery. <em>Journal of Finance</em>, 50(4), 1175–1199.</p>
            <p className="paperReferenceItem">Zou, H., &amp; Hastie, T. (2005). Regularization and variable selection via the elastic net. <em>Journal of the Royal Statistical Society: Series B</em>, 67(2), 301–320.</p>
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
