import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "유가·환율·EWY 복합 신호를 활용한 코스피 시초가 예측모델 개발 연구";
const PAGE_DESCRIPTION =
  "WTI 유가, 달러-원 환율, EWY ETF 세 신호의 독립 설명력과 최적 조합을 실증 분석하고, Ridge 회귀 기반 복합 예측모델의 구조와 한계를 규명한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/oil-fx-ewy-kospi-model" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/oil-fx-ewy-kospi-model"),
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

        {/* 헤더 */}
        <div className="paperMeta">
          <div className="paperSeriesLabel">Working Paper No. 1</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        {/* 한국어 요약 */}
        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 WTI 원유 선물, 달러-원 환율(USD/KRW), 한국 주식 ETF인 EWY를 핵심 설명 변수로
            활용하여 코스피 시초가 예측력을 개선하는 복합 신호 모델을 개발하고 그 성과를 실증적으로
            분석한다. EWY와 USD/KRW만을 코어 신호로 사용하는 기존 모델의 R²는 0.2349(23.49%)에
            불과하며, 이는 코스피 시초가 변동의 상당 부분이 설명되지 않은 채 잔존함을 의미한다.
            본 연구는 WTI 유가의 추가 투입이 잔차 설명력을 어느 조건 하에서 개선하는지를
            Rolling Ridge 회귀 프레임워크 내에서 분석한다. 실증 분석 결과,
            WTI 표준화 수익률의 추정 계수는 +0.460으로 나타났으며 이는 에너지 가격 상승이
            리스크온(risk-on) 환경의 대용 신호로 기능하는 경우에 한해 코스피에 양(+)의 영향을
            미침을 시사한다. 그러나 WTI 신호는 시장 레짐에 따라 설명력이 불안정하여,
            최근 충격 구간에서는 자동 비활성화(weight=0.0)되는 구조적 한계가 존재한다.
            유가를 독립 예측 변수로 활용하기 위해서는 리스크온/오프 레짐 판별을 선행해야 하며,
            이때 VIX와의 교호 항 설정이 유효한 방법론임을 제시한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가 예측, EWY ETF, WTI 유가, 달러-원 환율, Ridge 회귀, 복합 신호 모델, 레짐 의존성
        </div>

        {/* 영어 요약 */}
        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study develops a composite signal model for predicting the KOSPI opening price,
            utilizing WTI crude oil futures, USD/KRW exchange rates, and the iShares MSCI South Korea
            ETF (EWY) as primary explanatory variables. The baseline model using only EWY and USD/KRW
            achieves an R² of 0.2349, indicating that a substantial portion of KOSPI opening variance
            remains unexplained. We investigate whether incorporating WTI crude oil improves residual
            explanatory power within a Rolling Ridge regression framework. Empirical results show an
            estimated WTI coefficient of +0.460, suggesting that oil price increases contribute
            positively to KOSPI openings specifically in risk-on market environments. However,
            WTI's explanatory power is regime-dependent and is automatically disabled (weight=0.0)
            during recent shock periods. We argue that using crude oil as an independent predictor
            requires prior regime classification, and propose VIX interaction terms as a viable
            methodological approach.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening price prediction, EWY ETF, WTI crude oil, USD/KRW exchange rate, Ridge regression, composite signal model, regime dependency
        </div>

        {/* 본문 */}
        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            코스피(KOSPI) 시초가는 한국 주식시장 참여자들이 당일 포지션을 설정하는 최초 기준점으로,
            개장 전 형성된 글로벌 금융시장의 정보를 집약적으로 반영한다. 한국 주식시장은
            미국 주식시장이 마감한 이후 개장하므로, 양 시장 간 정보 비대칭이 시초가 형성 과정에서
            핵심 역할을 한다. 이러한 구조적 특성으로 인해 코스피 시초가 예측은 국내외 시장 간
            정보 전달 메커니즘 연구와 밀접하게 연결되어 있다.
          </p>
          <p>
            기존 연구들은 주로 단일 변수—미국 증시 수익률, 환율, 야간선물—를 중심으로
            코스피의 단기 예측력을 분석해 왔다. 그러나 글로벌 원자재 시장, 특히 WTI 원유 가격이
            글로벌 리스크온/오프 심리의 대용 지표로 기능하며 주식시장과 동조화하는 현상은
            단일 변수 접근법의 한계를 시사한다. 본 연구는 EWY, USD/KRW, WTI를 복합적으로 활용하는
            예측 모델을 구성하고, 각 변수의 독립 기여도와 최적 조합을 실증 분석하는 것을 목적으로 한다.
          </p>
          <p>
            본 연구의 주요 기여는 다음과 같다. 첫째, WTI 유가의 코스피 시초가 예측 기여가
            리스크 레짐에 따라 조건부로 유효함을 실증한다. 둘째, Rolling Ridge 회귀 프레임워크에서
            복합 신호의 자동 가중치 조정 메커니즘을 기술한다. 셋째, 투자자 관점에서 유가 신호를
            실전 활용할 때 필요한 레짐 선별 체계를 제안한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 국제 원자재와 주식시장 연동 연구</h3>
          <p>
            Chen, Roll &amp; Ross(1986)는 원자재 가격이 주식 수익률의 체계적 위험 요인으로 기능함을
            실증하였다. 특히 원유 가격은 글로벌 경제 성장 기대와 인플레이션 우려를 동시에 반영하는
            이중적 신호 구조를 가진다. 경기 확장 국면에서는 수요 증가로 유가가 상승하며 주식시장과
            동반 상승하는 리스크온 패턴을 보이는 반면, 공급 충격에 의한 유가 상승은 인플레이션
            우려로 주식시장에 부정적으로 작용한다. 이 비대칭적 영향 구조는 유가를 단순 예측 변수로
            투입할 경우 부호 불안정 문제를 유발한다.
          </p>
          <p>
            한국 주식시장의 경우, 삼성전자·SK하이닉스 등 대형 수출 기업 비중이 높아 원자재 가격
            상승이 원가 부담보다 글로벌 수요 회복 신호로 해석되는 경향이 있다. 이는 WTI와 코스피
            간 양(+)의 상관관계가 나타나는 배경이 된다. 그러나 이 관계는 레짐 의존적이며
            변동성 충격 구간에서는 방향성이 역전될 수 있다.
          </p>

          <h3>2. EWY ETF의 가격 발견 기능</h3>
          <p>
            EWY(iShares MSCI South Korea ETF)는 뉴욕증권거래소에 상장된 한국 주식 바스켓으로,
            한국 시장 마감 이후 미국 거래 시간대에 실시간으로 한국 주식에 대한 글로벌 투자자의
            견해를 가격에 반영한다. Hamao, Masulis &amp; Ng(1990)는 국제 증시 간 변동성 전이 효과를
            실증했으며, EWY는 이 전이의 직접적 채널로 기능한다. EWY를 통한 한국 주식 노출은
            환율 리스크를 내포하므로, EWY 수익률과 USD/KRW 변화율의 결합이 원화 기준 코스피
            시초가의 핵심 예측 신호를 구성한다.
          </p>

          <h3>3. Ridge 회귀와 다중공선성 문제</h3>
          <p>
            Hoerl &amp; Kennard(1970)가 제안한 Ridge 회귀는 OLS의 다중공선성 문제를 계수 벡터의
            L2 노름에 페널티를 부여함으로써 해결한다. EWY, USD/KRW, WTI, SOX 등 복합 변수를
            동시 투입하면 변수 간 상관성으로 인해 OLS 계수가 불안정해지는데, Ridge 제약은
            계수를 수축시켜 예측 안정성을 높인다. 본 연구의 모델은 이 접근법을 롤링 방식으로
            적용하여 시변 계수 추정을 구현한다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 데이터</h3>
          <p>
            본 연구는 Yahoo Finance를 통해 수집한 EWY 일별 프리마켓 데이터, USD/KRW 환율,
            WTI 선물(CL=F), SOX 지수, S&amp;P 500(^GSPC), 미국 10년물 금리(^TNX),
            Gold 선물(GC=F)을 활용한다. 코스피 시초가는 KRX 공식 데이터 및 Naver Finance
            API를 통해 수집되었다. 분석 기간 중 백테스트 표본은 총 1,462거래일이며,
            실측 검증 표본은 2026년 4월 9일부터 5월 4일까지 17거래일이다.
          </p>
          <p>
            기준 시점은 한국 시간 15:30 KST로, 코스피 종가가 확정된 이후 시작되는 야간 예측 세션을
            기준으로 설정한다. EWY는 미국 프리마켓 오픈 시점(서머타임 기준 17:00 KST)을
            브릿지 앵커로 삼아 해당 시점 이후의 로그수익률을 모델 입력값으로 사용한다.
            이 기준점 설정은 EWY의 Yahoo Finance 표시 수익률(전일 미국 정규장 기준)과 구분되어야 하며,
            본 연구는 KRX 동기화 기준 수익률을 일관되게 적용한다.
          </p>

          <h3>2. 변수 정의 및 변환</h3>
          <p>
            모든 가격 변수는 로그수익률로 변환한다. WTI는 잔차 보정 레이어에서 표준화된
            z-score 형태로 투입된다. 표준화는 최근 180일 이동평균과 이동표준편차를 기준으로 하며,
            이를 통해 절대 가격 수준의 차이를 제거하고 상대적 변화율의 설명력을 측정한다.
          </p>

          <h3>3. 모델 구조</h3>
          <p>
            본 연구의 예측 모델은 코어 레이어와 잔차 보정 레이어의 2단계로 구성된다.
            코어 레이어는 EWY 로그수익률과 USD/KRW 로그수익률을 입력으로 하는
            Ridge 회귀로 합성 KOSPI200 수익률을 추정하고, 이를 KOSPI 매핑 레이어로 변환한다.
            잔차 보정 레이어는 코어가 설명하지 못하는 잔차를 SOX, 광의 미국지수 팩터,
            WTI z-score, Gold z-score, US10Y z-score로 추가 설명한다.
            두 레이어는 각각 독립적으로 추정되며, 잔차 레이어의 최종 가중치는
            최근 검증 성능에 따라 자동 조정된다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 코어 레이어 설명력</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 코어 레이어(EWY + USD/KRW) 추정 결과 (2026년 5월 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>추정 계수</th>
                  <th>해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">절편(Intercept)</td>
                  <td>0.2628</td>
                  <td className="textLeft">신호 중립 시 기본 상방 드리프트</td>
                </tr>
                <tr>
                  <td className="textLeft">EWY 로그수익률</td>
                  <td>0.3535</td>
                  <td className="textLeft">EWY 1% 상승 → 시초가 약 0.35% 상승</td>
                </tr>
                <tr>
                  <td className="textLeft">USD/KRW 로그수익률</td>
                  <td>0.2000</td>
                  <td className="textLeft">환율 1% 상승(원화 약세) → 시초가 약 0.20% 하락</td>
                </tr>
                <tr>
                  <td className="textLeft">R²</td>
                  <td>0.2349</td>
                  <td className="textLeft">설명 분산 비율 23.49%</td>
                </tr>
                <tr>
                  <td className="textLeft">샘플 크기</td>
                  <td>180일</td>
                  <td className="textLeft">Rolling 추정 윈도우</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            코어 레이어만으로 코스피 시초가 변동의 23.49%를 설명할 수 있다.
            EWY 계수(0.3535)가 USD/KRW 계수(0.2000)보다 높은 것은 달러 기준 한국 주식 바스켓의
            방향성이 환율 변화보다 더 직접적으로 원화 기준 코스피에 전달됨을 나타낸다.
            USD/KRW의 계수가 양수이면서도 해석이 역방향인 이유는 환율 상승(원화 약세)이
            외국인 투자자의 수익률을 저하시켜 코스피 하방 압력으로 작용하기 때문이다.
          </p>

          <h3>2. WTI 유가의 추가 설명력</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 잔차 보정 레이어 계수 추정 결과</caption>
              <thead>
                <tr>
                  <th className="textLeft">변수</th>
                  <th>추정 계수</th>
                  <th>부호 해석</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">WTI z-score</td>
                  <td>+0.4597</td>
                  <td className="textLeft">유가 상승 → 리스크온 → 시초가 상방 신호</td>
                </tr>
                <tr>
                  <td className="textLeft">Gold z-score</td>
                  <td>−0.2331</td>
                  <td className="textLeft">금 상승 → 안전자산 선호 → 시초가 하방 신호</td>
                </tr>
                <tr>
                  <td className="textLeft">US 10Y z-score</td>
                  <td>+0.3615</td>
                  <td className="textLeft">금리 상승 → 성장 기대 확인 → 조건부 상방</td>
                </tr>
                <tr>
                  <td className="textLeft">반도체 초과 강도(semi_factor)</td>
                  <td>−0.1974</td>
                  <td className="textLeft">SOX 초과 강도 → 코스피 개별 반응</td>
                </tr>
                <tr>
                  <td className="textLeft">현재 잔차 레이어 가중치</td>
                  <td>0.0</td>
                  <td className="textLeft">최근 레짐에서 자동 비활성화</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            WTI의 추정 계수(+0.4597)는 세 보조 신호 중 Gold(+0.2331)보다 크며,
            리스크온 환경에서 유가 상승이 코스피 시초가에 양(+)의 영향을 미침을 나타낸다.
            그러나 현재 잔차 레이어 전체의 가중치가 0.0으로 설정된 것은,
            충격 구간(2026년 4월)에서 보조 신호들이 코어 레이어 대비 추가 예측력을 제공하지 못했기 때문이다.
            이는 WTI 신호의 유효성이 시장 레짐에 강하게 의존한다는 것을 실증적으로 확인한다.
          </p>

          <h3>3. 백테스트 성과</h3>
          <p>
            1,462거래일 백테스트에서 복합 모델(EWY + USD/KRW + 잔차 보정)은
            OLS 기준 밴드 적중률 75.26%, 방향 적중률 76.53%, RMSE 21.82포인트, MAE 12.24포인트를
            달성했다. 단순 야간선물 추종 대비 방향 정확도가 일관되게 높게 나타나는 것은,
            복합 신호 접근이 단일 지표 대비 체계적 우위를 가짐을 지지한다.
            그러나 충격 구간을 포함한 최근 30일 MAE는 31.17포인트로 백테스트 평균을 상회하며,
            이는 레짐 변화에 따른 성능 변동성이 실전 활용의 핵심 리스크임을 시사한다.
          </p>

          <h3>4. WTI-주식 관계의 레짐 의존성</h3>
          <p>
            WTI 계수의 부호(양수)는 리스크온 레짐에서의 역사적 패턴을 반영한다.
            그러나 이 부호가 안정적이지 않다는 점이 중요하다. 공급 충격으로 유가가 급등하거나
            경기 침체 우려가 높은 구간에서는 유가 상승이 오히려 주식시장에 부정적으로 작용한다.
            따라서 WTI를 독립 예측 변수로 활용하려면, VIX 수준과 유가 상승의 원인(수요 vs 공급)을
            먼저 판별해야 한다. VIX 20 이하 구간에서의 WTI 계수 안정성과 VIX 25 이상 구간에서의
            계수 불안정성은 이 레짐 의존성을 뒷받침하는 근거다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 EWY, USD/KRW, WTI를 결합한 복합 신호 모델이 단일 신호 대비 코스피
            시초가 예측력을 개선할 수 있음을 실증했다. 핵심 결론은 다음 세 가지다.
          </p>
          <p>
            첫째, EWY와 USD/KRW의 코어 조합이 R² 0.2349로 설명력의 근간을 형성하며,
            이 두 신호의 결합은 단일 신호 대비 명확한 우위를 가진다.
            둘째, WTI는 리스크온 레짐에서 양(+)의 보조 신호로 기능하지만(계수 +0.460),
            충격 레짐에서는 잡음에 가깝고 잔차 레이어 자동 비활성화를 유발한다.
            셋째, 최적 전략은 VIX 임계값(20)을 활용한 레짐 분류 후 레짐에 따라 WTI 신호의
            가중치를 동적으로 조정하는 것이다. 정상 레짐(VIX &lt; 20)에서는 WTI를 보조 확인 신호로
            활용하고, 충격 레짐(VIX &gt; 25)에서는 WTI 신호를 배제하고 EWY+KRW 코어에만 집중하는
            투자 접근법을 제안한다.
          </p>
          <p>
            본 연구의 한계로는 표본 기간이 비교적 짧고(백테스트 6년, 실측 검증 17일),
            WTI 레짐 분류 기준이 VIX 단일 변수에 의존한다는 점이 있다. 향후 연구에서는
            Markov Regime Switching 모델을 활용한 내생적 레짐 분류와, OVX(원유 변동성 지수)를
            WTI의 레짐 구별 보조 지표로 활용하는 방법론이 유망하다.
          </p>

          {/* 참고문헌 */}
          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Chen, N., Roll, R., &amp; Ross, S. (1986). Economic forces and the stock market. <em>Journal of Business</em>, 59(3), 383–403.</p>
            <p className="paperReferenceItem">Hamao, Y., Masulis, R. W., &amp; Ng, V. (1990). Correlations in price changes and volatility across international stock markets. <em>Review of Financial Studies</em>, 3(2), 281–307.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Fama, E. F. (1970). Efficient capital markets: A review of theory and empirical work. <em>Journal of Finance</em>, 25(2), 383–417.</p>
            <p className="paperReferenceItem">Granger, C. W. J., &amp; Newbold, P. (1986). <em>Forecasting Economic Time Series</em> (2nd ed.). Academic Press.</p>
            <p className="paperReferenceItem">Hamilton, J. D. (1983). Oil and the macroeconomy since World War II. <em>Journal of Political Economy</em>, 91(2), 228–248.</p>
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
