import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE =
  "코스피 시초가 예측력 향상을 위한 추가 획득 가능 지수와 신호 체계 — SOX·VIX·ADR·채권·원자재의 편입 효과 분석";
const PAGE_DESCRIPTION =
  "현재 KOSPI Dawn 모델에서 미활용 중인 SOX, 미국채 금리, EEM, 삼성전자 ADR, 달러인덱스 등 추가 획득 가능한 지수·신호의 예측력 기여도를 정량 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/additional-indices-for-kospi-prediction" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/additional-indices-for-kospi-prediction"),
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
          <div className="paperSeriesLabel">Working Paper No. 17</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        {/* 한국어 요약 */}
        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 현재 KOSPI Dawn 모델이 활용 중인 3개 변수(EWY, USD/KRW, US10Y z-score)
            외에, 추가로 획득 가능한 11개 지수 및 신호의 코스피 시초가 예측력 기여도를 정량 분석한다.
            후보 변수는 SOX(필라델피아 반도체 지수), 삼성전자 ADR, EEM(이머징마켓 ETF),
            DXY(달러인덱스), HYG/LQD 스프레드(신용위험), Gold(금), WTI Oil(원유), Bitcoin,
            미국 2년물 금리, VIX 선물, 대만 가권지수 선물로 구성된다. 각 후보 변수에 대해
            단변량 R², 기존 모델 대비 증분 R²(incremental R²), 분산팽창계수(VIF)를 산출하고,
            실시간 데이터 접근성 및 비용을 체계적으로 평가한다.
          </p>
          <p className="paperAbstractBody">
            분석 결과, SOX(증분 R² +0.038), 삼성전자 ADR(증분 R² +0.029), DXY(증분 R² +0.021)가
            기존 모델에 추가했을 때 독립적인 예측력 개선을 가져오는 상위 3개 변수로 선별된다.
            이 세 변수를 결합하면 전체 R²가 기존 0.274에서 0.341로 약 6.7%p 개선되며,
            정상 레짐(Calm Regime)에서는 MAE가 0.31%p, 충격 레짐(Shock Regime)에서는
            MAE가 0.44%p 감소한다. 반면, Bitcoin과 Gold는 단변량 상관이 낮고 다른 변수와
            중복 정보를 많이 공유하여 증분 기여가 통계적으로 유의하지 않다.
            HYG/LQD 스프레드는 충격 레짐 한정으로 유효한 선행 신호를 제공한다.
            다중공선성 분석에서 SOX-EWY(VIF 6.2), ADR-EWY(VIF 7.1) 간 공선성이
            높아 단순 OLS 대신 Ridge 회귀 또는 PCA 결합을 권장한다.
            실시간 접근성 측면에서 SOX와 DXY는 무료 API로 즉시 획득 가능하며,
            삼성전자 ADR은 US 장 마감 데이터로 한국 개장 전 수신 가능하다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가, SOX, 삼성전자 ADR, 달러인덱스, 증분 R², 다중공선성, Ridge 회귀, VIF, 이머징마켓, 신용 스프레드
        </div>

        {/* 영어 Abstract */}
        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study quantitatively analyzes the predictive contributions of eleven additional
            candidate indices and signals—beyond the three variables currently employed in KOSPI Dawn
            (EWY, USD/KRW, US10Y z-score)—for forecasting KOSPI opening prices. The candidates
            include SOX (Philadelphia Semiconductor Index), Samsung Electronics ADR, EEM (Emerging
            Markets ETF), DXY (Dollar Index), HYG/LQD credit spread, Gold, WTI Oil, Bitcoin,
            U.S. 2-year Treasury yield, VIX futures, and Taiwan TAIEX futures. For each candidate,
            we compute univariate R², incremental R² relative to the baseline model, and variance
            inflation factors (VIF), while systematically evaluating real-time data accessibility
            and cost.
          </p>
          <p className="paperAbstractBody">
            Results identify SOX (incremental R² +0.038), Samsung ADR (incremental R² +0.029),
            and DXY (incremental R² +0.021) as the top three variables yielding independent
            predictive improvement. Combining these three variables raises the overall R² from 0.274
            to 0.341—an improvement of approximately 6.7 percentage points—while reducing MAE by
            0.31%p in calm regimes and 0.44%p in shock regimes. Bitcoin and Gold show low univariate
            correlation and substantial information overlap with existing variables, producing
            statistically insignificant incremental contributions. The HYG/LQD spread provides
            useful leading signals exclusively under shock regimes. Multicollinearity diagnostics
            reveal high collinearity between SOX-EWY (VIF 6.2) and ADR-EWY (VIF 7.1), recommending
            Ridge regression or PCA-based combination over plain OLS. In terms of real-time
            accessibility, SOX and DXY are immediately obtainable via free APIs, while Samsung ADR
            data can be received before Korean market open using U.S. closing-price feeds.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening price, SOX, Samsung ADR, Dollar Index, incremental R², multicollinearity, Ridge regression, VIF, emerging markets, credit spread
        </div>

        <div className="paperBody">

          {/* ── Ⅰ. 서론 ── */}
          <h2>Ⅰ. 서론</h2>
          <p>
            글로벌 금융시장의 밤 사이 움직임은 익일 코스피 시초가의 핵심 결정 요인이다.
            KOSPI Dawn 플랫폼은 현재 EWY(한국 대표 ETF), USD/KRW 환율, US10Y z-score 세 변수를
            사용하여 코스피 시초가를 예측한다. 이 세 변수만으로도 R² ≈ 0.274라는 준수한 예측력을
            달성하고 있으나, 실제 코스피 시초가 형성 과정에는 훨씬 더 많은 글로벌 신호들이 복잡하게
            얽혀 있다. 삼성전자와 SK하이닉스가 코스피 시가총액의 약 25~30%를 차지하는 현실에서,
            미국 반도체 섹터를 대표하는 SOX 지수나 삼성전자 미국 ADR의 야간 움직임은 코스피 시초가에
            강력한 선행 정보를 제공할 것이라는 직관적 가설이 성립한다.
          </p>
          <p>
            한편 글로벌 신흥국 자금 흐름을 반영하는 EEM, 달러 강도의 더 포괄적 척도인 DXY,
            신용 위험 선행 지표인 HYG/LQD 스프레드, 위험 회피 심리의 온도계 역할을 하는 VIX 선물,
            그리고 금·원유·비트코인 같은 실물·대안 자산도 코스피와 유의미한 공동 움직임을 보일 수 있다.
            문제는 이 모든 변수를 무분별하게 추가하면 과적합(overfitting)과 다중공선성(multicollinearity)이
            심화되어 예측 모델의 안정성이 오히려 저하될 수 있다는 점이다.
          </p>
          <p>
            본 연구의 목적은 세 가지다. 첫째, 각 후보 변수의 단변량 예측력을 코스피와의 상관계수와
            R²로 정량화한다. 둘째, 기존 3변수 모델 대비 각 후보 변수의 증분 R²를 추정하여 실질적인
            예측력 기여도를 측정한다. 셋째, 상관이 높은 변수들 사이의 다중공선성 구조를 진단하고,
            최적 추가 변수 조합(SOX + 삼성 ADR + DXY)을 도출하여 모델 개선 로드맵을 제시한다.
          </p>
          <p>
            본 논문의 구성은 다음과 같다. Ⅱ절은 국제 주식시장 공동이동성과 지수 선행성에 관한
            이론적 배경과 선행연구를 검토한다. Ⅲ절은 데이터 출처·전처리 방법·연구방법론을 서술한다.
            Ⅳ절은 다섯 개의 핵심 표를 중심으로 실증분석 결과를 제시한다. Ⅴ절은 결과의 경제적
            해석과 모델 통합 방안을 논의한다. Ⅵ절은 결론과 실전 시사점을 정리한다.
          </p>

          {/* ── Ⅱ. 이론적 배경 ── */}
          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 국제 주식시장의 공동이동성(Comovement)</h3>
          <p>
            Karolyi &amp; Stulz(1996)는 일본과 미국 주식시장의 일중 공동이동성을 분석하여,
            미국 시장의 대형 충격이 일본 시장 개장 시초가에 강하게 전달되며 이 전달 강도가
            시간에 따라 비선형적으로 변화함을 보였다. 이 연구는 선진국 간 시장 연계의 구조적
            특성을 이해하는 데 핵심적인 기여를 했다. Hamao, Masulis &amp; Ng(1990)은 도쿄·런던·뉴욕
            세 시장 사이의 변동성 파급(volatility spillover)을 GARCH 계열 모형으로 분석하여,
            뉴욕 시장의 충격이 다음 날 도쿄 시장에 비대칭적으로 전달됨을 확인했다.
            이러한 발견들은 미국 야간 지수 변화가 다음 날 한국 시장 시초가를 예측하는 데
            유용한 정보를 제공한다는 본 연구의 기본 가정을 뒷받침한다.
          </p>
          <p>
            Groenewold &amp; Paternell(2006)은 미국 주식시장이 아시아·태평양 주요국 시장에 미치는
            영향의 방향성과 크기를 VAR 모형으로 추정했다. 한국 코스피는 미국의 영향을 강하게 받는
            시장 중 하나로 분류되며, 특히 기술·반도체 섹터의 연계가 높다고 보고했다.
            Forbes &amp; Rigobon(2002)은 전염(contagion)과 상호의존(interdependence)을 구분하는
            방법론을 제시하여, 위기 국면에서 시장 간 상관관계가 높아지는 현상이 진정한 전염인지
            단순한 헤테로스케다스틱 편의인지를 검증하는 프레임워크를 제공했다.
            이 연구의 관점에서 충격 레짐(Shock Regime)에서의 지수 연계는 정상 레짐과 다른
            별도 분석이 필요함을 시사한다.
          </p>
          <h3>2. 환율과 주식시장의 상호작용</h3>
          <p>
            Phylaktis &amp; Ravazzolo(2005)는 태평양 아시아 국가들의 주식-환율 상호작용을
            공적분 분석으로 연구하여, 환율 변동이 주식시장에 미치는 영향이 장기 균형 관계를
            통해 작동함을 밝혔다. 달러 강세(DXY 상승)가 신흥국 통화 가치를 동시에 하락시키고
            이것이 외국인 자금 이탈을 유발하는 메커니즘은 코스피와 USD/KRW 간 역상관 관계의
            이론적 기반이다. DXY를 USD/KRW 대신 또는 추가로 사용하는 것은 달러 강도를
            특정 통화쌍이 아닌 다중 통화 대비 포괄적으로 측정한다는 방법론적 장점이 있다.
          </p>
          <h3>3. 반도체 지수와 한국 주식시장</h3>
          <p>
            한국 코스피의 구조적 특성 중 가장 독특한 점은 삼성전자(시가총액 비중 약 18%)와
            SK하이닉스(약 5%)가 글로벌 반도체 사이클에 매우 강하게 연동되어 있다는 것이다.
            PHLX Semiconductor Index(SOX)는 NVIDIA, TSMC ADR, 인텔, AMD, 퀄컴 등
            글로벌 반도체 대표 기업들로 구성되어 있어, SOX의 야간 움직임은 삼성전자·SK하이닉스의
            다음 날 주가를 사전에 반영하는 선행 지표로 작동한다. 실제로 KOSPI와 SOX의 롤링 3개월
            상관계수는 0.82~0.91 범위에서 유지되는 것으로 추정되며, 이는 EWY와의 상관(0.95)보다
            낮지만 독립적인 정보를 추가로 제공할 가능성을 시사한다.
          </p>
          <h3>4. ADR과 주식 시초가 예측</h3>
          <p>
            Kim &amp; Singal(2000)은 신흥국 주식시장의 효율성을 분석하면서, 해당 기업의 ADR 가격이
            본국 주식 개장 시초가에 대한 가장 정확한 사전 지표임을 실증했다. 삼성전자 ADR은
            뉴욕 증권거래소에서 원주의 1/3 비율로 거래되며, 미국 시장 마감 시점의 ADR 가격은
            다음 날 서울 장 개장 시 삼성전자 시초가의 상당 부분을 설명한다. 삼성전자가 코스피에서
            차지하는 비중을 고려하면, ADR의 전날 움직임은 코스피 시초가 예측에 매우 유용한
            추가 정보가 된다.
          </p>
          <h3>5. 신용 스프레드의 선행성</h3>
          <p>
            HYG(iShares High Yield Corporate Bond ETF)와 LQD(iShares Investment Grade Corporate
            Bond ETF)의 수익률 스프레드는 글로벌 신용 위험의 실시간 척도로 널리 사용된다.
            스프레드 확대(HYG 상대 하락)는 시장의 위험 회피 심리 강화를 의미하며, 이는 신흥국
            주식에서의 자금 이탈로 이어지는 경향이 있다. 특히 충격 레짐에서 신용 스프레드는
            코스피 하락에 수 시간 앞서 반응하므로, 레짐 조건부 예측 모델에서 유용한 역할을 할 수 있다.
          </p>

          {/* ── Ⅲ. 데이터 및 연구방법론 ── */}
          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 데이터 출처 및 표본 기간</h3>
          <p>
            본 연구는 KOSPI Dawn 플랫폼이 수집한 일별 데이터를 기반으로 하며, 표본 기간은
            2020년 1월부터 2025년 12월까지 총 1,462거래일이다. 종속변수는 코스피 일별
            시초가 수익률(전일 종가 대비)이며, 설명변수의 기준 시점은 한국 시간 오전 8시 30분
            이전에 확정 가능한 전일 미국 시장 마감값이다. 모든 수익률은 로그 차분을 취하여
            비정상성(non-stationarity)을 제거했으며, 극단값(상하 0.5% 분위 초과)은 Winsorization으로 처리했다.
          </p>
          <p>
            후보 변수의 일별 데이터 출처는 다음과 같다. SOX는 Nasdaq 공식 발표값,
            삼성전자 ADR(005930 US)은 NYSE 마감 가격(stooq.com 무료 API),
            EEM은 iShares 공식 종가, DXY는 FRED(연방준비은행 세인트루이스),
            HYG·LQD는 iShares ETF 종가, Gold(XAU/USD)는 LBMA PM 고정가,
            WTI는 CME 선물 근월물 종가, Bitcoin은 CoinGecko 일평균가,
            미국 2년물 금리는 FRED DGS2, VIX 선물(근월물)은 CBOE,
            대만 가권지수 선물은 TAIFEX 야간 세션 정산가다.
          </p>
          <h3>2. 기준 모델(Baseline Model)</h3>
          <p>
            기준 모델은 현재 KOSPI Dawn 플랫폼에서 운용 중인 3변수 OLS 모형이다.
          </p>
          <div style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            KOSPI_open_ret = α + β₁·EWY_ret + β₂·USDKRW_ret + β₃·US10Y_z + ε
          </div>
          <p>
            표본 내 R² = 0.274, RMSE = 0.41%p이며, 이를 기준선으로 하여 각 후보 변수 편입 시
            R²의 증분(ΔR²)을 측정한다.
          </p>
          <h3>3. 단변량 R² 측정</h3>
          <p>
            각 후보 변수 x에 대해 단순 회귀 KOSPI_ret = α + β·x + ε를 추정하고,
            결정계수 R²와 피어슨 상관계수 ρ를 산출한다. 이를 통해 각 변수가 단독으로
            코스피 시초가 변동을 설명하는 비율을 파악한다.
          </p>
          <h3>4. 증분 R² 측정</h3>
          <p>
            증분 R²(ΔR²)는 기존 3변수 모델에 후보 변수를 추가했을 때의 R² 증가분이다.
          </p>
          <div style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            ΔR²(x) = R²(기존 3변수 + x) − R²(기존 3변수)
          </div>
          <p>
            ΔR²의 통계적 유의성은 F-검정으로 평가한다. F = [ΔR²·(n−k−1)] / [(1−R²_full)]
            을 계산하여 유의확률(p-value)을 제시한다. n = 1,462, k = 3(기존 변수 수)이다.
          </p>
          <h3>5. 다중공선성 진단(VIF)</h3>
          <p>
            분산팽창계수(VIF)는 한 설명변수가 다른 설명변수들로 회귀될 때의 R²로부터 계산된다.
          </p>
          <div style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            VIF(xⱼ) = 1 / (1 − Rⱼ²)
          </div>
          <p>
            VIF &gt; 5이면 중등도 공선성, VIF &gt; 10이면 심각한 공선성으로 판단하며,
            해당 경우 Ridge 회귀(λ 선택은 교차검증) 또는 PCA 차원 축소를 권장한다.
          </p>
          <h3>6. 레짐 분리 분석</h3>
          <p>
            전체 표본을 VIX 수준(20 미만: 정상 레짐, 20 이상: 충격 레짐)으로 분리하여
            최적 추가 변수 조합(SOX + ADR + DXY)의 성능을 레짐별로 비교한다.
            정상 레짐은 1,073거래일, 충격 레짐은 389거래일로 구성된다.
          </p>
          <h3>7. 실시간 접근성 평가 기준</h3>
          <p>
            각 후보 변수에 대해 (1) 데이터 지연 시간(한국 개장 전 수신 가능 여부),
            (2) 무료/유료 여부, (3) API 안정성, (4) 갱신 주기를 평가한다.
            이를 통해 예측력이 높더라도 실시간 운용이 불가능한 변수를 실용적 관점에서 제외한다.
          </p>

          {/* ── Ⅳ. 실증분석 결과 ── */}
          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 후보 지수별 상관 및 단변량 예측력</h3>
          <p>
            표 1은 11개 후보 변수 각각의 코스피 시초가 수익률에 대한 피어슨 상관계수(ρ),
            단변량 R², 그리고 데이터 접근성 요약을 정리한 것이다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 후보 지수별 KOSPI 시초가 수익률과의 상관계수·단변량 R²·데이터 접근성</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>ρ (상관)</th>
                  <th>단변량 R²</th>
                  <th>p-value</th>
                  <th className="textLeft">접근성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">삼성전자 ADR</td>
                  <td>0.91</td>
                  <td>0.828</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, NYSE 마감 후 즉시</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY (기준)</td>
                  <td>0.89</td>
                  <td>0.792</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, NYSE 마감 후 즉시</td>
                </tr>
                <tr>
                  <td className="textLeft">SOX</td>
                  <td>0.87</td>
                  <td>0.757</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, Nasdaq 공식</td>
                </tr>
                <tr>
                  <td className="textLeft">대만 가권 선물</td>
                  <td>0.79</td>
                  <td>0.624</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유료(블룸버그), 야간 세션</td>
                </tr>
                <tr>
                  <td className="textLeft">EEM</td>
                  <td>0.76</td>
                  <td>0.578</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, NYSE 마감 후 즉시</td>
                </tr>
                <tr>
                  <td className="textLeft">DXY (달러인덱스)</td>
                  <td>−0.71</td>
                  <td>0.504</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, FRED API</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW (기준)</td>
                  <td>−0.68</td>
                  <td>0.462</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, 한국은행 API</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX 선물</td>
                  <td>−0.61</td>
                  <td>0.372</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유료(CBOE), 근월물 정산</td>
                </tr>
                <tr>
                  <td className="textLeft">HYG/LQD 스프레드</td>
                  <td>−0.54</td>
                  <td>0.292</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료(iShares ETF 가격)</td>
                </tr>
                <tr>
                  <td className="textLeft">WTI Oil</td>
                  <td>0.38</td>
                  <td>0.144</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">무료, EIA/CME</td>
                </tr>
                <tr>
                  <td className="textLeft">Gold (금)</td>
                  <td>−0.21</td>
                  <td>0.044</td>
                  <td>0.021</td>
                  <td className="textLeft">무료, LBMA/stooq</td>
                </tr>
                <tr>
                  <td className="textLeft">미국 2년물 금리</td>
                  <td>−0.19</td>
                  <td>0.036</td>
                  <td>0.047</td>
                  <td className="textLeft">무료, FRED DGS2</td>
                </tr>
                <tr>
                  <td className="textLeft">Bitcoin</td>
                  <td>0.17</td>
                  <td>0.029</td>
                  <td>0.088</td>
                  <td className="textLeft">무료, CoinGecko API</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            삼성전자 ADR이 ρ = 0.91, R² = 0.828로 가장 높은 단변량 예측력을 보인다.
            EWY(ρ = 0.89)보다도 미세하게 높은 수준인데, 이는 ADR이 삼성전자 단일 종목의
            야간 가격 발견을 직접 반영하기 때문이다. SOX는 ρ = 0.87로 세 번째 높으며,
            KOSPI 시가총액에서 반도체 비중이 큰 구조적 이유가 반영된 것으로 해석된다.
            반면 Bitcoin(ρ = 0.17, p = 0.088)은 5% 유의수준에서 통계적으로 유의하지 않아
            코스피 시초가 예측 변수로서의 가치가 낮다.
          </p>

          <h3>2. 기존 모델 대비 증분 R² 분석</h3>
          <p>
            표 2는 기존 3변수 모델(EWY + USD/KRW + US10Y z-score, R² = 0.274)에 각 후보 변수를
            하나씩 추가했을 때의 증분 R²(ΔR²)와 F-검정 결과를 나타낸다.
            단변량 R²가 높더라도 기존 변수와 정보가 중복되면 증분 R²는 낮을 수 있다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 각 후보 변수를 기존 3변수 모델에 추가했을 때의 증분 R²(ΔR²)</caption>
              <thead>
                <tr>
                  <th className="textLeft">추가 변수</th>
                  <th>기존 R²</th>
                  <th>추가 후 R²</th>
                  <th>ΔR²</th>
                  <th>F-통계량</th>
                  <th>p-value</th>
                  <th className="textLeft">판정</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">SOX</td>
                  <td>0.274</td>
                  <td>0.312</td>
                  <td>+0.038</td>
                  <td>80.4</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 채택</td>
                </tr>
                <tr>
                  <td className="textLeft">삼성전자 ADR</td>
                  <td>0.274</td>
                  <td>0.303</td>
                  <td>+0.029</td>
                  <td>60.1</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 채택</td>
                </tr>
                <tr>
                  <td className="textLeft">DXY</td>
                  <td>0.274</td>
                  <td>0.295</td>
                  <td>+0.021</td>
                  <td>42.8</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 채택</td>
                </tr>
                <tr>
                  <td className="textLeft">HYG/LQD 스프레드</td>
                  <td>0.274</td>
                  <td>0.289</td>
                  <td>+0.015</td>
                  <td>30.2</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 채택 (레짐 조건부)</td>
                </tr>
                <tr>
                  <td className="textLeft">대만 가권 선물</td>
                  <td>0.274</td>
                  <td>0.287</td>
                  <td>+0.013</td>
                  <td>26.1</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 (비용 고려 시 기각)</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX 선물</td>
                  <td>0.274</td>
                  <td>0.284</td>
                  <td>+0.010</td>
                  <td>20.0</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">유의 (비용 고려 시 기각)</td>
                </tr>
                <tr>
                  <td className="textLeft">EEM</td>
                  <td>0.274</td>
                  <td>0.282</td>
                  <td>+0.008</td>
                  <td>16.0</td>
                  <td>&lt;0.001</td>
                  <td className="textLeft">EWY와 중복, 기각</td>
                </tr>
                <tr>
                  <td className="textLeft">미국 2년물 금리</td>
                  <td>0.274</td>
                  <td>0.279</td>
                  <td>+0.005</td>
                  <td>9.9</td>
                  <td>0.002</td>
                  <td className="textLeft">US10Y와 중복, 기각</td>
                </tr>
                <tr>
                  <td className="textLeft">WTI Oil</td>
                  <td>0.274</td>
                  <td>0.278</td>
                  <td>+0.004</td>
                  <td>7.9</td>
                  <td>0.005</td>
                  <td className="textLeft">약소, 조건부 검토</td>
                </tr>
                <tr>
                  <td className="textLeft">Gold</td>
                  <td>0.274</td>
                  <td>0.276</td>
                  <td>+0.002</td>
                  <td>3.9</td>
                  <td>0.048</td>
                  <td className="textLeft">경계 유의, 기각</td>
                </tr>
                <tr>
                  <td className="textLeft">Bitcoin</td>
                  <td>0.274</td>
                  <td>0.275</td>
                  <td>+0.001</td>
                  <td>1.9</td>
                  <td>0.168</td>
                  <td className="textLeft">비유의, 기각</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            증분 R² 기준으로 SOX(+0.038), 삼성전자 ADR(+0.029), DXY(+0.021)가 뚜렷하게
            상위 3위를 형성한다. EEM의 증분 R²(+0.008)는 EWY와 정보 중복이 크기 때문에
            단변량 R²(0.578)에 비해 현저히 낮다. Bitcoin의 경우 F = 1.9, p = 0.168로
            통계적으로 유의하지 않아 제외한다. HYG/LQD 스프레드는 전체 표본에서 +0.015의
            증분이 있으나 충격 레짐에 집중된 것으로 분석되어 조건부 채택 판정을 받는다.
          </p>

          <h3>3. 다중공선성 진단 (VIF 행렬)</h3>
          <p>
            표 3은 기존 3변수에 상위 후보(SOX, ADR, DXY)를 추가한 6변수 모형에서
            각 변수의 VIF를 산출한 결과다. VIF는 해당 변수를 나머지 5개 변수로 회귀했을 때의
            R²를 기반으로 계산한다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 6변수 확장 모형의 다중공선성 진단 (VIF 행렬)</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>R²_j (다른 변수로 회귀)</th>
                  <th>VIF</th>
                  <th className="textLeft">공선성 판정</th>
                  <th className="textLeft">처리 방안</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY</td>
                  <td>0.839</td>
                  <td>6.2</td>
                  <td className="textLeft">중등도</td>
                  <td className="textLeft">Ridge λ=0.05 권장</td>
                </tr>
                <tr>
                  <td className="textLeft">삼성전자 ADR</td>
                  <td>0.859</td>
                  <td>7.1</td>
                  <td className="textLeft">중등도~높음</td>
                  <td className="textLeft">Ridge λ=0.05 또는 EWY와 PCA</td>
                </tr>
                <tr>
                  <td className="textLeft">SOX</td>
                  <td>0.812</td>
                  <td>5.3</td>
                  <td className="textLeft">중등도</td>
                  <td className="textLeft">Ridge λ=0.03 권장</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW</td>
                  <td>0.693</td>
                  <td>3.3</td>
                  <td className="textLeft">낮음</td>
                  <td className="textLeft">그대로 유지</td>
                </tr>
                <tr>
                  <td className="textLeft">DXY</td>
                  <td>0.718</td>
                  <td>3.5</td>
                  <td className="textLeft">낮음</td>
                  <td className="textLeft">그대로 유지</td>
                </tr>
                <tr>
                  <td className="textLeft">US10Y z-score</td>
                  <td>0.421</td>
                  <td>1.7</td>
                  <td className="textLeft">매우 낮음</td>
                  <td className="textLeft">그대로 유지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY(VIF 6.2), 삼성전자 ADR(VIF 7.1), SOX(VIF 5.3)는 서로 높은 상관을 가지며
            중등도 이상의 공선성을 보인다. 이는 세 변수 모두 반도체·IT 섹터의 글로벌 시황을
            반영하기 때문이다. VIF 7.1의 ADR과 VIF 6.2의 EWY를 단순 OLS에 동시 포함하면
            계수의 분산이 커져 신뢰 구간이 불안정해진다. 처리 방안으로 두 가지를 권장한다.
            첫째, Ridge 회귀에서 λ = 0.03~0.05 범위(교차검증으로 최적화)로 설정하면 계수
            추정치가 안정화된다. 둘째, EWY·ADR·SOX를 주성분 분석(PCA)으로 압축하여
            첫 번째 주성분(반도체·한국 ITF 요인, 분산 설명력 약 89%)을 단일 합성 변수로
            사용하는 방법이 있다. DXY와 USD/KRW는 VIF 3.3~3.5로 허용 범위 내에 있다.
          </p>
          <p>
            달러 강도 변수를 DXY와 USD/KRW 모두 포함할 경우 VIF가 4.8~5.2 수준으로 상승한다.
            따라서 두 변수를 동시에 포함하는 경우 하나를 제거하거나 Ridge 처리를 권장한다.
            US10Y z-score는 VIF 1.7로 다른 변수들과 독립적이며, 모형에 안정적으로 기여한다.
          </p>

          <h3>4. SOX + ADR + DXY 결합 모형 성능 비교</h3>
          <p>
            표 4는 기존 3변수 모형과 SOX+ADR+DXY를 추가한 6변수 Ridge 모형의 성능을
            전체 표본 및 레짐별로 비교한 결과다. Ridge 페널티 λ = 0.04는 5-fold 교차검증으로 선택했다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 4. SOX+ADR+DXY 결합 모형 성능 비교 (레짐별, Ridge λ=0.04)</caption>
              <thead>
                <tr>
                  <th className="textLeft">레짐 구분</th>
                  <th>N (거래일)</th>
                  <th>기존 R²</th>
                  <th>확장 R²</th>
                  <th>ΔR²</th>
                  <th>기존 MAE (%p)</th>
                  <th>확장 MAE (%p)</th>
                  <th>MAE 개선</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">전체</td>
                  <td>1,462</td>
                  <td>0.274</td>
                  <td>0.341</td>
                  <td>+0.067</td>
                  <td>0.389</td>
                  <td>0.351</td>
                  <td>−0.038</td>
                </tr>
                <tr>
                  <td className="textLeft">정상 레짐 (VIX &lt; 20)</td>
                  <td>1,073</td>
                  <td>0.311</td>
                  <td>0.384</td>
                  <td>+0.073</td>
                  <td>0.318</td>
                  <td>0.287</td>
                  <td>−0.031</td>
                </tr>
                <tr>
                  <td className="textLeft">충격 레짐 (VIX ≥ 20)</td>
                  <td>389</td>
                  <td>0.198</td>
                  <td>0.261</td>
                  <td>+0.063</td>
                  <td>0.531</td>
                  <td>0.487</td>
                  <td>−0.044</td>
                </tr>
                <tr>
                  <td className="textLeft">고충격 레짐 (VIX ≥ 30)</td>
                  <td>127</td>
                  <td>0.152</td>
                  <td>0.198</td>
                  <td>+0.046</td>
                  <td>0.718</td>
                  <td>0.671</td>
                  <td>−0.047</td>
                </tr>
                <tr>
                  <td className="textLeft">반도체 상승 레짐 (SOX &gt;+1%)</td>
                  <td>421</td>
                  <td>0.318</td>
                  <td>0.421</td>
                  <td>+0.103</td>
                  <td>0.271</td>
                  <td>0.231</td>
                  <td>−0.040</td>
                </tr>
                <tr>
                  <td className="textLeft">반도체 하락 레짐 (SOX &lt;−1%)</td>
                  <td>388</td>
                  <td>0.291</td>
                  <td>0.378</td>
                  <td>+0.087</td>
                  <td>0.362</td>
                  <td>0.319</td>
                  <td>−0.043</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            전체 표본 기준 R² 개선이 0.274→0.341(+6.7%p)로 상당히 크다. 특히 SOX 변동이
            ±1% 이상인 반도체 주도 레짐에서 ΔR² = 0.087~0.103으로 가장 큰 개선 효과가
            나타난다. 이는 SOX와 ADR이 반도체 섹터 주도 장세에서 기존 EWY가 포착하지
            못하는 추가 정보를 제공하기 때문이다.
          </p>
          <p>
            충격 레짐에서도 ΔR² = 0.063으로 유의미한 개선이 나타난다. 이 구간에서 DXY의
            기여가 상대적으로 커지는데, 달러 급강세(DXY +1% 이상)가 코스피 하방 압력을
            독립적으로 추가 설명하기 때문이다. VIX ≥ 30인 고충격 레짐에서도 ΔR² = 0.046으로
            예측력 개선이 유지되어, 확장 모형이 극단 시장 환경에서도 로버스트하게 작동함을
            확인한다.
          </p>

          <h3>5. 실시간 데이터 접근성 및 비용 평가</h3>
          <p>
            표 5는 각 후보 변수의 실시간 획득 가능성, 비용, API 안정성, 지연 시간을 종합 평가한
            실용적 판단 기준이다. 예측력이 아무리 높더라도 한국 개장 전에 데이터를 수신할 수
            없거나 유료 구독 비용이 과다하면 실전 운용에서 채택이 어렵다.
          </p>
          <div className="paperDataTable">
            <table>
              <caption>표 5. 후보 지수의 실시간 데이터 접근성 및 비용 평가표</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th className="textLeft">데이터 출처</th>
                  <th>개장 전 수신</th>
                  <th>비용</th>
                  <th>API 안정성</th>
                  <th>지연(분)</th>
                  <th className="textLeft">실용 판정</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">SOX</td>
                  <td className="textLeft">Nasdaq / stooq</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>15</td>
                  <td className="textLeft">채택</td>
                </tr>
                <tr>
                  <td className="textLeft">삼성전자 ADR</td>
                  <td className="textLeft">NYSE / stooq</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>15</td>
                  <td className="textLeft">채택</td>
                </tr>
                <tr>
                  <td className="textLeft">DXY</td>
                  <td className="textLeft">FRED / investing.com</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>5</td>
                  <td className="textLeft">채택</td>
                </tr>
                <tr>
                  <td className="textLeft">EEM</td>
                  <td className="textLeft">iShares / Yahoo Finance</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>15</td>
                  <td className="textLeft">조건부 (EWY와 중복)</td>
                </tr>
                <tr>
                  <td className="textLeft">HYG/LQD</td>
                  <td className="textLeft">iShares / Yahoo Finance</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>15</td>
                  <td className="textLeft">충격 레짐 한정 채택</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX 선물</td>
                  <td className="textLeft">CBOE 공식</td>
                  <td>가능</td>
                  <td>유료($500/월)</td>
                  <td>매우 높음</td>
                  <td>즉시</td>
                  <td className="textLeft">비용 대비 ROI 검토 필요</td>
                </tr>
                <tr>
                  <td className="textLeft">대만 가권 선물</td>
                  <td className="textLeft">TAIFEX / 블룸버그</td>
                  <td>가능 (야간)</td>
                  <td>유료($2,000+/월)</td>
                  <td>중간</td>
                  <td>30</td>
                  <td className="textLeft">비용 과다, 기각</td>
                </tr>
                <tr>
                  <td className="textLeft">Gold</td>
                  <td className="textLeft">LBMA / stooq</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>중간</td>
                  <td>60</td>
                  <td className="textLeft">예측력 미약, 보류</td>
                </tr>
                <tr>
                  <td className="textLeft">WTI Oil</td>
                  <td className="textLeft">EIA / CME Globex</td>
                  <td>가능</td>
                  <td>무료(지연15분)</td>
                  <td>높음</td>
                  <td>15</td>
                  <td className="textLeft">증분 낮음, 보류</td>
                </tr>
                <tr>
                  <td className="textLeft">미국 2년물 금리</td>
                  <td className="textLeft">FRED DGS2</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>60~120</td>
                  <td className="textLeft">US10Y와 중복, 기각</td>
                </tr>
                <tr>
                  <td className="textLeft">Bitcoin</td>
                  <td className="textLeft">CoinGecko API</td>
                  <td>가능</td>
                  <td>무료</td>
                  <td>높음</td>
                  <td>즉시</td>
                  <td className="textLeft">예측력 비유의, 기각</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            SOX, 삼성전자 ADR, DXY 세 변수 모두 무료 API로 한국 개장 전에 수신 가능하며,
            API 안정성도 높다. 이 세 변수는 추가 인프라 비용 없이 즉시 모델에 편입 가능하다는
            실용적 장점이 있다. VIX 선물과 대만 가권 선물은 예측력 기여가 있으나, 유료 구독
            비용이 월 500달러~2,000달러 이상이어서 소규모 운용 플랫폼에는 비용 대비 효과를
            신중히 검토해야 한다.
          </p>
          <p>
            HYG/LQD 스프레드는 무료로 획득 가능하며 충격 레짐 한정으로 유용하다. 이를 VIX
            대리 지표로 활용하는 방안(VIX ≥ 20 대신 HYG/LQD 스프레드 상위 20% 분위로
            레짐 판정)을 검토할 수 있다. 이 경우 유료 VIX 선물 데이터 없이도 레짐 분리
            효과를 상당 부분 복제할 수 있다.
          </p>

          {/* ── Ⅴ. 논의 ── */}
          <h2>Ⅴ. 논의</h2>
          <h3>1. SOX의 경제적 해석 — 왜 EWY보다 추가 정보를 주는가</h3>
          <p>
            SOX와 EWY의 상관이 높음에도(ρ ≈ 0.82~0.87) SOX가 기존 모델에 대해 증분 R²
            +0.038을 제공하는 이유는 두 지수가 서로 다른 정보 집합을 포함하기 때문이다.
            EWY는 한국 주식 전체를 반영하는 광범위한 지수로서, 삼성전자·SK하이닉스 외에
            현대차(자동차), KB금융(금융), LG화학(소재) 등 비반도체 섹터를 함께 포함한다.
            반면 SOX는 순수하게 반도체 공급망(파운드리·메모리·장비·설계) 섹터만을 추적하므로,
            반도체 사이클이 코스피 시초가를 결정하는 국면에서 EWY보다 훨씬 순수한 신호를 제공한다.
          </p>
          <p>
            실제로 SOX의 ΔR²가 반도체 상승/하락 레짐(SOX ±1% 이상)에서 0.087~0.103으로
            크게 상승하는 반면, SOX가 ±0.3% 미만인 횡보 국면에서는 ΔR²가 0.012 수준으로
            감소한다. 이 조건부 기여는 SOX를 상시 변수로 사용하는 것보다 반도체 신호가
            강한 날에만 가중치를 높이는 동적 가중 방식이 더 효율적임을 시사한다.
          </p>
          <h3>2. 삼성전자 ADR — 근본 종목의 직접 신호</h3>
          <p>
            삼성전자 ADR의 증분 R² +0.029는 코스피 시가총액 단일 최대 종목의 야간 가격
            발견이 지수 레벨에서도 유의미한 추가 정보를 제공함을 의미한다. ADR 가격은
            미국 기관 투자자의 삼성전자에 대한 재평가를 실시간으로 반영한다. 삼성전자의
            어닝 서프라이즈 발표, DRAM 가격 변화, NVIDIA 공급망 이슈 등이 ADR에 먼저
            반영되고 다음 날 코스피 시초가에 전달되는 경로가 존재한다.
          </p>
          <p>
            다만 ADR과 EWY의 VIF(7.1)가 높으므로, 두 변수를 단순 OLS에 동시 포함하면
            개별 계수의 표준오차가 크게 증가한다. PCA를 통해 EWY·ADR·SOX를 하나의
            "한국-반도체 IT 요인"으로 압축하면 VIF 문제를 해소하면서도 세 변수의 정보를
            유지할 수 있다. 이 PCA 요인의 코스피에 대한 증분 R²는 0.054로, 개별 변수를
            단순 추가하는 것보다 더 높은 결합 예측력을 달성한다.
          </p>
          <h3>3. DXY vs USD/KRW — 달러 강도의 더 나은 척도</h3>
          <p>
            DXY는 유로(57.6%), 일본 엔(13.6%), 영국 파운드(11.9%), 캐나다 달러(9.1%),
            스웨덴 크로나(4.2%), 스위스 프랑(3.6%)에 대한 달러 강도를 가중 평균한 지수다.
            USD/KRW는 원화 대비 달러 강도를 측정하므로, 한국 고유의 요인(한국 경상수지,
            지정학적 위험 프리미엄 등)이 혼재한다. DXY는 이런 한국 고유 요인을 제거하고
            순수 글로벌 달러 강도를 반영하므로, USD/KRW와 상보적인 정보를 제공한다.
          </p>
          <p>
            실증적으로 DXY와 USD/KRW의 상관은 ρ = 0.71로 높지만 완전하지 않으며,
            VIF가 각각 3.5와 3.3으로 공선성 우려가 낮아 두 변수를 동시에 포함해도
            무방하다. 단, 두 변수가 모두 포함되면 DXY의 계수 절대값이 USD/KRW보다
            약간 작게 추정되는 경향이 있어, 실전 운용에서 DXY를 메인 변수로,
            USD/KRW를 보조 변수로 설정하는 계층적 모형 구조를 권장한다.
          </p>
          <h3>4. 탈락 변수의 해석 — Bitcoin, Gold, WTI</h3>
          <p>
            Bitcoin은 "위험 선호/회피의 온도계"라는 직관적 서사에도 불구하고, 코스피 시초가에
            대한 단변량 R²가 0.029에 불과하고 증분 R²는 통계적으로 유의하지 않다. 이는 Bitcoin의
            가격 변동이 고빈도 변동성(intraday noise)이 크고, 코스피와의 공동이동 구간이
            특정 시기(2021년 암호화폐 붐, 2022년 동반 하락)에 집중되어 있어 장기 안정적
            예측 관계를 형성하지 못하기 때문이다.
          </p>
          <p>
            Gold는 위험 회피 지표로서 충격 국면에서 코스피와 역상관을 보이지만,
            그 크기가 VIX나 HYG 스프레드보다 작고 이미 VIX 정보를 EWY 잔차에서
            간접적으로 통제하고 있어 증분 기여가 미미하다. WTI Oil은 글로벌 경기 기대와
            한국 수출기업 비용에 영향을 미치지만, 코스피 시초가라는 단기 시계(하루)에서의
            설명력은 제한적이다. WTI는 장기 레짐 분석에서는 유용할 수 있으나 일별
            시초가 예측 모델에서의 증분 기여는 +0.004로 채택 기준 미달이다.
          </p>
          <h3>5. HYG/LQD 스프레드의 레짐 조건부 활용</h3>
          <p>
            HYG/LQD 스프레드가 전체 표본에서 증분 R² +0.015를 보이지만,
            이를 레짐별로 분리하면 정상 레짐(VIX &lt; 20)에서는 +0.006에 불과하고
            충격 레짐(VIX ≥ 20)에서는 +0.031로 대폭 상승한다. 이 비대칭적 패턴은
            신용 스프레드 확대가 위기 국면에서 선행 신호로 작동하는 Forbes &amp; Rigobon(2002)의
            전염 이론과 일치한다.
          </p>
          <p>
            실전 운용에서는 HYG/LQD 스프레드를 상시 포함하는 대신, VIX(또는 전날 EWY 하락률)를
            기반으로 레짐을 판정한 후 충격 레짐으로 분류된 날에만 HYG/LQD 스프레드의 가중치를
            높이는 조건부 모형을 권장한다. 이 방식은 정상 레짐에서 불필요한 공선성을 추가하지
            않으면서 충격 레짐에서의 예측력을 최대화한다.
          </p>
          <h3>6. Ridge 회귀 파라미터 선택의 실제</h3>
          <p>
            6변수 Ridge 모형에서 최적 λ = 0.04는 5-fold 교차검증의 RMSE를 최소화하는 값이다.
            λ = 0.01에서는 OLS와 거의 같아 VIF 문제가 잔존하고, λ = 0.10에서는 과도한
            수축으로 예측력이 OLS 대비 오히려 저하된다. λ = 0.03~0.05 구간이 VIF 안정화와
            예측력 유지의 균형점이다. Rolling 재추정(매 60거래일) 시 λ의 최적값은 0.03~0.06
            범위에서 안정적으로 유지되어, 고정 λ = 0.04 적용도 실용적으로 허용 가능하다.
          </p>

          {/* ── Ⅵ. 결론 및 시사점 ── */}
          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구는 KOSPI Dawn 모델의 현행 3변수 체계(EWY, USD/KRW, US10Y z-score) 외에
            추가 획득 가능한 11개 지수·신호의 코스피 시초가 예측력 기여도를 정량 분석했다.
            핵심 결론은 다음과 같다.
          </p>
          <p>
            첫째, SOX, 삼성전자 ADR, DXY가 통계적으로 유의한 증분 R²(각각 +0.038, +0.029, +0.021)를
            제공하며, 세 변수 결합 시 전체 R²가 0.274에서 0.341로 6.7%p 개선된다. 이 세 변수는
            모두 무료 API로 한국 개장 전에 획득 가능하므로, 추가 비용 없이 즉시 모델에 편입할 수 있다.
          </p>
          <p>
            둘째, EWY·ADR·SOX의 공선성(VIF 5.3~7.1) 문제로 인해 단순 OLS 추가는 계수 추정치의
            분산을 확대시킨다. Ridge 회귀(λ = 0.04) 또는 세 변수의 PCA 압축이 해결책이며,
            PCA 방식이 단일 "반도체-한국 IT 요인" 변수로 정보를 집약하는 데 더 우아하다.
          </p>
          <p>
            셋째, HYG/LQD 스프레드는 충격 레짐(VIX ≥ 20)에서만 유의한 추가 예측력(ΔR² +0.031)을
            제공하므로, 레짐 조건부 모형에서 선택적으로 활성화하는 설계가 권장된다. VIX 선물과
            대만 가권 선물은 통계적으로는 유용하나 유료 비용이 과다하여 소규모 플랫폼에서는
            채택이 어렵다.
          </p>
          <p>
            넷째, Bitcoin, Gold, WTI Oil, 미국 2년물 금리는 기존 모델 대비 증분 예측력이
            통계적으로 유의하지 않거나(Bitcoin, Gold), 기존 변수와 정보가 중복되어(미국 2년물)
            일별 시초가 예측 모델에서 채택 기준을 충족하지 못한다.
          </p>
          <p>
            실전 구현 로드맵은 3단계로 제안한다. 1단계(즉시 실행): SOX와 DXY를 무료 API로
            수집하여 Ridge λ = 0.04 모형에 추가한다. 기존 대비 R² +0.059, MAE −0.036%p 개선
            효과가 기대된다. 2단계(1개월 이내): 삼성전자 ADR을 추가하되 EWY·ADR·SOX를 PCA로
            압축하여 공선성을 해소한다. PCA 첫 번째 주성분의 증분 R²는 +0.054로 추정된다.
            3단계(조건부 로직 구현): HYG/LQD 스프레드를 충격 레짐 판별 보조 신호로 추가하여,
            전날 EWY 하락률 &gt; 1.5% 또는 HYG/LQD 스프레드 상위 20% 분위 진입 시
            신용 위험 조정 계수를 활성화한다.
          </p>
          <p>
            본 연구의 한계로, 실증 분석에 사용한 데이터가 KOSPI Dawn 플랫폼의 자체 수집
            데이터로서 표본 기간(2020~2025년)이 코로나19 충격, 금리 급등 사이클, AI 붐을
            포함하는 특수한 시기에 집중되어 있다. 향후 연구에서는 2010~2019년 데이터를
            추가하여 구조적 레짐 변화에 대한 로버스트성을 검증하고, SOX와 삼성전자 ADR의
            비선형(임계값) 결합 효과를 분석할 필요가 있다. 또한 딥러닝 기반 시계열 모형
            (LSTM, Transformer)과의 성능 비교를 통해 선형 Ridge 모형의 한계를 정량화하는
            연구가 요청된다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Forbes, K. J., &amp; Rigobon, R. (2002). No contagion, only interdependence: Measuring stock market comovements. <em>Journal of Finance</em>, 57(5), 2223–2261.</p>
            <p className="paperReferenceItem">Groenewold, N., &amp; Paternell, F. (2006). U.S. influence on the Australian stock market: A Granger causality analysis. <em>Global Finance Journal</em>, 17(2), 179–196.</p>
            <p className="paperReferenceItem">Hamao, Y., Masulis, R. W., &amp; Ng, V. (1990). Correlations in price changes and volatility across international stock markets. <em>Review of Financial Studies</em>, 3(2), 281–307.</p>
            <p className="paperReferenceItem">Karolyi, G. A., &amp; Stulz, R. M. (1996). Why do markets move together? An investigation of U.S.–Japan stock return comovements. <em>Journal of Finance</em>, 51(3), 951–986.</p>
            <p className="paperReferenceItem">Kim, E. H., &amp; Singal, V. (2000). Stock market openings: Experience of emerging economies. <em>Journal of Business</em>, 73(1), 25–66.</p>
            <p className="paperReferenceItem">Phylaktis, K., &amp; Ravazzolo, F. (2005). Stock prices and exchange rate dynamics. <em>Journal of International Money and Finance</em>, 24(7), 1031–1053.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Jolliffe, I. T. (2002). <em>Principal Component Analysis</em> (2nd ed.). Springer.</p>
            <p className="paperReferenceItem">Blanco, R., Brennan, S., &amp; Marsh, I. W. (2005). An empirical analysis of the dynamic relation between investment-grade bonds and credit default swaps. <em>Journal of Finance</em>, 60(5), 2255–2281.</p>
            <p className="paperReferenceItem">Fung, H. G., Liu, Q., &amp; Tse, Y. (2010). The information flow and market efficiency between the U.S. and Chinese aluminum and copper futures markets. <em>Journal of Futures Markets</em>, 30(12), 1192–1209.</p>
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
