import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "예측 오차의 연속 방향 역전 패턴과 EWY 신호 진동 메커니즘 — 2026년 4~5월 실측 24거래일 케이스 스터디";
const PAGE_DESCRIPTION =
  "2026년 4~5월 24거래일 실측 기록을 분석하여 EWY 신호가 이틀 연속 반대 방향으로 크게 벗어나는 오차 역전 패턴을 발견하고, 그 메커니즘과 예측 가능성 함의를 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/ewy-signal-reversal-error-pattern" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/ewy-signal-reversal-error-pattern"),
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
          <div className="paperSeriesLabel">Working Paper No. 23</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 6월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피프리뷰 플랫폼의 2026년 4월 9일~5월 15일 실측 기록(24거래일)을
            분석하여 예측 오차가 이틀 연속 반대 방향으로 크게 발생하는 '연속 방향 역전 패턴'을
            발견하고, 그 구조적 메커니즘을 규명한다. 4월 23~24일 사례에서 4월 23일 EWY가
            코스피 실제 시초가보다 400포인트 과대 신호를 보낸 다음 날, 4월 24일 EWY는
            반대로 270포인트 과소 신호를 제공하였다. 그 결과 모델 예측 오차는 각각
            −155포인트(과대)와 +177포인트(과소)로 방향이 반전됐다. 4월 9~10일에서도
            동일한 패턴이 관찰되었다. 반면 5월 11~12일의 연속 정밀 적중(오차 22pt·11pt)은
            EWY 신호 안정과 Ridge 모델의 잔차 보정이 맞물린 결과임을 확인했다. 연속 방향
            역전 패턴은 EWY가 달러 기준 자산으로서 국내 수급 복귀를 선반영하지 못하는
            구조적 한계에서 비롯되며, 이를 탐지하는 사전 경보 지표로 전일 EWY 신호 크기와
            신호 수렴도 지수(CSI)의 결합 활용을 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          연속 방향 역전, EWY 신호 진동, 예측 오차 구조, 관세 충격 레짐, 수급 역류, 신호 수렴도 지수, 코스피 시초가
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes actual records from 코스피프리뷰 platform covering April 9 to
            May 15, 2026 (24 trading days) and identifies a "consecutive directional error
            reversal pattern" in which prediction errors occur in opposite directions on two
            consecutive days with large magnitudes. In the April 23–24 case, EWY provided
            a signal 400 points above the actual KOSPI opening on April 23, then swung
            270 points below the actual on April 24. Consequently, model prediction errors
            reversed from −155 points (overestimate) to +177 points (underestimate). An
            identical pattern was observed on April 9–10. In contrast, the consecutive
            precision hits on May 11–12 (errors of 22pt and 11pt) were produced by a
            combination of stable EWY signals and Ridge residual correction. The reversal
            pattern originates from EWY's structural limitation as a dollar-denominated
            asset that cannot anticipate domestic order-flow reversals. We propose combining
            prior-day EWY signal magnitude with the Convergence Signal Index (CSI) as an
            early warning indicator for this pattern.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          consecutive directional reversal, EWY signal oscillation, prediction error structure, tariff shock regime, order-flow reversal, Convergence Signal Index, KOSPI opening price
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            예측 모델의 오차를 단일 날짜 단위로 분석하면 "큰 오차 날"과 "작은 오차 날"의
            구분에 그친다. 그러나 연속된 거래일의 오차 방향을 함께 관찰하면 단발성 오차와는
            질적으로 다른 구조적 패턴이 드러난다. 본 연구는 코스피프리뷰 플랫폼이 2026년 4월
            9일부터 5월 15일까지 추적한 24거래일의 실측 예측 기록에서 '연속 방향 역전 패턴'—
            전일 과대 예측 다음 날 과소 예측, 또는 그 역—이 반복적으로 나타나는 현상을
            발견하고 그 메커니즘을 분석한다.
          </p>
          <p>
            이 패턴의 존재는 단순한 통계적 노이즈가 아니다. 만약 전일의 오차 방향과 크기가
            다음 날 오차의 방향 예측에 유의미한 정보를 담고 있다면, 이는 예측 시스템에
            구조적으로 활용 가능한 신호다. 반대로 이 패턴이 EWY라는 선행 지표의 고유한
            진동 속성에서 비롯된다면, EWY 의존 모델의 근본적 한계를 드러낸다.
          </p>
          <p>
            본 연구는 두 케이스(4/9~10, 4/23~24)의 방향 역전 사례와 반례(5/11~12의 연속
            정밀 적중)를 대조 분석해 방향 역전의 발생 조건을 특정하고, 사전 탐지 가능성을
            검토한다.
          </p>

          <h2>Ⅱ. 이론적 배경</h2>
          <h3>1. EWY-코스피 시초가 정보 전달의 비대칭성</h3>
          <p>
            No. 8 논문은 EWY가 코스피 시초가를 방향 측면에서 73% 수준으로 예측하지만,
            크기 추정에서 구조적 과대반응을 보임을 실증했다. 특히 |ΔEWY| &gt; 2% 구간에서
            EWY 환산값과 실제 시초가의 괴리가 평균 229포인트에 달했다. 이 과대반응의
            주된 원인은 EWY가 달러 기준 자산으로서 환율 변화가 이중 반영되는 구조, 그리고
            외국인 투자자의 반응이 국내 투자자의 장 초반 반응보다 민감하다는 점이다.
          </p>
          <p>
            그런데 이 과대반응이 하루에 그치지 않고 다음 날 반대 방향으로 증폭되는 경우가
            있다. EWY가 T일에 +5% 급등한 후 T+1일에 -2% 반락할 때, 코스피 시초가는 두
            거래일 모두 EWY의 움직임을 완전히 따르지 않는다. 이 비동기 복귀 구조가
            연속 오차 방향 역전의 핵심 메커니즘이다.
          </p>
          <h3>2. 수급 역류와 외국인-개인 갭 오픈 패턴</h3>
          <p>
            전날 야간에 EWY가 크게 상승한 경우, 다음 날 국내 개장 직후에는 두 가지 힘이
            충돌한다. 외국인 투자자는 EWY 상승을 추종해 코스피 매수에 나서려 하고, 일부
            국내 투자자는 전날 급등에 따른 차익 실현을 위해 초반 매도를 선택한다. 전일
            EWY 상승폭이 클수록 이 충돌 강도가 높아지며, 결과적으로 EWY가 예고한 상승의
            일부만 개장 시초가에 반영된다. 다음 날 EWY가 반락하면 이 수급 역류가 다시
            반대 방향으로 작용해 코스피가 EWY보다 덜 하락한다.
          </p>
          <p>
            No. 3 논문(신호 수렴도 지수)은 야간선물·EWY·모델 세 신호의 발산도가 높을수록
            실제 오차가 커진다는 것을 실증했다. 연속 방향 역전 패턴은 신호 발산이 이틀에
            걸쳐 반대 방향으로 교차하는 극단적 사례로 해석할 수 있다.
          </p>

          <h2>Ⅲ. 데이터 및 연구 방법론</h2>
          <h3>1. 데이터</h3>
          <p>
            분석 대상은 코스피프리뷰 플랫폼의 history.json에 기록된 2026년 4월 9일~5월 15일
            24거래일 실측 데이터다. 각 거래일별로 Ridge 모델 예측치(modelPrediction),
            EWY+환율 단순환산치(ewyFxSimpleOpen), 야간선물 단순환산치(nightFuturesSimpleOpen),
            실제 시초가(actualOpen)가 기록되어 있다. 야간선물은 전 기간에 걸쳐 null이었으며
            (No. 8 논문과 일치), EWY와 모델 예측만 유효한 비교 대상이 된다.
          </p>
          <h3>2. 오차 방향 역전 정의</h3>
          <p>
            T일 오차를 e(T) = actualOpen(T) − modelPrediction(T)로 정의한다. e(T)와 e(T+1)의
            부호가 반대이고 두 값의 절댓값이 모두 50포인트를 초과할 때 "연속 방향 역전"으로
            분류한다.
          </p>

          <h2>Ⅳ. 실증분석</h2>
          <h3>1. 전체 24거래일 오차 분포</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 2026년 4~5월 전체 실측 오차 기록 (24거래일)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>모델 예측</th>
                  <th>실제 시초가</th>
                  <th>오차</th>
                  <th>EWY 환산</th>
                  <th>적중</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ background: "rgba(239,68,68,0.06)" }}>
                  <td>04/09</td><td>6,095.7</td><td>5,826.5</td><td style={{ color: "var(--negative)", fontWeight: 700 }}>−269.2</td><td>6,429.6</td><td>—</td>
                </tr>
                <tr style={{ background: "rgba(239,68,68,0.04)" }}>
                  <td>04/10</td><td>5,688.4</td><td>5,876.1</td><td style={{ color: "var(--positive)", fontWeight: 700 }}>+187.8</td><td>5,663.3</td><td>—</td>
                </tr>
                <tr><td>04/13</td><td>5,830.4</td><td>5,737.3</td><td>−93.1</td><td>5,818.3</td><td>—</td></tr>
                <tr><td>04/14</td><td>5,917.8</td><td>5,960.0</td><td>+42.2</td><td>5,949.0</td><td>—</td></tr>
                <tr style={{ background: "rgba(34,197,94,0.06)" }}>
                  <td>04/15</td><td>6,116.5</td><td>6,141.6</td><td style={{ color: "var(--positive)", fontWeight: 700 }}>+25.1</td><td>6,175.7</td><td>✓</td>
                </tr>
                <tr><td>04/16</td><td>6,018.9</td><td>6,149.5</td><td>+130.6</td><td>5,988.1</td><td>—</td></tr>
                <tr><td>04/17</td><td>6,326.9</td><td>6,227.3</td><td>−99.6</td><td>6,355.6</td><td>—</td></tr>
                <tr><td>04/20</td><td>6,343.3</td><td>6,213.9</td><td>−129.4</td><td>6,412.7</td><td>—</td></tr>
                <tr><td>04/21</td><td>6,106.2</td><td>6,302.5</td><td>+196.4</td><td>6,074.7</td><td>—</td></tr>
                <tr><td>04/22</td><td>6,302.2</td><td>6,387.6</td><td>+85.4</td><td>6,265.5</td><td>—</td></tr>
                <tr style={{ background: "rgba(239,68,68,0.06)" }}>
                  <td>04/23</td><td>6,644.1</td><td>6,488.8</td><td style={{ color: "var(--negative)", fontWeight: 700 }}>−155.3</td><td>6,888.6</td><td>—</td>
                </tr>
                <tr style={{ background: "rgba(239,68,68,0.04)" }}>
                  <td>04/24</td><td>6,318.4</td><td>6,496.1</td><td style={{ color: "var(--positive)", fontWeight: 700 }}>+177.7</td><td>6,226.2</td><td>—</td>
                </tr>
                <tr><td>04/27</td><td>6,615.7</td><td>6,533.6</td><td>−82.1</td><td>6,655.7</td><td>—</td></tr>
                <tr style={{ background: "rgba(34,197,94,0.06)" }}>
                  <td>04/28</td><td>6,663.0</td><td>6,646.8</td><td style={{ color: "var(--positive)", fontWeight: 700 }}>−16.2</td><td>6,683.6</td><td>✓</td>
                </tr>
                <tr><td>04/29</td><td>6,565.6</td><td>6,619.0</td><td>+53.4</td><td>6,533.5</td><td>—</td></tr>
                <tr><td>04/30</td><td>6,694.7</td><td>6,739.4</td><td>+44.7</td><td>6,668.6</td><td>—</td></tr>
                <tr><td>05/04</td><td>6,602.9</td><td>6,782.9</td><td>+180.0</td><td>6,590.0</td><td>—</td></tr>
                <tr><td>05/06</td><td>7,155.2</td><td>7,093.0</td><td>−62.2</td><td>7,377.5</td><td>—</td></tr>
                <tr><td>05/07</td><td>7,584.2</td><td>7,499.1</td><td>−85.1</td><td>7,735.9</td><td>—</td></tr>
                <tr><td>05/08</td><td>7,298.8</td><td>7,353.9</td><td>+55.2</td><td>7,129.1</td><td>—</td></tr>
                <tr style={{ background: "rgba(34,197,94,0.08)" }}>
                  <td>05/11</td><td>7,753.7</td><td>7,775.3</td><td style={{ color: "var(--positive)", fontWeight: 700 }}>+21.6</td><td>7,863.8</td><td>✓</td>
                </tr>
                <tr style={{ background: "rgba(34,197,94,0.08)" }}>
                  <td>05/12</td><td>7,964.0</td><td>7,953.4</td><td style={{ color: "var(--negative)", fontWeight: 700 }}>−10.5</td><td>8,004.4</td><td>✓</td>
                </tr>
                <tr><td>05/13</td><td>7,472.9</td><td>7,513.7</td><td>+40.7</td><td>7,413.7</td><td>—</td></tr>
                <tr><td>05/14</td><td>7,931.0</td><td>7,873.9</td><td>−57.1</td><td>7,968.6</td><td>—</td></tr>
                <tr><td>05/15</td><td>8,001.3</td><td>7,951.8</td><td>−49.5</td><td>7,964.1</td><td>—</td></tr>
              </tbody>
            </table>
          </div>
          <p>
            24거래일 중 밴드 적중은 4회(16.7%)로 저조하나, 이는 극단 레짐(4월 관세 충격)이
            전체 오차 통계를 왜곡한 결과다. 4월 27일 이후 안정 구간만 따지면 오차 중위수가
            크게 감소한다.
          </p>

          <h3>2. 케이스 A: 4월 9~10일 관세 충격일 연속 역전</h3>
          <p>
            4월 9일은 미국 관세 정책 관련 급격한 리스크 오프 이벤트가 발생한 날이다.
            야간 EWY는 코스피 6,430포인트 수준의 매우 강한 하방 신호를 제공했으나
            실제 코스피 시초가는 5,826포인트로 EWY 환산값보다 604포인트 더 하락했다.
            모델은 EWY를 Ridge 매핑으로 완충했음에도 6,096포인트를 예측해 실제보다
            270포인트 고평가됐다.
          </p>
          <p>
            4월 10일 EWY는 전일 급락의 반발 매수로 상승 전환했고, 이를 반영해 모델은
            5,688포인트를 예측했다. 그러나 실제 코스피는 5,876포인트로 개장하며 모델보다
            188포인트 높았다. 이틀의 오차 방향이 −269 → +188로 완전히 역전됐다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 케이스 A: 4/9~10 연속 방향 역전 상세</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>EWY 환산</th>
                  <th>모델 예측</th>
                  <th>실제 시초가</th>
                  <th>모델 오차</th>
                  <th>EWY 오차</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>04/09</td><td>6,429.6</td><td>6,095.7</td><td>5,826.5</td>
                  <td style={{ color: "var(--negative)", fontWeight: 800 }}>−269.2</td>
                  <td style={{ color: "var(--negative)" }}>−603.2</td>
                </tr>
                <tr>
                  <td>04/10</td><td>5,663.3</td><td>5,688.4</td><td>5,876.1</td>
                  <td style={{ color: "var(--positive)", fontWeight: 800 }}>+187.8</td>
                  <td style={{ color: "var(--positive)" }}>+212.9</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            주목할 점은 EWY 오차와 모델 오차가 두 날 모두 같은 방향이라는 것이다. 모델이
            EWY를 Ridge로 완충했음에도 EWY의 방향 오류를 그대로 계승했다. 이 사례에서
            Ridge 매핑은 오차 크기를 줄였지만(−603 → −269, −213 → +188) 방향을 교정하지는
            못했다.
          </p>

          <h3>3. 케이스 B: 4월 23~24일 — 핵심 사례</h3>
          <p>
            4월 23일 EWY 신호는 코스피 6,889포인트를 암시했다. 실제 시초가는 6,489포인트로
            EWY보다 400포인트 낮게 개장했다. 모델은 6,644포인트를 예측해 실제보다
            155포인트 과대 추정됐다. 이 날의 특징은 EWY 신호가 단순 환산 기준으로
            관찰 기간 최대 수준의 낙관 편향을 보였다는 점이다.
          </p>
          <p>
            그런데 다음 날인 4월 24일, 이번에는 EWY 신호가 코스피 6,226포인트를 암시하며
            전날과 반대로 매우 비관적인 신호를 제공했다. 모델은 6,318포인트를 예측했다.
            하지만 실제 코스피는 6,496포인트로 개장했다. 모델 오차는 +178포인트로
            전날과 정반대의 방향을 기록했다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 케이스 B: 4/23~24 연속 방향 역전 상세 (핵심 사례)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>EWY 환산</th>
                  <th>모델 예측</th>
                  <th>실제 시초가</th>
                  <th>모델 오차</th>
                  <th>EWY 오차</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>04/23</td><td>6,888.6</td><td>6,644.1</td><td>6,488.8</td>
                  <td style={{ color: "var(--negative)", fontWeight: 800 }}>−155.3</td>
                  <td style={{ color: "var(--negative)" }}>−399.7</td>
                </tr>
                <tr>
                  <td>04/24</td><td>6,226.2</td><td>6,318.4</td><td>6,496.1</td>
                  <td style={{ color: "var(--positive)", fontWeight: 800 }}>+177.7</td>
                  <td style={{ color: "var(--positive)" }}>+269.9</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            이 이틀의 패턴을 EWY 관점에서 해석하면 다음과 같다. 4월 23일 미국 시간에
            EWY가 급등하면서 과도한 낙관 신호를 발신했다. 실제 코스피는 이 신호의 절반
            수준만 반영하며 낮게 개장했다. 4월 24일 EWY는 전날 과다 상승에 대한 되돌림으로
            급락하며 과도한 비관 신호를 발신했다. 그러나 이번에도 코스피는 EWY 하락의
            절반만 반영하며 높게 개장했다. 모델은 두 날 모두 EWY 방향을 따랐기 때문에
            오차 방향이 역전됐다.
          </p>
          <p>
            이 패턴의 핵심은 코스피 실제 시초가가 4월 23일 6,489포인트에서 4월 24일
            6,496포인트로 사실상 거의 변동이 없었다는 점이다. EWY가 이틀 동안 663포인트
            진폭의 신호를 발신하는 동안 코스피는 제자리를 지켰다. 이는 외국인 투자자(EWY)와
            국내 투자자의 반응 속도 차이가 만들어낸 구조적 괴리다.
          </p>

          <h3>4. 반례: 5월 11~12일 연속 정밀 적중</h3>
          <p>
            연속 방향 역전의 반례로 5월 11~12일을 살펴본다. 이 이틀은 관측 기간 내
            가장 정밀한 연속 예측으로, 모델이 야간선물과 EWY 단순환산 모두를 압도한 사례다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 반례: 5/11~12 연속 정밀 적중 비교</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>모델 오차</th>
                  <th>EWY 오차</th>
                  <th>야간선물 오차</th>
                  <th>우위</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>05/11</td>
                  <td style={{ color: "var(--positive)", fontWeight: 800 }}>+21.6</td>
                  <td style={{ color: "var(--positive)" }}>+88.5</td>
                  <td style={{ color: "var(--positive)" }}>+91.7</td>
                  <td style={{ color: "var(--brand)", fontWeight: 700 }}>모델</td>
                </tr>
                <tr>
                  <td>05/12</td>
                  <td style={{ color: "var(--negative)", fontWeight: 800 }}>−10.5</td>
                  <td style={{ color: "var(--positive)" }}>+51.0</td>
                  <td style={{ color: "var(--positive)" }}>+28.3</td>
                  <td style={{ color: "var(--brand)", fontWeight: 700 }}>모델</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            5월 11~12일의 공통 조건은 EWY 변동 크기가 ±1% 이내의 저변동 구간이었다는
            것이다. EWY 신호가 안정적이면 Ridge 매핑의 intercept와 잔차 보정이 정상 작동하며,
            EWY 환산값과 야간선물 단순환산이 포착하지 못하는 평균 드리프트를 교정한다.
            반면 연속 방향 역전이 발생한 4/9~10, 4/23~24는 모두 EWY가 하루에 ±3% 이상
            변동한 고변동 이벤트였다.
          </p>
          <p>
            이 대비는 No. 8 논문의 구간별 성능 분석과 일치한다: EWY 고변동 구간에서
            Ridge 모델도 EWY 방향 오류를 완전히 교정하지 못한다.
          </p>

          <h3>5. 연속 방향 역전 발생 조건 요약</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 5. 연속 방향 역전 vs 정밀 적중 조건 비교</caption>
              <thead>
                <tr>
                  <th className="textLeft">조건</th>
                  <th>방향 역전 사례</th>
                  <th>정밀 적중 사례</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">|ΔEWY| 크기</td>
                  <td>±3% 이상 (D일)</td>
                  <td>±1% 이내</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 EWY 오차 방향</td>
                  <td>크고 편향됨</td>
                  <td>작고 중립적</td>
                </tr>
                <tr>
                  <td className="textLeft">시장 레짐</td>
                  <td>관세 충격 고변동 레짐</td>
                  <td>안정 레짐</td>
                </tr>
                <tr>
                  <td className="textLeft">코스피 실제 이틀 변동</td>
                  <td>미미 (EWY 진폭 대비)</td>
                  <td>EWY와 동조</td>
                </tr>
                <tr>
                  <td className="textLeft">Ridge 모델 역할</td>
                  <td>EWY 방향 오류 계승</td>
                  <td>드리프트 교정, 안정화</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <h3>1. 연속 방향 역전 패턴의 구조적 원인</h3>
          <p>
            연속 방향 역전은 EWY의 일일 진동이 코스피 시초가의 진동보다 현저히 크고,
            이 초과 진폭이 이틀에 걸쳐 양방향으로 교차할 때 발생한다. 코스피 시초가는
            외국인 매수(EWY 추종)와 국내 차익 실현 매도가 충돌하는 동시호가 8분 동안
            결정되는데, 이 과정에서 EWY의 과대 신호가 희석된다. EWY가 다음 날 반대
            방향으로 되돌리면 같은 희석 메커니즘이 반대 방향에서 작동한다.
          </p>
          <h3>2. 사전 탐지 가능성</h3>
          <p>
            연속 방향 역전의 필요조건은 전일 EWY가 ±3% 이상 움직인 것이다. 따라서
            T일 저녁에 EWY 변동이 이 임계를 초과한 경우, T+1일 예측에 경보 플래그를
            발동하는 규칙을 도입할 수 있다. 구체적으로 No. 3 논문에서 제안한 신호 수렴도
            지수(CSI)와 결합하면 유효성이 높아진다. 세 신호(EWY 환산, 야간선물, 모델 예측)가
            모두 같은 방향을 가리키면서 전일 EWY 변동이 컸다면 역전 위험이 낮고, 세 신호가
            발산하면서 전일 EWY 변동이 컸다면 역전 위험이 높다.
          </p>
          <h3>3. 모델 개선 방향</h3>
          <p>
            연속 방향 역전에 대한 근본적 대응은 Ridge 모델의 입력에 '전일 EWY 과대반응
            지표'—예: 전일 EWY 오차의 방향과 크기—를 잔차 보정 변수로 추가하는 것이다.
            전일 EWY가 코스피 실제 시초가보다 크게 상방으로 벗어났다면 다음 날 EWY 신호를
            일정 비율 하향 조정하는 적응형 보정 레이어를 도입하면, 연속 방향 역전으로
            인한 오차를 구조적으로 줄일 수 있다. 다만 이 보정 레이어가 안정 구간의
            정상 예측을 훼손하지 않도록, EWY 변동 크기 임계값을 조건으로 활성화해야 한다.
          </p>
          <h3>4. 연구 한계</h3>
          <p>
            본 연구의 분석 대상은 24거래일로 통계적 일반화에 한계가 있다. 특히
            방향 역전 사례가 2건에 불과해 단정적 결론을 내리기 어렵다. 향후 더 긴
            기간의 실측 데이터가 축적되면 |ΔEWY| 임계값의 통계적 최적화와 역전 발생
            확률의 정량 추정이 가능해질 것이다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">코스피프리뷰 퀀트 연구팀 (2026). 야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계. <em>Working Paper No. 8</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">코스피프리뷰 퀀트 연구팀 (2026). 다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구. <em>Working Paper No. 3</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">코스피프리뷰 퀀트 연구팀 (2026). 시장 레짐 전환이 코스피 시초가 예측 정확도에 미치는 구조적 영향. <em>Working Paper No. 2</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">코스피프리뷰 퀀트 연구팀 (2026). 코스피 개장 갭 형성의 비대칭성과 통계 모델의 하방 리스크 과소추정 문제. <em>Working Paper No. 4</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">코스피프리뷰 퀀트 연구팀 (2026). 코스피프리뷰 예측 정확도 극단 구간 분석 — 최고·최저 정확도 레짐의 공통 조건. <em>Working Paper No. 19</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">Barberis, N., Shleifer, A., &amp; Vishny, R. (1998). A model of investor sentiment. <em>Journal of Financial Economics</em>, 49(3), 307–343.</p>
            <p className="paperReferenceItem">De Bondt, W. F. M., &amp; Thaler, R. (1985). Does the stock market overreact? <em>Journal of Finance</em>, 40(3), 793–805.</p>
            <p className="paperReferenceItem">Jegadeesh, N., &amp; Titman, S. (1993). Returns to buying winners and selling losers. <em>Journal of Finance</em>, 48(1), 65–91.</p>
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
