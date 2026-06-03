import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "공휴일 시나리오 코스피 시초가 예측 모델의 설계 원리와 성능 경계 — 야간선물 브릿지 없는 EWY 직접 기준 예측 체계";
const PAGE_DESCRIPTION =
  "국내 공휴일에 KRX가 휴장하고 미국 시장이 운영 중인 시나리오에서 야간선물 브릿지 없이 마지막 KRX 거래일 EWY 종가를 기준점으로 삼는 공휴일 전용 예측 모델의 설계 원리와 성능 경계를 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/holiday-ewy-direct-prediction-model" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/holiday-ewy-direct-prediction-model"),
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
          <div className="paperSeriesLabel">Working Paper No. 22</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 6월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            국내 공휴일에 KRX가 휴장하더라도 미국 시장이 정상 운영되는 경우, 기존 야간선물
            브릿지 기반 예측 모델은 작동하지 못한다. 본 연구는 이 구조적 공백을 메우기 위해
            야간선물 브릿지 없이 마지막 KRX 거래일의 EWY 미국 정규장 종가를 기준점으로
            삼는 EWY 직접 기준 예측 모델(모델2)을 설계하고, 그 성능 경계를 분석한다.
            기존 Ridge 계수(β_EWY=0.3535, β_KRW=0.200)를 재활용하되, 예측 밴드를
            1.5배 확장하여 기준점 시간 거리 증가에 따른 불확실성을 반영한다. 공휴일 감지는
            ^KS11 당일 장중 데이터의 공백으로 직접 확인한다. 2026년 4~5월 실측 데이터와
            연계 분석에 따르면, EWY 변동이 ±1% 이내인 저변동 구간에서는 방향 정확도 83%로
            정상 모드에 근접한 성능이 기대된다. ±2% 초과 고변동 구간에서는 방향 정확도가
            60% 수준으로 하락하며 확장 밴드가 필수적이다. 기준점의 시간 거리(약 20~30시간)는
            정상 모드보다 길지만, 미국 정규장 종가의 높은 유동성과 가격 안정성이 단기
            프리마켓 신호 대비 성능 열위를 부분적으로 상쇄한다. 향후 삼성전자·SK하이닉스
            ADR 신호 통합, KRW NDF 1개월물 활용, 공휴일 전용 Rolling Ridge 계수 추정 등을
            통해 성능을 단계적으로 개선할 수 있다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          공휴일 예측, EWY 직접 기준, 야간선물 브릿지 우회, 코스피 시초가, 기준점 시간 거리, Ridge 회귀, 격리 모듈 설계
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            When the KRX is closed on a domestic public holiday while U.S. markets continue
            operating, the existing night-futures-bridge-based prediction model cannot function.
            This study designs an EWY Direct Basis prediction model (Model 2) that bypasses
            the night-futures bridge by anchoring to the last KRX trading day's U.S. regular
            session EWY closing price, and analyzes its performance boundaries. The model
            reuses the existing Ridge coefficients (β_EWY=0.3535, β_KRW=0.200) while expanding
            the prediction band by a factor of 1.5 to reflect increased uncertainty from the
            longer reference horizon. Holiday detection is performed directly by checking the
            absence of ^KS11 intraday data for the current KST date. Based on analysis linked
            to actual records from April–May 2026, directional accuracy of 83% is expected in
            low-volatility regimes (|ΔEWY| ≤ 1%), approaching normal-mode performance. In
            high-volatility regimes (|ΔEWY| &gt; 2%), directional accuracy falls to approximately
            60%, making band expansion essential. Although the reference horizon (~20–30 hours)
            is longer than in normal mode, the higher liquidity and price stability of the U.S.
            regular session close partially offsets the performance disadvantage relative to
            short-window premarket signals. Future improvements include integrating Samsung
            Electronics and SK Hynix ADR signals, using KRW NDF 1-month rates, and estimating
            holiday-specific Rolling Ridge coefficients as actual data accumulates.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          holiday prediction, EWY direct basis, night-futures bridge bypass, KOSPI opening price, reference horizon, Ridge regression, isolated module design
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측 시스템은 KRX가 운영되는 정상 거래일을 전제로 설계된다.
            KRX 종가(15:30 KST)를 기준으로 KOSPI 200 야간선물의 움직임을 브릿지 앵커로
            삼아 다음 날 시초가를 예측하는 구조가 그 핵심이다. 그러나 국내 공휴일에는
            이 전제가 성립하지 않는다. KRX가 휴장하면 당일 종가가 없고, 야간선물 세션도
            열리지 않는다. 기존 모델은 이 날 예측을 수행하지 못하고 대기 상태로 진입한다.
          </p>
          <p>
            문제는 공휴일에도 미국 시장은 정상 운영되며 EWY ETF와 달러-원 환율은 실시간으로
            변동한다는 것이다. 다음 KRX 개장일(공휴일 다음 첫 거래일)의 시초가를 결정짓는
            핵심 정보가 공휴일 중 미국 시장에서 형성되고 있음에도, 예측 시스템은 이를
            반영하지 못한다. 이 공백은 특히 지방선거일·임시공휴일 같이 주중 단일 공휴일에서
            빈번하게 발생하며, 국내 투자자가 다음 날 시초가를 가늠할 수 있는 정보 채널을
            차단한다.
          </p>
          <p>
            본 연구는 이 문제를 해결하기 위한 EWY 직접 기준 예측 모델(이하 모델2)을
            제안한다. 모델2는 야간선물 브릿지 없이 마지막 KRX 거래일의 EWY 미국 정규장
            종가를 기준점으로 삼아 공휴일 중 실시간으로 갱신되는 독립 예측값을 생성한다.
            기존 모델(모델1)의 코드와 JSON 출력에 일절 영향을 주지 않는 완전 격리 모듈로
            구현되었으며, 기존 Ridge 계수를 재활용해 별도 훈련 없이 즉시 운용 가능하다.
          </p>

          <h2>Ⅱ. 이론적 배경</h2>
          <h3>1. 야간선물 브릿지의 역할과 한계</h3>
          <p>
            정상 거래일 모델1의 핵심 메커니즘은 KRX 종가(15:30 KST)와 미국 프리마켓
            개장(17:00~18:00 KST) 사이의 약 2시간 갭을 K200 야간선물의 움직임으로 메우는
            브릿지 절차다. 야간선물은 해당 구간에서 CME 또는 SGX에서 거래되며, 이 브릿지가
            EWY 입력의 기준점 역할을 한다. 야간선물 브릿지 이후부터는 EWY와 달러-원 환율의
            로그 수익률을 실시간으로 반영해 예측값을 갱신한다.
          </p>
          <p>
            그러나 KOSPI Dawn 플랫폼의 2026년 4~5월 실측 기록(No. 8 논문)에서 야간선물은
            27거래일 전 기간에 걸쳐 null을 기록했다. 야간 K200 선물의 CME·SGX 유동성이
            2025년 이후 급감하면서 신뢰할 수 있는 브릿지 앵커를 제공하지 못하는 상황이
            사실상 일상화된 것이다. 역설적으로, 모델1도 야간선물 없이 EWY만으로 가동되는
            경우가 대부분이며 이는 모델2의 접근 방식을 실질적으로 정당화한다.
          </p>
          <h3>2. 기준점 시간 거리(Reference Horizon) 개념</h3>
          <p>
            예측 모델의 입력 기준점과 현재 시점 사이의 시간 간격을 기준점 시간 거리(Reference
            Horizon, RH)로 정의한다. 정상 모드에서 EWY의 RH는 브릿지 시점 이후의
            경과 시간으로 최대 수 시간이다. 공휴일 모드에서는 마지막 KRX 거래일 EWY 종가(약
            미국 시간 16:00)부터 현재 미국 장중 시각까지의 시간으로, 전형적으로 20~30시간에
            달한다.
          </p>
          <p>
            RH가 길어질수록 기준점 이후 EWY에 영향을 주는 비관련 변수—미국 고유의 거시
            이벤트, 섹터 로테이션, ETF 운용 수급—가 누적된다. 이는 EWY 수익률 중 한국
            시초가와 무관한 노이즈 성분을 증가시켜 Ridge 모델의 신호 대 잡음비를 악화시킨다.
            단, 미국 정규장 종가는 프리마켓·애프터마켓보다 유동성이 충분해 가격 발견이
            안정적이라는 장점이 있다. 이 상충 관계가 공휴일 모드 성능의 핵심 변수다.
          </p>
          <h3>3. EWY-코스피 가격 전달 계수의 시변성</h3>
          <p>
            No. 5 논문은 EWY-코스피 가격 전달 계수(β_EWY)가 시장 레짐에 따라 0.25~0.45
            사이에서 연속적으로 변동하는 시변 파라미터임을 실증했다. 현재(2026년 5월 기준)
            추정값 β_EWY=0.3535는 180거래일 Rolling Ridge로 갱신된다. 공휴일 모드는
            이 계수를 그대로 재활용하므로, 공휴일 직전 레짐에서 추정된 계수가 공휴일 다음
            거래일에도 유효하다는 가정에 의존한다. 공휴일이 레짐 전환의 경계점이 되는
            경우—예: 급락 후 공휴일—에는 이 가정이 깨질 수 있으며 성능 저하의 주요 원인이 된다.
          </p>

          <h2>Ⅲ. 모델 설계</h2>
          <h3>1. 공휴일 감지 메커니즘</h3>
          <p>
            모델2의 첫 단계는 "오늘 KRX가 휴장인가"를 판단하는 것이다. 법정 공휴일 목록
            데이터베이스 대신, Yahoo Finance에서 ^KS11 당일(KST 기준) 장중 1분봉 데이터를
            직접 조회하는 방식을 채택했다. 데이터가 반환되지 않거나, 반환된 데이터의 최신
            캔들 날짜가 오늘 KST 날짜와 일치하지 않으면 공휴일로 판정한다.
          </p>
          <p>
            이 방식은 패키지 의존성 없이 실제 거래 여부를 직접 확인하므로, 임시공휴일·
            선거일·대체공휴일 등 사전 목록에 없는 휴장일도 자동 감지한다. 주말은 Python
            weekday() 체크로 사전 필터링한다.
          </p>
          <h3>2. EWY 기준점 설정</h3>
          <p>
            공휴일 감지 후 Yahoo Finance에서 ^KS11 최근 10거래일 일봉을 조회해 마지막
            KRX 거래일(D-1)과 해당일의 KOSPI 종가(prevClose)를 확정한다. EWY 기준점은
            같은 미국 달력 날짜의 EWY 정규장 종가로 설정한다. KRX D-1 종가(15:30 KST =
            06:30 UTC)와 EWY D-1 미국 종가(16:00 EDT = 20:00 UTC)는 동일 달력일에 해당하며
            Yahoo Finance의 일봉 데이터에서 동일 날짜로 조회된다. USD/KRW 기준점도
            같은 방식으로 D-1 종가를 사용한다.
          </p>
          <h3>3. 예측 계산</h3>
          <p>
            EWY와 USD/KRW의 로그 수익률을 기준점으로부터 계산한다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.88rem", background: "var(--surface-strong)", padding: "14px 18px", borderRadius: "6px", lineHeight: "1.8" }}>
            r_EWY = ln(EWY_current / EWY_baseline) × 100
            <br />
            r_KRW = ln(KRW_current / KRW_baseline) × 100
            <br />
            core_pct = α + β_EWY × r_EWY + β_KRW × r_KRW
            <br />
            kospi_pct = intercept_K200 + β_K200 × core_pct
            <br />
            pointPrediction = prevClose × exp(kospi_pct / 100)
          </p>
          <p>
            계수 α, β_EWY, β_KRW, intercept_K200, β_K200는 기존 backtest_diagnostics.json에서
            읽어온다. 별도 훈련 없이 모델1과 동일한 Ridge 계수를 재사용한다.
          </p>
          <h3>4. 신뢰도 조정 밴드</h3>
          <p>
            RH가 길어질수록 예측 불확실성이 증가하므로, 공휴일 모드에서는 정상 모드 밴드의
            1.5배를 적용한다. 구체적으로 반폭(half-band)을 MAE × 1.5 × prevClose / 100로
            계산한다. 이는 No. 8 논문이 EWY 대체 신호의 고변동 구간에서 동적 밴드 확장을
            권고한 것과 일치한다.
          </p>
          <h3>5. 격리 모듈 구조</h3>
          <p>
            모델2는 기존 시스템 파일 어디에도 의존하지 않는 완전 격리 모듈로 구현됐다.
            출력 JSON(holiday_prediction.json, holiday_prediction_series.json,
            holiday_history.json)은 별도 경로에 저장되며, 기존 prediction.json은 공휴일
            여부와 무관하게 변경되지 않는다. 모델2 스크립트가 실패하더라도 기존 서비스에는
            영향이 없다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 모델1(정상 모드)과 모델2(공휴일 모드) 구조 비교</caption>
              <thead>
                <tr>
                  <th className="textLeft">항목</th>
                  <th className="textLeft">모델1 (정상 모드)</th>
                  <th className="textLeft">모델2 (공휴일 모드)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY 기준점</td>
                  <td className="textLeft">야간선물 브릿지 시점 (17~18시 KST)</td>
                  <td className="textLeft">마지막 KRX 거래일 EWY 정규장 종가</td>
                </tr>
                <tr>
                  <td className="textLeft">기준점 시간 거리</td>
                  <td className="textLeft">수 시간 (가변)</td>
                  <td className="textLeft">20~30시간 (1 거래일 갭)</td>
                </tr>
                <tr>
                  <td className="textLeft">Ridge 계수</td>
                  <td className="textLeft">기존 계수 사용</td>
                  <td className="textLeft">동일 계수 재사용</td>
                </tr>
                <tr>
                  <td className="textLeft">밴드 폭</td>
                  <td className="textLeft">MAE × 1.0 기준</td>
                  <td className="textLeft">MAE × 1.5 (확장)</td>
                </tr>
                <tr>
                  <td className="textLeft">야간선물 입력</td>
                  <td className="textLeft">브릿지용 (보조)</td>
                  <td className="textLeft">없음</td>
                </tr>
                <tr>
                  <td className="textLeft">출력 파일</td>
                  <td className="textLeft">prediction.json</td>
                  <td className="textLeft">holiday_prediction.json (분리)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Ⅳ. 성능 분석</h2>
          <h3>1. EWY 변동 구간별 기대 성능</h3>
          <p>
            No. 8 논문의 실측 데이터(27거래일, 2026년 4~5월)는 EWY 단독 대체 신호의
            성능을 변동 크기 구간별로 측정했다. 모델2는 Ridge 매핑 레이어를 통해 단순
            EWY 환산값보다 정밀하지만, EWY 신호의 구간별 신뢰도 구조는 그대로 상속한다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 2. EWY 변동 구간별 모델2 기대 성능 (No. 8 논문 실측 기반 추정)</caption>
              <thead>
                <tr>
                  <th className="textLeft">|ΔEWY| 구간</th>
                  <th>기대 MAE (단순환산)</th>
                  <th>방향 정확도</th>
                  <th className="textLeft">모델2 판단</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">≤ 1%</td>
                  <td>~48pt</td>
                  <td>83%</td>
                  <td className="textLeft">정상 모드에 근접, 밴드 표준</td>
                </tr>
                <tr>
                  <td className="textLeft">1~2%</td>
                  <td>~94pt</td>
                  <td>73%</td>
                  <td className="textLeft">방향 참고 가능, 밴드 확장 적용</td>
                </tr>
                <tr>
                  <td className="textLeft">&gt; 2%</td>
                  <td>~229pt</td>
                  <td>60%</td>
                  <td className="textLeft">방향 신뢰도 낮음, 광폭 밴드 필수</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            Ridge 매핑 레이어는 EWY 수익률의 과대반응을 K200-KOSPI 매핑 beta(0.3177)와
            intercept로 완충한다. 단순 EWY 환산값(ewyFxSimplePoint) 대비 실제 예측 오차가
            감소할 것으로 예상되나, 이 개선 폭은 공휴일 실측 데이터가 축적된 후에야
            정량화가 가능하다.
          </p>
          <h3>2. 기준점 시간 거리의 영향</h3>
          <p>
            정상 모드 EWY 기준점(17~18시 KST)에서 다음 날 09시 KST까지의 RH는 약 15~16시간이다.
            공휴일 모드에서 마지막 KRX 거래일 EWY 종가(한국 시간 익일 05:00)부터
            공휴일 다음 거래일 09:00 KST까지의 RH는 약 28~32시간이다.
          </p>
          <p>
            RH 차이로 인해 누적되는 추가 노이즈는 주로 두 채널에서 온다. 첫째, 미국 시장의
            고유 이벤트(연준 발언, 미국 경제지표)가 한국 시초가와 무관하게 EWY를 이동시킨다.
            둘째, EWY 내 한국 이외 익스포저—ETF 구성 종목 비율 변화, 배당 효과—가 누적된다.
            단, 미국 정규장 종가는 유동성이 충분해 가격 발견이 안정적이며, 프리마켓 신호에
            비해 스프레드와 변동성이 낮다. 저변동 공휴일에서 이 안정성이 RH 증가의 노이즈
            비용을 상당 부분 상쇄한다.
          </p>
          <h3>3. 연속 공휴일 시나리오</h3>
          <p>
            추석·설 연휴처럼 연속 공휴일(2일 이상)에서는 EWY의 RH가 며칠 치 미국 세션을
            포함하게 된다. 이 경우 누적 노이즈가 급증하며 예측 오차가 크게 증가한다.
            현재 구현은 연속 공휴일에 대한 별도 처리 없이 단일 공휴일과 동일한 로직을
            적용한다. 향후 RH에 비례한 추가 밴드 확장—예: 2일 공휴일은 밴드 ×2.0—을
            도입하면 신뢰 구간의 정직성을 높일 수 있다.
          </p>

          <h2>Ⅴ. 향후 발전 방향</h2>
          <h3>1. ADR 신호 통합</h3>
          <p>
            코스피 내 삼성전자·SK하이닉스의 시가총액 비중(2026년 현재 약 38%)을 고려하면,
            두 종목의 미국 ADR 가격 변동은 코스피 시초가에 직접적인 영향을 미친다.
            공휴일 중 두 ADR의 수익률을 Ridge 잔차 신호로 추가하면, EWY가 포착하지 못하는
            종목별 정보를 보완할 수 있다. 특히 반도체 업황 이벤트가 공휴일과 겹치는 경우
            ADR 신호의 한계 개선 기여가 클 것으로 예상된다.
          </p>
          <h3>2. KRW NDF 활용</h3>
          <p>
            공휴일에 국내 FX 시장이 열리지 않더라도 역외 달러-원 NDF(Non-Deliverable
            Forward) 1개월물은 24시간 거래된다. NDF에서 형성되는 달러-원 기대값은 공휴일
            중 외국인 투자자의 환율 전망을 반영하며, Yahoo Finance KRW=X보다 정밀한
            환율 신호를 제공할 수 있다. NDF 데이터의 실시간 수집 체계가 갖춰지면
            β_KRW 채널의 정확도를 개선할 여지가 있다.
          </p>
          <h3>3. 공휴일 전용 Rolling Ridge 추정</h3>
          <p>
            현재 모델2는 모델1의 계수를 그대로 재사용한다. 공휴일 예측 실측 데이터가
            충분히 축적되면(목표: 30건 이상), 공휴일 전용 Rolling Ridge를 별도로 추정할
            수 있다. 공휴일 시나리오에서의 EWY-코스피 전달 계수는 정상 거래일과
            다를 가능성이 있다. 거래 공백 이후 첫 개장에서 외국인 투자자의 반응 패턴,
            개인 투자자의 갭 추격 매매, 기관의 헤지 언와인딩이 β를 왜곡할 수 있기 때문이다.
          </p>
          <h3>4. 정상 모드에의 응용</h3>
          <p>
            야간선물이 구조적으로 null인 현재(No. 8 논문: 27거래일 전무), 정상 모드도
            사실상 EWY 직접 기준으로 작동하고 있다. 차이는 브릿지 앵커 처리 방식뿐이다.
            모델2의 접근—전일 종가 기준점, 이후 EWY 로그 수익률 직접 적용—이 야간선물
            브릿지 의존도를 낮추는 정상 모드 설계 대안으로 채택될 수 있다. 특히
            야간선물 유동성 공백이 장기화되는 환경에서, 브릿지 없는 EWY 직접 기준의
            일관성이 브릿지 기반 방식의 간헐적 오작동보다 안정적일 수 있다.
          </p>
          <h3>5. 다중 공휴일 캘린더와 예측 연속성</h3>
          <p>
            현재 구현은 단일 공휴일을 전제한다. 한국과 미국이 동시에 공휴일인 경우(예:
            크리스마스)에는 미국 시장도 닫혀 모델2의 입력이 없다. 이를 처리하기 위해
            미국 시장 활성 여부를 독립적으로 확인하는 로직이 이미 구현되어 있다. 향후
            연속 공휴일의 일수에 비례한 RH 기반 밴드 스케일링을 도입하면 다양한 공휴일
            시나리오를 일관된 방식으로 처리할 수 있다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">KOSPI Dawn 퀀트 연구팀 (2026). 야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계 — 2026년 4~5월 실측 기록 분석. <em>Working Paper No. 8</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">KOSPI Dawn 퀀트 연구팀 (2026). EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의. <em>Working Paper No. 5</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">KOSPI Dawn 퀀트 연구팀 (2026). MAE30d 연동 동적 예측 밴드 너비 조정 체계. <em>Working Paper No. 15</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">KOSPI Dawn 퀀트 연구팀 (2026). 코스피 시초가 예측 모델의 계층적 설계 체계. <em>Working Paper No. 7</em>. kospipreview.com.</p>
            <p className="paperReferenceItem">Darrat, A. F., &amp; Rahman, S. (1995). Has futures trading activity caused stock price volatility? <em>Journal of Futures Markets</em>, 15(5), 537–557.</p>
            <p className="paperReferenceItem">Ivanov, S. I., &amp; Lenkey, S. L. (2018). Are there arbitrage profits in ETF pricing? <em>Journal of Banking &amp; Finance</em>, 87, 205–220.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Martens, M., &amp; Poon, S. H. (2001). Returns synchronization and daily correlation dynamics between international stock markets. <em>Journal of Banking &amp; Finance</em>, 25(10), 1805–1827.</p>
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
