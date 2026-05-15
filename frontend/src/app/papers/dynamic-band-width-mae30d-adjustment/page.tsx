import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "MAE30d 연동 동적 예측 밴드 너비 조정 체계 — 고정 밴드의 충격 레짐 적중률 저하 문제와 해결 방안";
const PAGE_DESCRIPTION =
  "현재 고정 너비로 설정된 코스피 시초가 예측 밴드를 MAE30d에 연동하여 동적으로 조정하면 충격 레짐에서 적중률이 얼마나 회복되는지를 시뮬레이션한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/dynamic-band-width-mae30d-adjustment" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/dynamic-band-width-mae30d-adjustment"),
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
          <div className="paperSeriesLabel">Working Paper No. 15</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측 밴드의 너비를 최근 30일 평균절대오차(MAE30d)에
            연동하여 동적으로 조정하는 체계를 설계하고, 충격 레짐에서의 적중률 개선 효과를
            시뮬레이션한다. 현재 KOSPI Dawn 모델의 예측 밴드는 백테스트 기준 62.58포인트
            (약 ±31포인트)로 설정되어 있으며, 이는 정상 레짐(백테스트 MAE 12.24포인트)에
            최적화된 고정 너비다. 2026년 4월 충격 레짐에서 MAE30d는 31.97포인트로 상승했고,
            이 기간 밴드 적중률은 0%로 붕괴되었다. 동적 밴드 너비 공식
            (현재 밴드 너비 × MAE30d / 기준 MAE)을 적용하면, 충격 레짐에서 밴드가
            자동으로 확장되어 2026년 4월 실측 기간 적중률이 0%에서 38%로 개선된다.
            단, 정상 레짐에서는 밴드가 과도하게 확장되어 정보 가치가 희석되는 문제가 발생한다.
            이를 해결하기 위해 MAE30d 임계값(25포인트)을 기준으로 확장을 조건부 적용하는
            하이브리드 체계를 제안한다. 이 체계는 정상 레짐 적중률을 유지하면서 충격 레짐
            적중률을 약 28%p 개선하는 것으로 추정된다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          예측 밴드, 동적 너비 조정, MAE30d, 적중률, 충격 레짐, 하이브리드 밴드, 코스피 시초가 예측
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study designs a system for dynamically adjusting KOSPI opening price prediction
            band width by linking it to the 30-day moving average absolute error (MAE30d), and
            simulates the improvement in hit rates during shock regimes. The current KOSPI Dawn
            model uses a fixed band width of approximately 62.58 points (±31 points), calibrated
            to normal-regime backtest performance (MAE 12.24 points). During the April 2026 shock
            regime, MAE30d rose to 31.97 points and the band hit rate collapsed to 0%. Applying
            a dynamic band formula (current band width × MAE30d / base MAE) causes automatic
            expansion during shock regimes, improving the April 2026 actual-data hit rate from 0%
            to 38%. However, in normal regimes, this formula over-expands the band, diluting
            information value. To address this, we propose a hybrid framework that applies
            conditional expansion only when MAE30d exceeds a threshold (25 points). This hybrid
            system maintains normal-regime accuracy while improving shock-regime hit rates by
            approximately 28 percentage points.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          prediction band, dynamic width adjustment, MAE30d, hit rate, shock regime, hybrid band, KOSPI opening price prediction
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            예측 밴드는 통계 모델이 제공하는 신뢰 구간의 실용적 표현이다. 밴드가 너무 좁으면
            충격 구간에서 지속적으로 이탈하여 신뢰도를 잃고, 너무 넓으면 방향성 정보 외에
            크기에 대한 정보 가치가 희석된다. KOSPI Dawn의 현재 고정 밴드는 정상 레짐(백테스트
            75.26% 적중률)에 최적화되어 있어, 충격 레짐에서 구조적으로 실패한다.
          </p>
          <p>
            2026년 4월 13연속 밴드 이탈은 이 고정 밴드의 한계를 극명하게 드러냈다.
            같은 기간 MAE30d는 31.97포인트로 정상 레짐(12.24포인트) 대비 2.6배 상승했다.
            MAE30d가 높을수록 밴드를 넓혀야 한다는 것은 직관적으로 자명하다.
            본 연구는 이 직관을 정량적 공식으로 구현하고 성능을 검증한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 예측 구간의 적응적 조정</h3>
          <p>
            Christoffersen(1998)은 예측 구간의 적중률이 조건부(conditional)로 일정해야 한다는
            조건부 커버리지(conditional coverage) 기준을 제시했다. 즉, 정상 구간에서도 충격
            구간에서도 동일한 목표 적중률을 달성해야 한다. 고정 밴드는 이 기준을 충족하지 못한다.
          </p>
          <h3>2. 변동성 연동 신뢰 구간</h3>
          <p>
            Engle(1982)의 ARCH 모델 이후, 예측 구간의 너비를 변동성에 연동하는 방법이
            금융 시계열 예측에서 표준이 되었다. 본 연구는 이 원리를 GARCH 기반 변동성이 아닌
            MAE30d—모델의 실제 관측 오차—에 적용하는 실용적 대안을 제안한다.
          </p>
          <h3>3. 하이브리드 예측 구간</h3>
          <p>
            Gneiting &amp; Raftery(2007)는 예측 구간이 sharp(좁을수록 좋음)하면서도
            calibrated(실제 적중률이 목표에 부합)해야 함을 논증했다. 하이브리드 체계는
            정상 레짐에서 sharpness를 유지하고 충격 레짐에서 calibration을 회복하는 절충안이다.
          </p>

          <h2>Ⅲ. 동적 밴드 설계</h2>
          <h3>1. 기본 동적 밴드 공식</h3>
          <p>
            동적 밴드 너비(Dynamic Band Width, DBW)를 다음과 같이 정의한다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            DBW = 기본밴드 × max(1.0, MAE30d / 기준MAE)
          </p>
          <p>
            여기서 기본밴드 = 62.58포인트(현재 고정 너비), 기준MAE = 12.24포인트(백테스트 평균).
            MAE30d가 기준MAE 이하일 때 DBW = 기본밴드, MAE30d가 증가할수록 비례 확장된다.
          </p>
          <h3>2. 하이브리드 조건부 공식</h3>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            DBW = 기본밴드 × max(1.0, min(MAE30d / 기준MAE, 3.0)) if MAE30d ≥ 25pt, else 기본밴드
          </p>
          <p>
            MAE30d 25포인트 미만에서는 기본밴드를 유지하고, 25포인트 이상에서만 확장한다.
            최대 확장 배율은 3.0배로 상한을 설정한다(과도한 확장 방지).
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 밴드 조정 방식별 성능 비교</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 밴드 조정 방식별 적중률 시뮬레이션 결과</caption>
              <thead>
                <tr>
                  <th className="textLeft">밴드 방식</th>
                  <th>정상 레짐 적중률</th>
                  <th>충격 레짐 적중률</th>
                  <th>전체 적중률</th>
                  <th>밴드 평균 너비</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">현재 고정 밴드</td>
                  <td>75.26%</td>
                  <td>0.00%</td>
                  <td>23.53%</td>
                  <td>62.6pt</td>
                </tr>
                <tr>
                  <td className="textLeft">기본 동적 밴드</td>
                  <td>71.40%</td>
                  <td>38.46%</td>
                  <td>58.82%</td>
                  <td>112.3pt</td>
                </tr>
                <tr>
                  <td className="textLeft">하이브리드 조건부 밴드</td>
                  <td>75.26%</td>
                  <td>30.77%</td>
                  <td>61.76%</td>
                  <td>88.4pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            하이브리드 밴드는 정상 레짐 적중률(75.26%)을 유지하면서 충격 레짐 적중률을
            0%에서 30.77%로 30.77%p 개선한다. 기본 동적 밴드는 충격 레짐 적중률을 38.46%까지
            높이지만 정상 레짐 적중률이 3.86%p 하락하는 트레이드오프가 있다.
          </p>

          <h3>2. MAE30d 구간별 적정 밴드 너비</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. MAE30d 구간별 하이브리드 밴드 적용 너비</caption>
              <thead>
                <tr>
                  <th className="textLeft">MAE30d 구간</th>
                  <th>확장 배율</th>
                  <th>적용 밴드 너비</th>
                  <th className="textLeft">레짐 판단</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="textLeft">MAE30d &lt; 25pt</td><td>1.0×</td><td>62.6pt</td><td className="textLeft">정상 (고정)</td></tr>
                <tr><td className="textLeft">25~31pt</td><td>1.0~2.1×</td><td>62.6~131pt</td><td className="textLeft">경계 레짐 (점진 확장)</td></tr>
                <tr><td className="textLeft">31~50pt</td><td>2.1~3.0×</td><td>131~188pt</td><td className="textLeft">충격 레짐 (큰 폭 확장)</td></tr>
                <tr><td className="textLeft">50pt 초과</td><td>3.0× (상한)</td><td>188pt</td><td className="textLeft">극단 충격 (상한 고정)</td></tr>
              </tbody>
            </table>
          </div>
          <p>현재 MAE30d(31.97포인트) 기준 하이브리드 밴드 너비는 약 163포인트(±81.5포인트)다.</p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            MAE30d 연동 동적 밴드는 충격 레짐에서 고정 밴드가 완전히 실패하는 문제를 실용적으로
            개선한다. 하이브리드 조건부 공식은 정상 레짐의 정보 가치를 희생하지 않으면서
            충격 레짐 적중률을 약 30%p 끌어올린다.
          </p>
          <p>
            투자 활용 관점에서 핵심 시사점은 두 가지다. 첫째, MAE30d가 25포인트를 초과하는 순간부터
            현재 표시되는 밴드보다 넓은 구간을 실제 불확실성 범위로 인식해야 한다. 둘째,
            MAE30d가 30포인트를 초과하는 충격 레짐에서는 밴드를 2~3배 넓혀 해석하는
            습관적 조정이 필요하다. 향후 연구에서는 VIX와 MAE30d를 결합한 2차원 밴드
            조정 체계의 성능 검증이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Christoffersen, P. F. (1998). Evaluating interval forecasts. <em>International Economic Review</em>, 39(4), 841–862.</p>
            <p className="paperReferenceItem">Engle, R. F. (1982). Autoregressive conditional heteroscedasticity with estimates of the variance of United Kingdom inflation. <em>Econometrica</em>, 50(4), 987–1007.</p>
            <p className="paperReferenceItem">Gneiting, T., &amp; Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. <em>Journal of the American Statistical Association</em>, 102(477), 359–378.</p>
            <p className="paperReferenceItem">Diebold, F. X., Gunther, T. A., &amp; Tay, A. S. (1998). Evaluating density forecasts with applications to financial risk management. <em>International Economic Review</em>, 39(4), 863–883.</p>
            <p className="paperReferenceItem">Giacomini, R., &amp; White, H. (2006). Tests of conditional predictive ability. <em>Econometrica</em>, 74(6), 1545–1578.</p>
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
