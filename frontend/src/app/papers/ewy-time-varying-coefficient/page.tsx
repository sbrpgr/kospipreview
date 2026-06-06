import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의";
const PAGE_DESCRIPTION =
  "Rolling Ridge 추정을 통해 EWY-코스피 전달 계수(β)의 시변성을 분석하고, R² 및 MAE30d를 실시간 모델 신뢰도 지표로 활용하는 동적 투자 활용 체계를 제안한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/ewy-time-varying-coefficient" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/ewy-time-varying-coefficient"),
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
          <div className="paperSeriesLabel">Working Paper No. 5</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 EWY ETF와 코스피 시초가 사이의 가격 전달 계수(β)가 시간에 따라 변하는
            시변 파라미터(time-varying parameter)임을 Rolling Ridge 회귀 프레임워크를 통해
            분석하고, 이 시변성이 투자 의사결정에 미치는 함의를 논한다. 2026년 5월 기준
            추정 β는 0.3535이며 달러-원 환율 계수는 0.200이다. 이 계수들은 최근 180거래일
            데이터를 활용해 매 예측 사이클마다 재추정되므로, 시장 레짐 변화에 따라 연속적으로
            이동한다. 특히 R²(현재 0.2349)와 MAE30d(현재 31.17포인트)는 모델의 현재 설명력과
            절대 오차 수준을 나타내는 실시간 지표로, 투자자가 예측 결과를 활용하기 전
            선행적으로 점검해야 할 동적 신뢰도 메트릭으로 기능한다. 본 연구는 R² &lt; 0.15
            또는 MAE30d &gt; 50포인트인 구간에서 모델 의존도를 낮추고, R² ≥ 0.25 및
            MAE30d ≤ 20포인트인 구간에서 모델 신뢰도를 높이는 동적 의존도 조정 체계를 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          시변 계수, EWY ETF, 코스피 시초가, Rolling Ridge 회귀, 모델 신뢰도, R², MAE30d, 동적 투자 전략
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes the EWY-KOSPI price transmission coefficient (β) as a time-varying
            parameter within a Rolling Ridge regression framework and discusses its implications for
            investment decision-making. As of May 2026, the estimated β is 0.3535, and the USD/KRW
            coefficient is 0.200. These coefficients are re-estimated each prediction cycle using
            the most recent 180 trading days, and thus shift continuously with changes in market
            regimes. R² (currently 0.2349) and MAE30d (currently 31.17 points) serve as real-time
            indicators of the model's explanatory power and absolute error level, functioning as
            dynamic reliability metrics that investors should monitor before utilizing forecast outputs.
            This study proposes a dynamic model-dependency adjustment framework: reducing reliance on
            the model when R² &lt; 0.15 or MAE30d &gt; 50, and increasing reliance when
            R² ≥ 0.25 and MAE30d ≤ 20.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          time-varying coefficient, EWY ETF, KOSPI opening price, Rolling Ridge regression, model reliability, R², MAE30d, dynamic investment strategy
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            금융 계량경제학에서 계수의 시변성(time-varying parameter) 문제는 오랜 연구 주제다.
            Rosenberg(1972)는 회귀 계수가 시간에 따라 확률적으로 변화한다는 랜덤 계수 모델을
            제안했으며, Kalman(1960) 필터는 이런 시변 계수를 동적으로 추정하는 표준 방법론으로
            자리 잡았다. 금융시장에서 계수 시변성의 주된 원인은 시장 레짐 전환, 투자자 구성의 변화,
            규제 환경 변화, 거시경제 구조 변화 등이다.
          </p>
          <p>
            EWY-코스피 전달 계수는 이 시변성의 전형적 사례다. 달러 기준 한국 주식 ETF(EWY)와
            원화 기준 코스피 시초가 사이의 관계는 환율 레짐, 외국인 투자자 비중, 반도체 업황 사이클,
            글로벌 리스크 선호도 등 여러 구조적 요인에 의해 지속적으로 변한다. 이 계수를 한 번 추정하고
            고정하면 변화하는 시장 현실을 반영하지 못한다. 본 연구는 Rolling Ridge 추정을 통한
            동적 계수 관리가 어떻게 작동하는지를 분석하고, 그 결과물인 R²와 MAE30d를 실시간
            모델 신뢰도 지표로 활용하는 투자 프레임워크를 제안한다.
          </p>

          <h2>Ⅱ. 이론적 배경</h2>
          <h3>1. EWY-코스피 간 가격 전달 메커니즘</h3>
          <p>
            EWY는 미국 시장에서 거래되는 한국 주식 바스켓 ETF로, 한국 시장이 닫혀 있는 야간 시간대에
            글로벌 투자자들의 한국 주식에 대한 견해를 실시간으로 가격에 반영한다. 이 가격 발견 기능이
            다음날 코스피 시초가에 정보를 전달하는 채널이다. 전달의 강도(β)는 EWY의 가격 변화 중
            코스피 시초가로 실제 번역되는 비율을 나타낸다.
          </p>
          <p>
            이 β가 시간에 따라 변하는 이유는 여러 층위에서 설명된다. 단기적으로는 EWY 거래량과
            유동성이 변하며, 고유동성 구간에서 β가 높아지는 경향이 있다. 구조적으로는 외국인 투자자의
            국내 주식 보유 비중, 환율 헤지 비용, 삼성전자 등 대형주의 글로벌 동조화 강도가
            β를 결정하는 요인이다. 2024~2026년 원화 약세 추세와 관세 충격으로 인한 환경 변화가
            β의 최근 움직임을 설명하는 배경이다.
          </p>

          <h3>2. Rolling Ridge 추정의 특성</h3>
          <p>
            Hoerl &amp; Kennard(1970)의 Ridge 회귀는 OLS에 L2 정규화 페널티를 추가해 다중공선성
            환경에서 안정적인 계수를 추정한다. 롤링 방식(rolling window)은 가장 오래된 관측값을
            제거하고 최신 관측값을 추가하는 방식으로 계수를 동적으로 업데이트한다. 이 방법은
            Kalman 필터보다 단순하지만 구현이 쉽고 해석이 직관적이며, 단기 레짐 변화에 반응하면서도
            Ridge 제약으로 노이즈 과적합을 억제한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 모델 구조</h3>
          <p>
            분석 대상 모델은 EWY 로그수익률(r_EWY)과 USD/KRW 로그수익률(r_KRW)을 코어 입력으로
            하는 Ridge 회귀다. 추정 수식은 다음과 같다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", background: "var(--surface-strong)", padding: "14px 18px", borderRadius: "6px", lineHeight: "1.8" }}>
            ŷ_K200 = α + β_EWY × r_EWY + β_KRW × r_KRW + ε
            <br />
            (Ridge: minimize ‖y − Xβ‖² + λ‖β‖²)
          </p>
          <p>
            이후 합성 KOSPI200 수익률(ŷ_K200)은 K200-KOSPI 매핑 레이어를 거쳐
            코스피 시초가 예측값(ŷ_KOSPI)으로 변환된다. K200 매핑의 추정 beta는 0.317698이며
            별도 240일 롤링 윈도우로 추정된다.
          </p>

          <h3>2. 현재 추정 파라미터</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 8. 코어 레이어 현재 추정 파라미터 (2026년 5월 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">파라미터</th>
                  <th>추정값</th>
                  <th className="textLeft">의미</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">β_EWY (EWY 계수)</td>
                  <td>0.3535</td>
                  <td className="textLeft">EWY 1% → K200 합성 ~0.35%</td>
                </tr>
                <tr>
                  <td className="textLeft">β_KRW (환율 계수)</td>
                  <td>0.2000</td>
                  <td className="textLeft">환율 1% 상승 → 하방 약 0.20%</td>
                </tr>
                <tr>
                  <td className="textLeft">절편 (α)</td>
                  <td>0.2628</td>
                  <td className="textLeft">중립 신호 시 기본 드리프트</td>
                </tr>
                <tr>
                  <td className="textLeft">R² (적합도)</td>
                  <td>0.2349</td>
                  <td className="textLeft">설명 분산 23.49%</td>
                </tr>
                <tr>
                  <td className="textLeft">적합 MAE</td>
                  <td>1.0802%</td>
                  <td className="textLeft">로그수익률 기준 평균 절대 오차</td>
                </tr>
                <tr>
                  <td className="textLeft">샘플 크기</td>
                  <td>180일</td>
                  <td className="textLeft">롤링 윈도우</td>
                </tr>
                <tr>
                  <td className="textLeft">K200 매핑 beta</td>
                  <td>0.3177</td>
                  <td className="textLeft">K200 합성 → KOSPI 전달 비율</td>
                </tr>
                <tr>
                  <td className="textLeft">K200 매핑 샘플</td>
                  <td>240일</td>
                  <td className="textLeft">롤링 윈도우 (코어보다 장기)</td>
                </tr>
                <tr>
                  <td className="textLeft">MAE30d (실측)</td>
                  <td>31.17pt</td>
                  <td className="textLeft">최근 30일 실제 절대 오차 평균</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Ⅳ. 실증분석: 시변성의 투자적 함의</h2>
          <h3>1. β_EWY의 시변성과 레짐 해석</h3>
          <p>
            β_EWY = 0.3535는 현재 180일 롤링 윈도우에서 추정된 값이다. 이 값이 0.35에 가깝다는 것은,
            EWY 수익률의 약 35%가 코스피 시초가로 전달된다는 의미다. 단순히 1:1로 전달되지 않는 이유는
            EWY가 한국 주식 외에도 ETF 운용 비용, 미국 장내 리스크 프리미엄, 외국인 헤지 수요 등
            한국 시초가에 직접 영향을 주지 않는 노이즈 요소를 포함하기 때문이다.
          </p>
          <p>
            이 β가 롤링으로 재추정될 때, 시장 레짐에 따라 다음과 같이 변동할 수 있다.
            외국인 투자자의 코스피 비중이 높고 EWY-코스피 동조화가 강한 강세 레짐에서는
            β가 0.40 이상으로 높아질 수 있다. 반면 원화 약세가 심화되거나 외국인 이탈이
            지속되는 구간에서는 β가 0.25 이하로 낮아질 수 있다. 현재 0.3535는 이 두 극단의
            중간 레짐에 해당한다.
          </p>

          <h3>2. R²와 MAE30d를 실시간 신뢰도 지표로 활용하는 방법</h3>
          <p>
            R² = 0.2349는 현재 EWY+환율 신호가 코스피 시초가 변동의 23.49%를 설명한다는 뜻이다.
            이 수치는 정상 레짐에서 25~30%까지 높아질 수 있고, 충격 레짐에서는 10~15%로 낮아질 수 있다.
            따라서 R²가 예측 전날 기준으로 0.15 미만이라면 모델의 현재 설명력이 심각하게 낮은 상태이며,
            모델 출력에 대한 의존도를 낮추어야 한다는 신호다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 9. R²와 MAE30d 기반 동적 모델 신뢰도 등급 체계(제안)</caption>
              <thead>
                <tr>
                  <th>등급</th>
                  <th>R² 조건</th>
                  <th>MAE30d 조건</th>
                  <th className="textLeft">투자자 대응</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>A (높은 신뢰)</td>
                  <td>≥ 0.25</td>
                  <td>≤ 20pt</td>
                  <td className="textLeft">모델 밴드 기준 적극 활용</td>
                </tr>
                <tr>
                  <td>B (보통 신뢰)</td>
                  <td>0.15~0.25</td>
                  <td>20~40pt</td>
                  <td className="textLeft">방향 참고, 크기 보수적 해석</td>
                </tr>
                <tr>
                  <td>C (낮은 신뢰)</td>
                  <td>0.10~0.15</td>
                  <td>40~60pt</td>
                  <td className="textLeft">방향만 참고, 밴드 크게 확장</td>
                </tr>
                <tr>
                  <td>D (신뢰 불가)</td>
                  <td>&lt; 0.10</td>
                  <td>&gt; 60pt</td>
                  <td className="textLeft">모델 출력 무시, 자체 판단</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            2026년 5월 현재 R² 0.2349, MAE30d 31.17포인트는 B등급(보통 신뢰)에 해당한다.
            4월 충격 기간의 MAE30d는 이보다 훨씬 높았을 것으로 추정되며 D등급에 가까웠을 것이다.
            4월 27일 이후 안정 레짐에서 MAE30d가 개선되면서 현재 B등급으로 회복된 것이다.
          </p>

          <h3>3. β_KRW의 레짐별 특성</h3>
          <p>
            환율 계수(β_KRW = 0.200)는 EWY 계수보다 낮다. 이는 환율 변화가 EWY보다 간접적으로
            코스피 시초가에 영향을 미침을 반영한다. 그러나 환율 레짐—특히 1,400원 이상의
            고환율 구간—에서는 이 계수가 더 높아질 가능성이 있다. 고환율 구간에서는 외국인
            투자자의 원화 노출 부담이 커져 환율 변화가 코스피에 미치는 직접 영향이 강해지기 때문이다.
            이 경우 β_KRW의 상향 조정이 롤링 추정 과정에서 자연스럽게 반영될 것으로 예상한다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 EWY-코스피 가격 전달 계수가 시변 파라미터로서 Rolling Ridge 추정을 통해
            동적으로 관리됨을 분석했다. 현재 β_EWY = 0.3535, β_KRW = 0.200, R² = 0.2349는
            하나의 스냅샷일 뿐이며, 이 값들은 시장 레짐 변화에 따라 지속적으로 이동한다.
          </p>
          <p>
            투자자 관점의 핵심 시사점은 다음과 같다. 첫째, 예측 모델을 활용하기 전 R²와 MAE30d를
            확인해 현재 모델이 어느 신뢰도 등급에 있는지 판단해야 한다. 둘째, R² 하락과 MAE30d 상승은
            레짐 변화의 조기 신호일 수 있으며, 이 경우 모델 의존도를 선제적으로 낮춰야 한다.
            셋째, β_EWY가 높은(0.40 이상) 구간에서는 EWY 신호의 영향력이 크므로 EWY 방향을
            더 적극적으로 참고할 수 있고, β_EWY가 낮은(0.25 이하) 구간에서는 EWY 신호를
            보수적으로 해석해야 한다.
          </p>
          <p>
            연구 한계로는 R²와 MAE30d의 레짐별 기준값이 경험적 제안에 의존하며, 이 기준의
            통계적 최적성이 검증되지 않았다는 점이 있다. 향후 연구에서는 더 긴 표본 기간의
            실측 데이터를 활용해 각 등급의 전환 임계값을 통계적으로 추정하는 작업이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Rosenberg, B. (1972). The estimation of stationary stochastic regression parameters reexamined. <em>Journal of the American Statistical Association</em>, 67(339), 650–654.</p>
            <p className="paperReferenceItem">Kalman, R. E. (1960). A new approach to linear filtering and prediction problems. <em>Journal of Basic Engineering</em>, 82(1), 35–45.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Stock, J. H., &amp; Watson, M. W. (1996). Evidence on structural instability in macroeconomic time series relations. <em>Journal of Business &amp; Economic Statistics</em>, 14(1), 11–30.</p>
            <p className="paperReferenceItem">Pesaran, M. H., &amp; Timmermann, A. (2002). Market timing and return prediction under model instability. <em>Journal of Empirical Finance</em>, 9(5), 495–510.</p>
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
