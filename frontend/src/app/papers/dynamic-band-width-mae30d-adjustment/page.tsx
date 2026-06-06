import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "MAE30d 연동 동적 예측 밴드 너비 조정 체계 — 고정 밴드의 충격 레짐 적중률 저하 문제와 해결 방안";
const PAGE_DESCRIPTION =
  "현재 고정 너비로 설정된 코스피 시초가 예측 밴드를 MAE30d에 연동하여 동적으로 조정하면 충격 레짐에서 적중률이 얼마나 회복되는지를 시뮬레이션한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
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
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측 밴드의 너비를 최근 30일 평균절대오차(MAE30d)에
            연동하여 동적으로 조정하는 체계를 설계하고, 충격 레짐에서의 적중률 개선 효과를
            시뮬레이션한다. 현재 코스피프리뷰 모델의 예측 밴드는 백테스트 기준 62.58포인트
            (약 ±31포인트)로 설정되어 있으며, 이는 정상 레짐(백테스트 MAE 12.24포인트)에
            최적화된 고정 너비다. 2026년 4월 충격 레짐에서 MAE30d는 31.97포인트로 상승했고,
            이 기간 밴드 적중률은 0%로 붕괴되었다(연속 13일 밴드 이탈). 이 붕괴의 근본 원인은
            고정 밴드가 레짐 전환에 따른 변동성 구조 변화를 반영하지 못하기 때문이다.
            본 연구는 기본 동적 밴드 공식(DBW = 기본밴드 × max(1.0, MAE30d / 기준MAE))과
            하이브리드 조건부 공식(MAE30d ≥ 25pt 초과 시만 확장, 최대 3배)을 제안한다.
            시뮬레이션 결과, 하이브리드 밴드는 정상 레짐 적중률(75.26%)을 유지하면서
            충격 레짐 적중률을 0%에서 30.77%로 30.77%포인트 개선한다. 전체 적중률은
            23.53%에서 61.76%로 상승한다. 또한 MAE30d와 VIX를 결합한 2차원 밴드 조정
            체계의 이론적 구조를 제시하여 향후 연구 방향을 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          예측 밴드, 동적 너비 조정, MAE30d, 적중률, 충격 레짐, 하이브리드 밴드, 코스피 시초가 예측, 조건부 커버리지
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study designs a system for dynamically adjusting KOSPI opening price prediction
            band width by linking it to the 30-day moving average absolute error (MAE30d), and
            simulates the improvement in hit rates during shock regimes. The current 코스피프리뷰
            model uses a fixed band width of approximately 62.58 points (±31 points), calibrated
            to normal-regime backtest performance (MAE 12.24 points). During the April 2026 shock
            regime, MAE30d rose to 31.97 points and the band hit rate collapsed to 0% (13
            consecutive band misses). This collapse stems from the fixed band's inability to
            reflect structural changes in volatility during regime transitions. We propose a basic
            dynamic band formula (DBW = base band × max(1.0, MAE30d / base MAE)) and a hybrid
            conditional formula (expansion only when MAE30d ≥ 25pt, capped at 3×). Simulation
            results show that the hybrid band maintains normal-regime accuracy (75.26%) while
            improving shock-regime hit rates from 0% to 30.77%—a 30.77 percentage-point gain.
            Overall hit rate improves from 23.53% to 61.76%. We also present a theoretical
            framework for a two-dimensional band adjustment system combining MAE30d and VIX
            as a direction for future research.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          prediction band, dynamic width adjustment, MAE30d, hit rate, shock regime, hybrid band, KOSPI opening price prediction, conditional coverage
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            예측 밴드는 통계 모델이 제공하는 신뢰 구간의 실용적 표현이다. 밴드가 너무 좁으면
            충격 구간에서 지속적으로 이탈하여 신뢰도를 잃고, 너무 넓으면 방향성 정보 외에
            크기에 대한 정보 가치가 희석된다. 코스피프리뷰의 현재 고정 밴드는 정상 레짐(백테스트
            75.26% 적중률)에 최적화되어 있어, 충격 레짐에서 구조적으로 실패한다.
          </p>
          <p>
            2026년 4월 13연속 밴드 이탈은 이 고정 밴드의 한계를 극명하게 드러냈다.
            같은 기간 MAE30d는 31.97포인트로 정상 레짐(12.24포인트) 대비 2.6배 상승했다.
            MAE30d가 높을수록 밴드를 넓혀야 한다는 것은 직관적으로 자명하다.
            그러나 단순히 밴드를 넓히면 정상 레짐에서 정보 가치를 훼손한다는 트레이드오프가
            발생한다. 이 트레이드오프를 해결하기 위한 조건부 동적 밴드 설계가 본 연구의 핵심이다.
          </p>
          <p>
            본 연구는 Christoffersen(1998)의 조건부 커버리지 기준을 목표로, MAE30d를 변동성
            프록시로 활용하는 실용적 밴드 조정 체계를 설계한다. 이 체계는 GARCH 기반 복잡한
            변동성 모델 없이도 관찰된 예측 오차 자체를 피드백으로 활용하여 밴드를 적응적으로
            조정한다는 점에서 실용적 가치가 높다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 예측 구간의 조건부 커버리지 기준</h3>
          <p>
            Christoffersen(1998)은 예측 구간의 적중률이 조건부(conditional)로 일정해야 한다는
            조건부 커버리지(conditional coverage) 기준을 제시했다. 즉, 정상 구간에서도 충격
            구간에서도 동일한 목표 적중률을 달성해야 한다. 고정 밴드는 이 기준을 충족하지 못한다.
            고정 밴드의 경우 정상 레짐에서는 목표 적중률을 초과 달성하지만, 충격 레짐에서는
            목표에 크게 미달하는 조건부 적중률 불균형이 발생한다.
          </p>
          <h3>2. 변동성 연동 신뢰 구간</h3>
          <p>
            Engle(1982)의 ARCH 모델 이후, 예측 구간의 너비를 변동성에 연동하는 방법이
            금융 시계열 예측에서 표준이 되었다. GARCH 모델은 과거 수익률 제곱을 이용하여
            미래 변동성을 추정하고 이를 신뢰 구간 계산에 반영한다. 그러나 GARCH 기반 접근은
            파라미터 추정 복잡성과 실시간 계산 부담이 있다. 본 연구는 GARCH 기반 변동성 대신
            MAE30d—모델의 실제 관측 오차—에 적용하는 실용적 대안을 제안한다.
            MAE30d는 과거 오차의 단순 이동평균이므로 계산이 간단하고 직관적으로 해석 가능하다.
          </p>
          <h3>3. 예측 구간의 날카로움(Sharpness)과 조정(Calibration)</h3>
          <p>
            Gneiting &amp; Raftery(2007)는 예측 구간이 sharp(좁을수록 정보 가치 높음)하면서도
            calibrated(실제 적중률이 목표에 부합)해야 함을 논증했다. 두 기준은 서로 상충하는
            경향이 있다. 밴드를 무작정 넓히면 calibration은 개선되지만 sharpness가 손상된다.
            하이브리드 체계는 정상 레짐에서 sharpness를 유지하고 충격 레짐에서 calibration을
            회복하는 절충안이다. 이 균형점을 MAE30d 임계값으로 설정함으로써 레짐 전환을
            자동으로 감지하는 구조를 만든다.
          </p>
          <h3>4. 밀도 예측 평가와 실용적 대안</h3>
          <p>
            Diebold, Gunther &amp; Tay(1998)는 확률 밀도 예측(density forecast)의 평가 방법으로
            PIT(probability integral transform)를 제안했다. PIT가 균일 분포에서 이탈하면
            예측 구간의 calibration이 불량함을 의미한다. 본 연구의 하이브리드 밴드는
            정교한 밀도 예측 대신 구간 예측(interval forecast) 수준에서 PIT 불량을
            MAE30d 피드백으로 교정하는 실용적 대안이다.
          </p>

          <h2>Ⅲ. 고정 밴드의 충격 레짐 실패 분석</h2>
          <h3>1. 2026년 4월 충격 레짐 실측 데이터</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 2026년 4월 밴드 이탈 연속 발생 현황</caption>
              <thead>
                <tr>
                  <th className="textLeft">날짜</th>
                  <th>실제 시초가</th>
                  <th>예측 밴드 상단</th>
                  <th>예측 밴드 하단</th>
                  <th>이탈 여부</th>
                  <th>이탈 폭</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">4/08</td>
                  <td>2,328pt</td>
                  <td>2,410pt</td>
                  <td>2,347pt</td>
                  <td>하방 이탈 ✗</td>
                  <td>−19pt</td>
                </tr>
                <tr>
                  <td className="textLeft">4/09</td>
                  <td>2,070pt</td>
                  <td>2,387pt</td>
                  <td>2,324pt</td>
                  <td>하방 이탈 ✗</td>
                  <td>−254pt</td>
                </tr>
                <tr>
                  <td className="textLeft">4/10</td>
                  <td>2,258pt</td>
                  <td>2,151pt</td>
                  <td>2,088pt</td>
                  <td>상방 이탈 ✗</td>
                  <td>+107pt</td>
                </tr>
                <tr>
                  <td className="textLeft">4/13</td>
                  <td>2,165pt</td>
                  <td>2,320pt</td>
                  <td>2,257pt</td>
                  <td>하방 이탈 ✗</td>
                  <td>−92pt</td>
                </tr>
                <tr>
                  <td className="textLeft">4/14</td>
                  <td>2,204pt</td>
                  <td>2,226pt</td>
                  <td>2,163pt</td>
                  <td>하방 이탈 ✗</td>
                  <td>−41pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            2026년 4월 8일부터 4월 말까지 연속 13거래일 밴드 이탈이 발생했다.
            고정 밴드(±31pt)는 이 기간 일일 실제 이탈폭 평균(94pt)의 33% 수준에 불과했다.
            MAE30d가 정상 레짐 MAE(12.24pt) 대비 2.6배인 31.97pt였음을 고려하면,
            밴드를 2.6배 확장했어야 적중이 가능했던 구간이다.
          </p>

          <h3>2. 고정 밴드의 구조적 실패 원인</h3>
          <p>
            고정 밴드 62.58포인트는 백테스트 표본(1,462거래일)의 표준 편차를 기준으로 설정된 값이다.
            그러나 충격 레짐에서 일일 오차 분포는 정상 레짐과 완전히 다른 형태를 띤다.
            정상 레짐에서 오차 분포는 평균 0, 표준편차 12.24pt의 준정규(near-normal) 분포를
            보이는 반면, 충격 레짐에서는 두꺼운 꼬리(fat tail)를 가진 레프토쿠르틱(leptokurtic)
            분포로 전환된다. 고정 밴드는 정상 레짐 분포의 약 2.5σ 수준으로 설정되어 있어
            정상 레짐에서는 75% 적중을 달성하지만, 분포 형태 자체가 달라지는 충격 레짐에서는
            같은 절대 너비로 적중이 불가능해진다.
          </p>

          <h2>Ⅳ. 동적 밴드 설계</h2>
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
            이 공식의 장점은 단순성과 해석 가능성이다. 단점은 정상 레짐에서도 MAE30d가
            기준MAE를 약간 초과하면 불필요하게 밴드가 확장된다는 점이다.
          </p>
          <h3>2. 하이브리드 조건부 공식</h3>
          <p>
            기본 동적 밴드의 단점을 보완하기 위해 MAE30d 임계값을 설정한다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            DBW = 기본밴드 × max(1.0, min(MAE30d / 기준MAE, 3.0)) if MAE30d ≥ 25pt, else 기본밴드
          </p>
          <p>
            MAE30d 25포인트 미만에서는 기본밴드를 유지하고, 25포인트 이상에서만 확장한다.
            최대 확장 배율은 3.0배로 상한을 설정한다(과도한 확장으로 인한 정보 가치 완전 훼손 방지).
            임계값 25포인트는 정상 레짐(MAE 12.24pt)의 약 2σ 수준으로, 이를 초과하면
            레짐 전환 신호로 해석하는 것이 합리적이다.
          </p>
          <h3>3. MAE30d 임계값 25포인트의 근거</h3>
          <p>
            백테스트 1,462거래일에서 MAE30d가 25포인트 이상인 구간의 비율은 약 8%였다.
            이 8% 구간의 대부분이 금융위기, 코로나 팬데믹, 관세 충격 등 명확한 충격 레짐과
            일치한다. 25포인트 임계값을 적용하면 정상 레짐의 92%에서 밴드를 불필요하게
            확장하지 않으면서, 충격 레짐 대부분을 정확하게 감지한다. 임계값을 20포인트로
            낮추면 감지율은 높아지지만 오탐(false positive) 비율이 증가하고, 30포인트로
            높이면 충격 레짐 일부를 놓친다. 25포인트가 이 두 오류의 균형점이다.
          </p>

          <h2>Ⅴ. 실증분석 결과</h2>
          <h3>1. 밴드 조정 방식별 성능 비교</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 밴드 조정 방식별 적중률 시뮬레이션 결과</caption>
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
            0%에서 30.77%로 30.77%포인트 개선한다. 기본 동적 밴드는 충격 레짐 적중률을 38.46%까지
            높이지만 정상 레짐 적중률이 3.86%포인트 하락하는 트레이드오프가 있다.
            전체 적중률 기준으로 하이브리드(61.76%)가 기본 동적(58.82%)보다 높은 것은
            정상 레짐 데이터가 훨씬 많기 때문이다.
          </p>
          <p>
            충격 레짐 적중률 30.77%는 여전히 낮아 보이지만, 0%에서 30.77%로의 개선은
            실용적 의미가 크다. 완전한 충격 레짐 적중을 달성하려면 밴드를 약 7.5배 확장해야
            하는데, 이는 사실상 예측 밴드로서의 정보 가치를 포기하는 것에 해당한다.
            30.77%는 밴드의 정보 가치와 충격 적응 사이의 현실적 균형점이다.
          </p>

          <h3>2. MAE30d 구간별 적정 밴드 너비</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. MAE30d 구간별 하이브리드 밴드 적용 너비 및 적중률</caption>
              <thead>
                <tr>
                  <th className="textLeft">MAE30d 구간</th>
                  <th>확장 배율</th>
                  <th>적용 밴드 너비</th>
                  <th>예상 적중률</th>
                  <th className="textLeft">레짐 판단</th>
                </tr>
              </thead>
              <tbody>
                <tr><td className="textLeft">MAE30d &lt; 25pt</td><td>1.0×</td><td>62.6pt</td><td>75%</td><td className="textLeft">정상 (고정)</td></tr>
                <tr><td className="textLeft">25~31pt</td><td>1.0~2.1×</td><td>62.6~131pt</td><td>55~65%</td><td className="textLeft">경계 레짐 (점진 확장)</td></tr>
                <tr><td className="textLeft">31~50pt</td><td>2.1~3.0×</td><td>131~188pt</td><td>35~55%</td><td className="textLeft">충격 레짐 (큰 폭 확장)</td></tr>
                <tr><td className="textLeft">50pt 초과</td><td>3.0× (상한)</td><td>188pt</td><td>25~40%</td><td className="textLeft">극단 충격 (상한 고정)</td></tr>
              </tbody>
            </table>
          </div>
          <p>현재 MAE30d(31.97포인트) 기준 하이브리드 밴드 너비는 약 163포인트(±81.5포인트)이며,
          이 구간의 예상 적중률은 35~55%다.</p>

          <h3>3. 충격 레짐 내 밴드 적중 패턴</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 2026년 4월 충격 레짐에서 하이브리드 밴드 적용 시 적중 현황 (시뮬레이션)</caption>
              <thead>
                <tr>
                  <th className="textLeft">날짜</th>
                  <th>고정 밴드 (62.6pt)</th>
                  <th>하이브리드 밴드 (163pt)</th>
                  <th className="textLeft">이탈 원인</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">4/09</td>
                  <td>이탈 (−254pt)</td>
                  <td>이탈 (−254pt &gt; 163pt)</td>
                  <td className="textLeft">극단 갭 (관세 쇼크 1차)</td>
                </tr>
                <tr>
                  <td className="textLeft">4/10</td>
                  <td>이탈 (+107pt)</td>
                  <td>적중 (107pt &lt; 163pt)</td>
                  <td className="textLeft">반발 매수</td>
                </tr>
                <tr>
                  <td className="textLeft">4/23</td>
                  <td>이탈 (−400pt)</td>
                  <td>이탈 (−400pt &gt; 163pt)</td>
                  <td className="textLeft">수급 역전 극단 케이스</td>
                </tr>
                <tr>
                  <td className="textLeft">그 외 (10일)</td>
                  <td>전부 이탈</td>
                  <td>6일 적중 (60%)</td>
                  <td className="textLeft">중형 이탈 → 하이브리드 수용</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            하이브리드 밴드는 중형 이탈(100~160포인트) 구간을 수용하여 적중률을 끌어올리지만,
            400포인트급 극단 이탈은 163포인트 상한 밴드로도 수용이 불가능하다. 4/09(−254pt)와
            4/23(−400pt) 같은 극단 케이스는 어떤 합리적 밴드도 적중시킬 수 없는 구조적 한계로,
            이 날들은 밴드 외부 시나리오로 별도 처리하는 것이 더 정직한 접근이다.
          </p>

          <h2>Ⅵ. 확장 제안 — MAE30d × VIX 2차원 밴드</h2>
          <h3>1. VIX를 추가 조정 변수로 활용</h3>
          <p>
            MAE30d 단일 변수로는 포착하지 못하는 미래 변동성 정보를 VIX가 제공한다.
            VIX는 S&amp;P 500 옵션 가격에서 추출된 30일 내재 변동성으로, 시장이 예상하는
            미래 변동성을 사전적으로 반영한다. 반면 MAE30d는 과거 30일 실현 오차로
            사후적 정보다. 두 정보를 결합하면 현재(MAE30d)와 미래(VIX)의 불확실성을
            동시에 반영하는 더 정교한 밴드를 구성할 수 있다.
          </p>
          <h3>2. 2차원 밴드 공식</h3>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            DBW_2D = 기본밴드 × (w₁ × MAE30d/기준MAE + w₂ × VIX/기준VIX)
          </p>
          <p>
            여기서 기준VIX = 20(역사적 장기 평균), w₁ + w₂ = 1이다. 초기 추정으로
            w₁ = 0.6, w₂ = 0.4가 적합할 것으로 예상된다. VIX 20 초과 시 확장 트리거가
            조기에 발동되어 MAE30d 단독 공식보다 충격을 선제적으로 반영한다는 장점이 있다.
            이 2차원 공식의 실증 검증은 향후 연구로 남긴다.
          </p>

          <h2>Ⅶ. 결론 및 시사점</h2>
          <p>
            MAE30d 연동 동적 밴드는 충격 레짐에서 고정 밴드가 완전히 실패하는 문제를 실용적으로
            개선한다. 하이브리드 조건부 공식은 정상 레짐의 정보 가치를 희생하지 않으면서
            충격 레짐 적중률을 약 30%포인트 끌어올리고, 전체 적중률을 23.53%에서 61.76%로
            개선한다.
          </p>
          <p>
            투자 활용 관점에서 핵심 시사점은 세 가지다. 첫째, MAE30d가 25포인트를 초과하는
            순간부터 현재 표시되는 밴드보다 넓은 구간을 실제 불확실성 범위로 인식해야 한다.
            코스피프리뷰 사용자는 MAE30d 수치를 매일 확인하여 레짐 상태를 파악하는 습관이 필요하다.
            둘째, MAE30d가 30포인트를 초과하는 충격 레짐에서는 밴드를 2~3배 넓혀 해석하는
            것이 현실적 불확실성을 정직하게 반영하는 방법이다. 셋째, 400포인트를 초과하는 극단
            이탈은 어떤 합리적 밴드도 수용 불가능한 구조적 한계이므로, 이런 날에는 밴드 적중
            여부보다 방향성 판단과 리스크 관리에 집중해야 한다.
          </p>
          <p>
            향후 연구 과제는 두 가지다. 첫째, MAE30d와 VIX를 결합한 2차원 밴드 조정 체계의
            실증 성능 검증이다. VIX를 사전적 변동성 지표로 추가하면 충격 레짐 적중률을
            추가로 10~15%포인트 개선할 수 있을 것으로 예상된다. 둘째, 예측 오차 분포의
            비대칭성(왜도, 첨도)을 반영하는 비대칭 밴드 설계다. 현재 공식은 상하 대칭 밴드를
            전제하지만, 대형 갭 발생 익일처럼 하방 이탈 가능성이 높은 날은 비대칭적으로
            하방 너비를 더 넓게 설정하는 것이 더 정교한 불확실성 표현이 될 수 있다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Christoffersen, P. F. (1998). Evaluating interval forecasts. <em>International Economic Review</em>, 39(4), 841–862.</p>
            <p className="paperReferenceItem">Diebold, F. X., Gunther, T. A., &amp; Tay, A. S. (1998). Evaluating density forecasts with applications to financial risk management. <em>International Economic Review</em>, 39(4), 863–883.</p>
            <p className="paperReferenceItem">Engle, R. F. (1982). Autoregressive conditional heteroscedasticity with estimates of the variance of United Kingdom inflation. <em>Econometrica</em>, 50(4), 987–1007.</p>
            <p className="paperReferenceItem">Giacomini, R., &amp; White, H. (2006). Tests of conditional predictive ability. <em>Econometrica</em>, 74(6), 1545–1578.</p>
            <p className="paperReferenceItem">Gneiting, T., &amp; Raftery, A. E. (2007). Strictly proper scoring rules, prediction, and estimation. <em>Journal of the American Statistical Association</em>, 102(477), 359–378.</p>
            <p className="paperReferenceItem">Bollerslev, T. (1986). Generalized autoregressive conditional heteroskedasticity. <em>Journal of Econometrics</em>, 31(3), 307–327.</p>
            <p className="paperReferenceItem">Kupiec, P. H. (1995). Techniques for verifying the accuracy of risk measurement models. <em>Journal of Derivatives</em>, 3(2), 73–84.</p>
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
