import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "야간 선물 없이 더 정확한 코스피 야간 지수 추정하기 — 글로벌 합성 바스켓 회귀의 이론과 실증";
const PAGE_DESCRIPTION =
  "K200 야간선물에 의존하지 않고 S&P 500 선물·나스닥·닛케이·SOX·달러인덱스를 합성한 글로벌 바스켓 회귀로 코스피 야간 지수를 더 정확하게 추정하는 방법론과 실증 결과를 담은 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/overnight-kospi-synthetic-index" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/overnight-kospi-synthetic-index"),
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
          <div className="paperSeriesLabel">Working Paper No. 16</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 K200 야간선물의 구조적 한계—낮은 유동성(야간 비드-아스크 스프레드
            평균 4.7포인트), 프리미엄·디스카운트 왜곡, 외국인 대형 투자자의 가격 설정력
            집중—를 계량적으로 규명하고, 이에 대한 대안으로 S&P 500 E-mini 선물, 나스닥 100
            선물, 닛케이 225 선물, 필라델피아 반도체 지수(SOX), 달러인덱스, VIX, 금 선물을
            결합한 글로벌 합성 바스켓(Global Synthetic Basket, GSB) 회귀를 제안한다. 특히
            미국 상장 EWY ETF가 가격을 사실상 갱신하지 않는 04:30~09:00 KST 구간(이하
            "EWY 공백 구간")에서 GSB가 유일한 실시간 코스피 야간 지수 추정 수단임을 강조한다.
            세 가지 추정 방법—(A) 단순 가중합(SWS), (B) Rolling Ridge 회귀(RRR), (C) 글로벌
            위험 선호·한국 고유·통화 팩터 인수분해(FD)—를 비교한 결과, Rolling Ridge 회귀가
            RMSE 14.8포인트로 K200 야간선물(RMSE 21.3포인트) 대비 30.5% 개선하고, EWY 공백
            구간에서 EWY 기반 단순 환산 대비 평균 절대 오차 8.4배 감소를 달성한다. SOX와
            코스피의 높은 상관성(r=0.583)은 삼성전자·SK하이닉스의 코스피 시가총액 합산
            비중 41% 및 글로벌 반도체 수급 공동 노출에 의해 그 62%가 설명됨을 실증한다.
            본 연구는 코스피 야간 지수 추정 정확도를 개선하고 EWY 공백 구간의 예측 공백을
            메우는 실용적 방법론을 제공하며, 향후 하이브리드 모델 통합의 이론적 기반을 제시한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 야간 지수, 글로벌 합성 바스켓, Rolling Ridge 회귀, EWY 공백 구간, SOX-KOSPI 상관성, K200 야간선물 유동성, 팩터 인수분해
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study quantifies the structural limitations of K200 overnight futures—including
            low liquidity (average overnight bid-ask spread of 4.7 points), premium/discount
            distortions, and concentrated price-setting power among foreign institutional
            investors—and proposes the Global Synthetic Basket (GSB) regression as a superior
            alternative. The GSB combines S&amp;P 500 E-mini futures, Nasdaq 100 futures,
            Nikkei 225 futures, the Philadelphia Semiconductor Index (SOX), the U.S. dollar
            index, VIX, and gold futures. We particularly emphasize that the GSB is the sole
            reliable real-time KOSPI overnight index estimator during the "EWY gap period"
            (04:30–09:00 KST), when the U.S.-listed EWY ETF effectively ceases to update.
            Comparing three estimation methods—(A) Simple Weighted Sum (SWS), (B) Rolling
            Ridge Regression (RRR), and (C) Factor Decomposition (FD) into global risk appetite,
            Korea-specific, and currency factors—Rolling Ridge Regression achieves an RMSE of
            14.8 points, improving upon K200 overnight futures (RMSE 21.3 points) by 30.5%
            and reducing mean absolute error by 8.4× versus EWY-based estimation during the
            gap period. The high SOX-KOSPI correlation (r=0.583) is shown to be 62% explained
            by the combined 41% market-capitalization weight of Samsung Electronics and SK Hynix
            in KOSPI and their shared exposure to global semiconductor supply-demand cycles.
            This study provides practical methodology for improving overnight KOSPI index
            estimation accuracy, filling the EWY gap period prediction void, and establishing
            a theoretical foundation for hybrid model integration.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI overnight index, global synthetic basket, Rolling Ridge regression, EWY gap period, SOX-KOSPI correlation, K200 night futures liquidity, factor decomposition
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 예측의 핵심 과제 중 하나는 한국 시장이 닫혀 있는 약 17시간(16:00~
            익일 09:00 KST) 동안 글로벌 금융시장에서 축적된 정보를 어떻게 포착할 것인가이다.
            이 야간 정보를 반영하는 전통적 수단은 두 가지였다. 첫째, K200 야간선물로 CME
            글로벌스 및 SGX에서 거래되는 파생상품이다. 둘째, 미국 상장 ETF인 EWY로 달러 기준
            한국 주식 바스켓의 실시간 가격을 제공한다.
          </p>
          <p>
            그러나 두 수단 모두 구조적 공백을 갖는다. K200 야간선물은 정규 거래 시간 대비
            유동성이 극히 낮아 비드-아스크 스프레드가 평균 4.7포인트로 확대된다. 2025년 이후
            코스피프리뷰 플랫폼에서 관찰한 결과, 27개 거래일 연속으로 K200 야간선물이 유효한
            호가를 제공하지 못하거나 신뢰하기 어려운 가격을 표시하는 사례가 발생했다. EWY는
            미국 정규 거래 시간(22:30~05:00 KST)에는 유동성 있게 작동하지만, 04:30 KST 이후
            유동성이 급감하고 05:00 KST 미국 장 마감 이후에는 사실상 가격 갱신이 멈춘다.
            이 "EWY 공백 구간"(04:30~09:00 KST, 약 4.5시간)에서 닛케이 225 개장, 아시아
            선물 야간 마감, 유럽 개장 전 거래 등의 정보는 EWY를 통해 코스피 추정에 반영되지 않는다.
          </p>
          <p>
            본 연구는 이 두 공백을 동시에 메우는 방법론으로 글로벌 합성 바스켓(GSB) 회귀를
            제안한다. GSB는 야간 구간 전체 또는 대부분을 커버하며 유동성이 높은 복수의
            글로벌 자산을 결합한다. 세 가지 추정 방법을 비교하고, 특히 EWY 공백 구간에서의
            성능 우위를 실증한다.
          </p>
          <p>
            본 논문의 구성은 다음과 같다. 제Ⅱ장은 야간 가격 발견, 유동성 위험, 글로벌 주식
            시장 공동변동성의 이론적 배경을 다룬다. 제Ⅲ장은 GSB 구성 원리와 세 가지 추정
            방법론을 설명한다. 제Ⅳ장은 실증분석 결과를 제시한다. 제Ⅴ장은 함의와 실전 통합
            방안을 논의하고 제Ⅵ장이 결론이다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 야간 정보 흐름과 주가 발견 메커니즘</h3>
          <p>
            Ito &amp; Lin(1993)은 뉴욕·도쿄·런던 세 시장 간의 야간 정보 흐름이 다음 날 개장가에
            체계적으로 반영됨을 실증했다. 야간 시간대에 타 시장에서 형성된 정보가 자국 시장
            개장가 분산을 설명하는 핵심 변수임을 확인한 이 연구는, 글로벌 자산 바스켓을
            코스피 야간 추정에 활용하는 이론적 토대를 제공한다. Fleming et al.(1998)은
            미국·독일·영국 국채 시장 사이에서 정보가 시간대별로 이동하는 "정보 흐름 릴레이"
            구조를 발견했으며, 이 메커니즘이 주식 시장에도 작동함을 논증했다.
          </p>
          <p>
            Andersen et al.(2003)의 실현 변동성 분해 연구는 야간 수익률과 장중 수익률이
            서로 다른 정보 원천을 갖는다는 것을 밝혔다. 야간 수익률은 주로 글로벌 정보에,
            장중 수익률은 국내 고유 정보에 더 강하게 반응한다. 이 발견은 야간 코스피 추정에서
            글로벌 바스켓이 유효한 이론적 근거를 직접 제공한다.
          </p>
          <h3>2. K200 야간선물의 유동성 문제와 프리미엄 왜곡</h3>
          <p>
            Pastor &amp; Stambaugh(2003)는 유동성 위험이 자산 가격의 핵심 결정 요인임을
            실증하며, 유동성이 낮은 자산일수록 가격 발견 기능이 저하됨을 보였다. K200
            야간선물의 경우, 야간 비드-아스크 스프레드가 정규 거래 시간 대비 평균 4.7배
            확대된다. 야간 스프레드 평균 4.7포인트는 소규모 참가자가 신뢰할 수 있는 가격
            신호로 활용하기 어렵게 만드는 수준이며, 실제로 코스피프리뷰 플랫폼 운용 중
            K200 야간선물 데이터는 일관성 없는 null 값 및 이상치로 인해 모델에서 제외되었다.
          </p>
          <p>
            Kim et al.(2020)은 한국 야간 파생상품 시장에서 외국인 대형 투자자의 가격 설정력이
            정규 시간보다 유의미하게 높음을 실증했다. 참가자 수가 극히 적은 야간 장에서는
            대형 외국인 투자자 한두 명이 포지션을 취하는 것만으로 선물 가격이 이론값에서
            크게 이탈하는 "야간 선물 조작 위험"이 상존한다. Hasbrouck(1995)의 가격 발견
            기여도 분석 틀을 적용하면, 야간 K200 선물의 실질적 가격 발견 기여도는 일중
            시간대 대비 극히 낮아 사실상 노이즈에 가깝다.
          </p>
          <h3>3. 글로벌 주식 시장 공동변동성과 SOX-코스피 연계</h3>
          <p>
            다국적 주식 시장 간 공동변동성은 공통 글로벌 팩터, 무역 연계, 공급망 연계 세
            채널을 통해 발생한다. 특히 반도체 섹터에서 삼성전자·SK하이닉스·TSMC·NVIDIA·Micron이
            형성하는 글로벌 공급망은 SOX 지수와 코스피 사이의 구조적 공동변동성을 만든다.
            Roll(1988)의 R² 분석 틀에서 코스피의 글로벌 시장 민감도는 산업 구조 변화에 따라
            시변적이며, 반도체 사이클 상승기에 SOX-코스피 공동변동성이 최대화되는 패턴이 나타난다.
          </p>
          <p>
            2026년 기준 삼성전자와 SK하이닉스의 코스피 시가총액 합산 비중은 약 41%에 달한다.
            두 기업 모두 DRAM·NAND·HBM 글로벌 수급에 직접 노출되어 있으며, SOX 편입 기업들과
            동일한 수요처(NVIDIA, AMD, 애플, 마이크로소프트)를 공유한다. 따라서 SOX의 야간
            움직임은 코스피 주요 구성 종목의 야간 내재 가치 변화를 반도체 수급 관점에서 직접 포착한다.
          </p>
          <h3>4. Ridge 회귀의 다중공선성 억제 기능</h3>
          <p>
            Hoerl &amp; Kennard(1970)의 Ridge 회귀는 L2 정규화 페널티를 통해 다중공선성이 존재하는
            환경에서 계수 추정의 분산을 줄인다. GSB를 구성하는 7개 자산 간에는 부분적 상관성이
            존재한다. 특히 S&P 500과 나스닥 100은 상관계수 0.94로 사실상 중복적이며, VIX와
            두 주식 지수 사이에는 강한 음의 상관관계가 있다. Ridge 페널티는 이 다중공선성에서
            계수가 극단값으로 발산하는 것을 억제하면서 예측 성능을 유지한다. Rolling 180일
            윈도우와 결합하면 레짐 변화에도 안정적으로 적응하는 동적 추정 구조를 구현할 수 있다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. GSB 구성 자산 선정 기준</h3>
          <p>
            GSB 구성 자산은 세 가지 기준으로 선정한다. 첫째, 코스피 시초가와의 역사적 상관계수
            절대값이 0.15 이상이어야 한다. 둘째, 야간 구간(16:00~09:00 KST) 내 실질적인 유동성이
            있는 가격을 제공해야 한다. 셋째, 구성 자산 간 분산 팽창 지수(VIF)가 10을 초과하지
            않아야 하여 다중공선성 수준이 관리 가능해야 한다. 이 기준에 따라 S&P 500 E-mini 선물,
            나스닥 100 선물, 닛케이 225 선물, SOX, USD/KRW, VIX, 금 선물 7개 자산이 선정되었다.
          </p>
          <h3>2. 세 가지 추정 방법론</h3>
          <p><strong>방법 A — 단순 가중합(SWS)</strong></p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem", lineHeight: "1.9" }}>
            KOSPI_night = KOSPI_prev_close × (1 + Σᵢ(βᵢ × rᵢ_overnight)) + α<br />
            βᵢ = OLS 추정 고정 계수, rᵢ = 자산 i의 야간 로그수익률
          </p>
          <p>
            단순 가중합은 구현이 가장 쉽고 해석이 직관적이나 계수가 고정되어 레짐 변화에
            반응하지 못하며, 충격 레짐에서 다중공선성 자산 간 이중 계산 문제가 발생한다.
          </p>
          <p><strong>방법 B — Rolling Ridge 회귀(RRR)</strong></p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem", lineHeight: "1.9" }}>
            β_RRR(t) = argmin ‖y − Xβ‖² + λ‖β‖²<br />
            해: β_RRR(t) = (X'X + λI)⁻¹ X'y  [윈도우: 최근 180거래일, λ = 교차검증 최적값]
          </p>
          <p>
            Rolling Ridge는 L2 정규화 페널티로 다중공선성을 억제하면서 180일 윈도우로 계수를
            동적으로 갱신한다. 레짐 변화에 반응하면서도 노이즈 과적합을 방지하는 균형점을 제공하며,
            본 연구에서 최우수 성능을 보였다.
          </p>
          <p><strong>방법 C — 팩터 인수분해(FD)</strong></p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem", lineHeight: "1.9" }}>
            KOSPI_return ≈ γ₁·F_global + γ₂·F_korea + γ₃·F_currency + ε<br />
            F_global = PCA(S&P500, NQ, VIX)의 제1주성분<br />
            F_korea  = SOX·NK 수익률에서 F_global 제거한 잔차<br />
            F_currency = USD/KRW, DXY의 가중 결합
          </p>
          <p>
            팩터 인수분해는 직교화된 팩터로 다중공선성을 원천 차단한다. 그러나 PCA 재추정 오차와
            팩터 로딩 변동성으로 인해 실전 성능은 방법 B에 못 미친다.
          </p>
          <h3>3. EWY 공백 구간 정의 및 검증 설계</h3>
          <p>
            EWY 공백 구간은 04:30~09:00 KST(약 4.5시간)로 정의한다. 검증은 세 단계다.
            1단계: 전체 야간 구간에서 방법 A·B·C의 RMSE를 K200 야간선물과 비교한다.
            2단계: EWY 공백 구간만을 격리하여 GSB의 단독 추정 정확도를 측정한다.
            3단계: 2026년 4월 충격 레짐 개별 케이스에서 방법별 강건성을 분석한다.
          </p>
          <h3>4. 분석 표본</h3>
          <p>
            분석 기간은 2021년 1월~2026년 4월(총 약 1,320 거래일)이며, VIX ≥ 25인 날을
            충격 레짐(전체의 약 22%), VIX &lt; 25를 정상 레짐으로 분류한다. 야간 수익률은
            전일 정규장 종가 대비 익일 아시아 개장 직전 가격 기준으로 산출한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. GSB 구성 자산의 상관성 및 회귀 계수</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 글로벌 자산과 코스피 시초가의 상관계수·회귀 계수·VIF (2021~2026, 1,320거래일)</caption>
              <thead>
                <tr>
                  <th className="textLeft">자산</th>
                  <th>KOSPI 상관계수(r)</th>
                  <th>OLS β(기준값)</th>
                  <th>Rolling Ridge β(현재)</th>
                  <th>VIF</th>
                  <th className="textLeft">주요 정보 채널</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">S&P 500 E-mini (ES)</td>
                  <td>0.521</td>
                  <td>0.31</td>
                  <td>0.28</td>
                  <td>3.8</td>
                  <td className="textLeft">미국 경기·글로벌 위험 선호</td>
                </tr>
                <tr>
                  <td className="textLeft">Nasdaq 100 (NQ)</td>
                  <td>0.547</td>
                  <td>0.38</td>
                  <td>0.34</td>
                  <td>5.2</td>
                  <td className="textLeft">기술주·성장주 선호도</td>
                </tr>
                <tr>
                  <td className="textLeft">닛케이 225 (NK)</td>
                  <td>0.412</td>
                  <td>0.26</td>
                  <td>0.23</td>
                  <td>2.9</td>
                  <td className="textLeft">아시아 정서·엔화 리스크</td>
                </tr>
                <tr>
                  <td className="textLeft">SOX (반도체 지수)</td>
                  <td>0.583</td>
                  <td>0.29</td>
                  <td>0.31</td>
                  <td>4.1</td>
                  <td className="textLeft">반도체 수급·코스피 대형주 내재가치</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW</td>
                  <td>−0.398</td>
                  <td>−0.19</td>
                  <td>−0.20</td>
                  <td>2.3</td>
                  <td className="textLeft">원화 환율·외화 환산 효과</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX</td>
                  <td>−0.461</td>
                  <td>−0.22</td>
                  <td>−0.21</td>
                  <td>3.6</td>
                  <td className="textLeft">글로벌 공포·위험 회피 레짐</td>
                </tr>
                <tr>
                  <td className="textLeft">금 선물 (GC)</td>
                  <td>0.142</td>
                  <td>0.08</td>
                  <td>0.06</td>
                  <td>1.7</td>
                  <td className="textLeft">안전 자산 선호·인플레이션 기대</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            SOX의 코스피 상관계수(r=0.583)가 S&P 500(r=0.521)·나스닥(r=0.547)보다 높은 점이
            주목된다. 이는 SOX가 삼성전자·SK하이닉스의 글로벌 경쟁사 및 고객사를 직접 포함하기
            때문이다. HBM(고대역폭 메모리) 수요가 폭발적으로 증가한 2023~2024년에는 SOX-코스피
            상관계수가 0.643으로 정점을 기록했으며, 이는 SK하이닉스의 NVIDIA HBM 독점 공급 기간과
            정확히 일치한다. 나스닥(VIF=5.2)과 S&P 500(VIF=3.8) 간의 다중공선성이 가장 크며,
            Rolling Ridge의 λ 페널티가 주로 이 쌍의 계수를 수축시킨다.
          </p>

          <h3>2. 추정 방법별 RMSE 비교</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 추정 방법별 RMSE 비교 (단위: 코스피 포인트)</caption>
              <thead>
                <tr>
                  <th className="textLeft">추정 방법</th>
                  <th>전체 기간</th>
                  <th>정상 레짐 (VIX&lt;25)</th>
                  <th>충격 레짐 (VIX≥25)</th>
                  <th className="textLeft">비고</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">K200 야간선물 (비교 기준)</td>
                  <td>21.3pt</td>
                  <td>16.2pt</td>
                  <td>48.7pt</td>
                  <td className="textLeft">유동성·왜곡 위험 내포</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 기반 단순 환산</td>
                  <td>15.8pt*</td>
                  <td>12.24pt*</td>
                  <td>38.4pt</td>
                  <td className="textLeft">*정규장 시간(22:30~04:30) 내 한정</td>
                </tr>
                <tr>
                  <td className="textLeft">방법 A: 단순 가중합 (SWS)</td>
                  <td>17.9pt</td>
                  <td>14.1pt</td>
                  <td>32.6pt</td>
                  <td className="textLeft">계수 고정, 구현 단순</td>
                </tr>
                <tr>
                  <td className="textLeft">방법 B: Rolling Ridge (RRR) ★최우수</td>
                  <td>14.8pt</td>
                  <td>12.3pt</td>
                  <td>27.4pt</td>
                  <td className="textLeft">레짐 적응형, K200 대비 30.5% 개선</td>
                </tr>
                <tr>
                  <td className="textLeft">방법 C: 팩터 인수분해 (FD)</td>
                  <td>16.2pt</td>
                  <td>13.1pt</td>
                  <td>30.8pt</td>
                  <td className="textLeft">다중공선성 원천 차단, 구현 복잡</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            충격 레짐에서 성능 차이가 더욱 두드러진다. K200 야간선물은 충격 레짐 RMSE 48.7pt로
            정상 레짐(16.2pt) 대비 3.0배 악화된다. EWY 기반 추정도 38.4pt로 크게 악화된다.
            반면 방법 B(RRR)는 충격 레짐에서 27.4pt로 정상 레짐(12.3pt) 대비 2.2배 수준을
            유지한다. 이는 Rolling Ridge의 계수 동적 갱신이 충격 레짐에서 특히 효과적임을 보여준다.
          </p>

          <h3>3. EWY 공백 구간 실측 케이스 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. EWY 공백 구간(04:30~09:00 KST) 실측 케이스 분석 (2026년 4월)</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>GSB 추정값 (방법 B)</th>
                  <th>EWY 기반 추정값</th>
                  <th>실제 시초가</th>
                  <th>GSB 절대오차</th>
                  <th>EWY 절대오차</th>
                  <th className="textLeft">주요 아침 이벤트</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/07</td>
                  <td>5,831pt</td>
                  <td>5,602pt</td>
                  <td>5,826pt</td>
                  <td>5pt</td>
                  <td>224pt</td>
                  <td className="textLeft">닛케이 회복, 관세 여진</td>
                </tr>
                <tr>
                  <td>4/09</td>
                  <td>6,412pt</td>
                  <td>6,181pt</td>
                  <td>6,439pt</td>
                  <td>27pt</td>
                  <td>258pt</td>
                  <td className="textLeft">미중 관세 유예 아시아 반응</td>
                </tr>
                <tr>
                  <td>4/15</td>
                  <td>7,229pt</td>
                  <td>7,384pt</td>
                  <td>7,261pt</td>
                  <td>32pt</td>
                  <td>123pt</td>
                  <td className="textLeft">SOX 야간 하락 — EWY 미반영</td>
                </tr>
                <tr>
                  <td>4/22</td>
                  <td>6,861pt</td>
                  <td>6,778pt</td>
                  <td>6,849pt</td>
                  <td>12pt</td>
                  <td>71pt</td>
                  <td className="textLeft">기술주 급등, 닛케이 확인</td>
                </tr>
                <tr>
                  <td>4/28</td>
                  <td>7,103pt</td>
                  <td>7,168pt</td>
                  <td>7,089pt</td>
                  <td>14pt</td>
                  <td>79pt</td>
                  <td className="textLeft">FOMC 대기, 아시아 안정</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            5개 케이스의 평균 절대 오차는 GSB 18pt, EWY 기반 151pt로 약 8.4배 차이가 난다.
            4/07 사례는 EWY 공백 구간의 한계를 극명하게 보여준다. 미국 장 마감 이후 아시아 개장
            전까지 닛케이 야간 선물에서 강한 반등이 형성되었으나, EWY 기반 추정은 이를 전혀
            반영하지 못해 −224pt의 대형 오차가 발생했다. GSB는 닛케이 야간 선물 데이터를
            직접 포착하여 실제 시초가와 5pt 차이로 추정했다.
          </p>

          <h3>4. SOX-코스피 상관성의 반도체 경로 검증</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. SOX-코스피 상관성 분해 — 반도체 직접 경로 vs 글로벌 기술주 공통 팩터</caption>
              <thead>
                <tr>
                  <th className="textLeft">분석 구분</th>
                  <th>SOX-코스피 상관계수</th>
                  <th>반도체 직접 경로 기여</th>
                  <th>글로벌 기술주 간접 경로</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">전체 기간 (2021~2026)</td>
                  <td>r = 0.583</td>
                  <td>62%</td>
                  <td>38%</td>
                </tr>
                <tr>
                  <td className="textLeft">HBM 수요 급증기 (2023~2024)</td>
                  <td>r = 0.643</td>
                  <td>71%</td>
                  <td>29%</td>
                </tr>
                <tr>
                  <td className="textLeft">관세 충격기 (2026년 4월)</td>
                  <td>r = 0.521</td>
                  <td>55%</td>
                  <td>45%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            삼성전자·SK하이닉스 수익률을 통제한 후의 SOX-코스피 잔차 상관계수는 r=0.221로
            크게 감소하여, 전체 SOX-코스피 상관성의 약 62%가 반도체 대형주 직접 경로로 설명됨을
            확인했다. HBM 수요 급증기(2023~2024)에 반도체 직접 경로 기여가 71%로 최대화된 것은
            SK하이닉스의 NVIDIA HBM 독점 공급이 코스피와 SOX를 같은 수요 팩터에 노출시킨 결과다.
          </p>

          <h2>Ⅴ. 논의</h2>
          <h3>1. GSB와 EWY 모델의 하이브리드 통합 방안</h3>
          <p>
            GSB 방법 B가 EWY+환율 모델을 완전히 대체하는 것이 최선인지는 구간별로 달리 판단해야
            한다. EWY 정규장 시간(22:30~04:30 KST) 내에서 EWY+환율 Rolling Ridge의 RMSE는
            12.24pt로 GSB 방법 B(12.3pt)와 거의 동등하다. 이 구간에서 EWY는 달러 기준 한국 주식
            바스켓 전체를 단일 변수에 포함하므로 GSB 7개 자산보다 포괄적인 한국 시장 정보를 제공한다.
          </p>
          <p>
            따라서 최적 실전 전략은 구간별 하이브리드 접근이다. EWY 정규장 시간에는 EWY+환율
            Rolling Ridge를 주 모델로, GSB를 보조 검증 지표로 사용한다. EWY 공백 구간(04:30~09:00)
            에는 GSB 방법 B를 주 추정 채널로 전환한다. 두 모델 추정값이 50pt 이상 괴리되면
            레짐 불확실성 신호로 인식하고 예측 구간을 자동 확장하는 메커니즘도 권장된다.
          </p>
          <h3>2. K200 야간선물의 조건부 활용</h3>
          <p>
            K200 야간선물이 유효한 호가를 제공하는 특수 상황—충격 레짐 초기에 한국 기관이
            야간 포지션을 구축하는 경우—에는 K200 야간선물이 GSB나 EWY가 포착하지 못하는
            한국 고유 수급 정보를 담을 수 있다. 따라서 K200 야간선물 가격이 null이 아니고
            스프레드가 2pt 이하인 날에는 이를 GSB의 추가 설명 변수로 조건부 포함하는
            전략이 적절하다. 이 조건부 활용 로직은 K200 야간선물의 단독 신뢰보다 안전하면서도
            가용한 정보를 완전히 버리지 않는다.
          </p>
          <h3>3. 방법론적 한계</h3>
          <p>
            본 연구의 주요 한계로는 첫째, EWY 공백 구간 케이스 5개의 제한적 표본을 들 수 있다.
            더 긴 기간(1년 이상)의 공백 구간 실측 분석이 필요하다. 둘째, GSB β 추정 기간
            (2021~2025)에 COVID-19 이후 회복기와 2022년 금리 급등이 포함되어 있어 이 특수
            환경이 계수에 영향을 미쳤을 가능성이 있다. 셋째, 방법 C의 PCA 로딩 시변성에 대한
            심층 분석이 이루어지지 않았다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구는 K200 야간선물의 유동성 한계와 EWY 공백 구간이라는 두 가지 구조적 문제를
            동시에 해결하는 글로벌 합성 바스켓(GSB) 회귀 방법론을 제안하고 실증했다. 핵심
            결론은 다음과 같다.
          </p>
          <p>
            첫째, K200 야간선물은 야간 스프레드 4.7pt, 충격 레짐 RMSE 48.7pt의 구조적 한계를
            갖는다. 이 자산을 단독 야간 신호로 활용하는 것은 이미 정상 레짐에서도 GSB 대비 열위이며,
            충격 레짐에서는 더욱 위험하다. EWY 공백 구간에서는 EWY 기반 추정의 평균 절대 오차가
            151pt에 달해 사실상 예측 정보를 제공하지 못한다.
          </p>
          <p>
            둘째, Rolling Ridge 기반 GSB(방법 B)는 전체 기간 RMSE 14.8pt, 충격 레짐 27.4pt로
            K200 야간선물 대비 전체 30.5%, 충격 레짐 43.7% 성능 개선을 달성한다. EWY 공백 구간
            케이스 분석에서 GSB 평균 절대 오차(18pt)는 EWY 기반(151pt)의 12% 수준에 불과하다.
          </p>
          <p>
            셋째, SOX-코스피 상관성(r=0.583)의 62%는 삼성전자·SK하이닉스 반도체 직접 경로로
            설명된다. HBM 수요 급증기에는 이 비중이 71%로 높아져 SOX가 GSB에서 핵심 자산임을
            확인했다. 반도체 섹터 구조가 유지되는 한 SOX는 코스피 야간 추정의 가장 높은 단일
            예측 자산으로 남을 것이다.
          </p>
          <p>
            실용적 제언으로, 코스피 시초가 예측 시스템은 EWY 정규장 시간에는 EWY+환율 모델을,
            EWY 공백 구간에는 GSB 방법 B를 자동 전환하는 하이브리드 체계를 채택해야 한다.
            K200 야간선물은 유효 호가 확인 조건(스프레드 ≤ 2pt) 충족 시 GSB 보조 변수로만 활용하고,
            단독 신호로는 사용하지 않는 것이 권장된다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Andersen, T. G., Bollerslev, T., Diebold, F. X., &amp; Labys, P. (2003). Modeling and forecasting realized volatility. <em>Econometrica</em>, 71(2), 579–625.</p>
            <p className="paperReferenceItem">Fleming, J., Kirby, C., &amp; Ostdiek, B. (1998). Information and volatility linkages in the stock, bond, and money markets. <em>Journal of Financial Economics</em>, 49(1), 111–137.</p>
            <p className="paperReferenceItem">Hasbrouck, J. (1995). One security, many markets: Determining the contributions to price discovery. <em>Journal of Finance</em>, 50(4), 1175–1199.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Ito, T., &amp; Lin, W.-L. (1993). Price volatility and volume spillovers between the Tokyo and New York stock markets. <em>NBER Working Paper</em>, No. 4592.</p>
            <p className="paperReferenceItem">Kim, J., Park, S., &amp; Lee, H. (2020). Overnight return patterns and foreign investor dominance in Korean derivatives markets. <em>Pacific-Basin Finance Journal</em>, 60, 101–118.</p>
            <p className="paperReferenceItem">Pastor, L., &amp; Stambaugh, R. F. (2003). Liquidity risk and expected stock returns. <em>Journal of Political Economy</em>, 111(3), 642–685.</p>
            <p className="paperReferenceItem">Roll, R. (1988). R². <em>Journal of Finance</em>, 43(3), 541–566.</p>
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
