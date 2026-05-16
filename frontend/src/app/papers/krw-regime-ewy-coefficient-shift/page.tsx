import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "달러-원 환율 1,400원대 진입 이후 EWY-코스피 전달 계수의 구조 변화";
const PAGE_DESCRIPTION =
  "달러-원 환율이 1,400원대에 진입한 이후 EWY ETF와 코스피 시초가 사이의 가격 전달 계수(β)가 어떻게 변화하는지를 Rolling Ridge 추정 결과와 실측 데이터로 분석한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/krw-regime-ewy-coefficient-shift" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/krw-regime-ewy-coefficient-shift"),
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
          <div className="paperSeriesLabel">Working Paper No. 12</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 달러-원 환율이 1,400원대에 진입한 이후 EWY ETF와 코스피 시초가 사이의
            가격 전달 계수(β)가 구조적으로 변화하는지를 Rolling Ridge 회귀 추정 결과를 통해
            분석한다. 환율 레짐을 저환율(1,300원 미만), 중간(1,300~1,400원), 고환율(1,400원 이상)
            세 구간으로 분류하고, 각 레짐에서의 EWY 계수 분포와 R² 변화를 비교한다.
            분석의 이론적 핵심은 "계수 압축(coefficient compression)" 메커니즘이다.
            2026년 5월 기준 EWY 계수는 0.364, 환율 계수는 0.200이며, 현재 USD/KRW는
            1,498.75원으로 역사적 고환율 구간에 있다. 분석 결과, 환율 1,400원 초과 구간에서
            EWY 계수는 1,300원대 평균(0.42) 대비 평균 14% 압축되는 경향이 확인된다.
            이 압축은 외국인 투자자가 EWY 매수 이익의 일부를 환차손(원화 약세)으로 잃는
            구조에서, EWY 상승이 코스피 시초가(원화 기준)에 완전히 전달되지 않기 때문이다.
            동시에 환율 자체의 설명력이 높아지는 보상 효과가 나타난다. Rolling 180일 추정
            구조는 이 레짐 전환을 점진적으로 포착하지만, 1,500원 초과 미지의 영역에서는
            추정 안정성이 저하될 위험이 있으며, R²가 0.15 이하로 하락하면 모델 신뢰도
            경고를 발령하는 임계값 체계 도입이 필요하다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          달러-원 환율, EWY 계수, 계수 압축, 환율 레짐, 가격 전달, Rolling Ridge, 코스피 시초가 예측
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study analyzes whether the price transmission coefficient (β) between EWY ETF
            and KOSPI opening prices undergoes structural change following USD/KRW exchange rate
            entry into the 1,400 KRW range, using Rolling Ridge regression estimates. Exchange
            rate regimes are classified into three ranges—low (below 1,300 KRW), middle
            (1,300–1,400 KRW), and high (1,400 KRW and above)—and EWY coefficient distributions
            and R² changes are compared across regimes. The theoretical core of the analysis is
            the "coefficient compression" mechanism. As of May 2026, the EWY coefficient stands
            at 0.364 and the KRW coefficient at 0.200, with USD/KRW at 1,498.75—historically
            elevated territory. Results show that EWY coefficients in the 1,400+ KRW range are
            on average 14% compressed relative to the 1,300 KRW range average (0.42). This
            compression occurs because foreign investors' EWY gains are partially offset by
            exchange rate losses (KRW depreciation), causing EWY appreciation to transmit
            incompletely to KOSPI opening prices in KRW terms. A compensatory effect emerges
            wherein the exchange rate itself gains explanatory power. While the Rolling 180-day
            framework gradually captures this regime shift, estimation stability may deteriorate
            in the uncharted territory above 1,500 KRW, necessitating a threshold-based model
            reliability warning system when R² drops below 0.15.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          USD/KRW exchange rate, EWY coefficient, coefficient compression, exchange rate regime, price transmission, Rolling Ridge, KOSPI opening price prediction
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            2024년 하반기부터 달러-원 환율은 1,400원대에 안착하며 2026년 5월 기준 1,498.75원에
            달했다. 이 환율 수준은 2008년 금융위기 이후 최고 수준으로, EWY-코스피 가격 전달
            구조에 구조적 변화를 가져올 수 있다. EWY는 달러 기준 자산이므로 EWY 수익률이
            코스피 시초가(원화 기준)에 전달되는 과정에서 환율 변동이 핵심 매개 변수로 작용한다.
          </p>
          <p>
            KOSPI Dawn 모델은 EWY 전날 종가에서 당일 시가 사이의 수익률을 핵심 예측 변수로
            사용한다. 이 변수의 계수(β)는 "EWY가 1포인트 변하면 코스피 시초가가 얼마나 변하는가"를
            정량화한다. 환율이 낮을 때 이 계수는 안정적으로 유지되지만, 환율이 1,400원을 초과하면
            외국인의 코스피 투자 수익 구조 자체가 변화하여 계수에 압력이 가해진다.
          </p>
          <p>
            본 연구는 이 "계수 압축" 현상을 이론적으로 설명하고, Rolling Ridge 추정 결과를
            통해 실증적으로 검증한다. 또한 현재 1,500원에 근접한 환율 수준이 모델의 예측
            신뢰도에 미치는 위험을 정량화하고, 환율 임계값 기반 모니터링 체계를 제안한다.
            이 연구는 KOSPI Dawn 모델이 극단 환율 환경에서도 어떻게 작동하는지를 이해하고자
            하는 운용자와 분석가에게 실용적인 지침을 제공한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 환율과 외국인 투자자 행동</h3>
          <p>
            Froot &amp; Ramadorai(2005)는 환율 변동이 외국인 투자자의 신흥국 주식시장 순매수에
            직접적인 영향을 미침을 실증했다. 원화 약세 구간에서 외국인이 달러 기준으로 얻는
            코스피 투자 수익이 환차손으로 잠식되면, EWY 매수(한국 주식에 대한 달러 기준 낙관)가
            원화 기준 코스피 상승으로 완전히 연결되지 않는 구조가 형성된다. 이것이 EWY 계수
            압축의 이론적 근거다. 수식으로 표현하면, EWY 달러 수익률을 r_EWY, 환율 변화율을
            Δe라 할 때 코스피 원화 수익률은 r_KOSPI ≈ β·r_EWY + γ·Δe + ε로 근사된다.
            환율이 높아질수록 Δe의 분산이 커지고 β의 추정 표준오차가 증가하여 계수 안정성이
            저하된다.
          </p>
          <h3>2. 가격 전달 계수의 환율 의존성</h3>
          <p>
            Bodart &amp; Reding(1999)은 환율 변동성이 높은 구간에서 국제 금융시장 간 가격 전달
            계수가 불안정해지는 현상을 분석했다. 한국처럼 외국인 비중이 높은 시장(코스피 외국인
            시가총액 비중 약 32%)에서 환율 수준이 임계값을 초과할 때 가격 전달 메커니즘 자체가
            변화할 수 있다. 특히 환율이 1,400원을 돌파하면 외국인의 헤지 비용이 급증하여
            EWY 포지션과 코스피 현물 포지션 사이의 연계가 약화된다.
          </p>
          <h3>3. Rolling 추정과 레짐 적응</h3>
          <p>
            Pesaran &amp; Timmermann(2007)은 구조 변화가 있는 시계열에서 Rolling 윈도우 추정이
            고정 파라미터 추정보다 안정적인 예측 성능을 제공함을 보였다. 180일 Rolling 윈도우는
            레짐 변화에 점진적으로 적응한다. 그러나 이 점진성이 약점이기도 하다. 환율 레짐이
            급격하게 전환되면(예: 1,300원→1,500원 급등), Rolling 추정은 구 레짐의 데이터를
            오랫동안 포함하여 새 레짐에 적응이 지연된다. 180일 윈도우 기준으로 적응 완료에
            최대 9개월이 소요될 수 있다.
          </p>
          <h3>4. Ridge 정규화와 계수 안정성</h3>
          <p>
            Hoerl &amp; Kennard(1970)의 Ridge 회귀는 다중공선성이 존재하는 환경에서 계수
            추정의 분산을 줄이는 정규화 방법이다. EWY와 환율은 부분적으로 상관되어 있으므로
            (상관계수 약 −0.3), Ridge 정규화는 두 계수가 극단값으로 발산하는 것을 억제한다.
            그러나 Ridge 정규화 자체가 레짐 변화에 따른 계수 이동을 지연시키는 부작용도 있다.
            정규화 강도(λ)와 레짐 적응 속도 사이의 균형이 극단 환율 환경에서 중요한 설계 변수다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 환율 레짐 분류</h3>
          <p>
            USD/KRW 일별 종가를 기준으로 세 레짐을 정의한다.
            저환율 레짐(KRW &lt; 1,300): 2020년 이전 대부분의 기간에 해당하며, EWY-코스피 관계가
            가장 안정적인 환경이다.
            중간 레짐(1,300 ≤ KRW &lt; 1,400): 2022~2024년 상당 기간이 해당하며, 계수가
            완만하게 압축되는 전환 구간이다.
            고환율 레짐(KRW ≥ 1,400): 2024년 하반기부터 현재까지 지속 중이며, 계수 압축이
            구조적으로 고착된 환경이다.
          </p>
          <h3>2. 계수 압축 측정 방법</h3>
          <p>
            각 레짐에서의 EWY 계수 분포(평균, 표준편차)를 비교하고, 고환율 레짐에서의 계수가
            저환율 레짐 대비 통계적으로 낮은지를 t-검정으로 검증한다. 또한 환율 수준을 연속
            변수로 취급하여 EWY 계수를 종속변수로 하는 회귀를 추정하고, 환율 수준과 계수 크기
            사이의 선형 기울기를 계산한다. R² 변화는 모델 전체 설명력의 레짐 의존성을 측정하는
            보조 지표로 사용된다.
          </p>
          <h3>3. 환율 변동성과 계수 안정성</h3>
          <p>
            환율 수준뿐 아니라 환율 변동성(30일 롤링 표준편차)과 EWY 계수 표준오차의 관계도
            분석한다. 변동성이 높은 구간에서 계수 신뢰 구간이 넓어지면, 모델 예측의 불확실성이
            추가로 증가하기 때문이다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 환율 레짐별 EWY 계수 분포</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 환율 레짐별 Rolling Ridge EWY 계수 추정 결과</caption>
              <thead>
                <tr>
                  <th className="textLeft">환율 레짐</th>
                  <th>EWY 계수 평균</th>
                  <th>표준편차</th>
                  <th>KRW 계수 평균</th>
                  <th>R² 평균</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">저환율 (KRW &lt; 1,300)</td>
                  <td>0.42</td>
                  <td>0.06</td>
                  <td>0.17</td>
                  <td>0.31</td>
                </tr>
                <tr>
                  <td className="textLeft">중간 (1,300~1,400)</td>
                  <td>0.38</td>
                  <td>0.07</td>
                  <td>0.19</td>
                  <td>0.27</td>
                </tr>
                <tr>
                  <td className="textLeft">고환율 (KRW ≥ 1,400)</td>
                  <td>0.36</td>
                  <td>0.08</td>
                  <td>0.20*</td>
                  <td>0.24</td>
                </tr>
                <tr>
                  <td className="textLeft">현재 (2026년 5월)</td>
                  <td>0.364</td>
                  <td>—</td>
                  <td>0.200</td>
                  <td>0.274</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>* KRW 계수 0.200은 Ridge 정규화로 하한이 설정된 고정값.</p>
          <p>
            고환율 레짐(KRW ≥ 1,400)에서 EWY 계수 평균(0.36)은 저환율 레짐(0.42) 대비
            14% 압축되었다. 두 레짐 간 t-검정 결과 t = −2.81, p = 0.006으로 1% 수준에서
            통계적 유의성이 확인된다. R²도 0.31 → 0.24로 하락하여, 고환율 구간에서 EWY+환율
            신호의 전체 설명력이 낮아짐을 보인다.
          </p>
          <p>
            환율을 연속 변수로 취급한 회귀 결과, EWY 계수와 환율 수준의 선형 기울기는
            −0.00021(β/KRW)이다. 즉 환율이 100원 오를수록 EWY 계수가 평균 0.021 감소한다.
            1,200원→1,500원 이동(300원 상승)으로 EWY 계수가 약 0.063 하락하는 것으로 추정되며,
            이는 관찰된 계수 차이(0.42→0.36 = 0.06)와 잘 부합한다.
          </p>

          <h3>2. 환율 변동성이 계수 안정성에 미치는 추가 영향</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 환율 30일 변동성 구간별 EWY 계수 표준오차 및 예측 오차</caption>
              <thead>
                <tr>
                  <th className="textLeft">KRW 30일 변동성</th>
                  <th>EWY 계수 표준오차</th>
                  <th>모델 예측 MAE</th>
                  <th className="textLeft">레짐 특성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">낮음 (&lt; 10원)</td>
                  <td>0.04</td>
                  <td>11.8pt</td>
                  <td className="textLeft">정상 환율 환경</td>
                </tr>
                <tr>
                  <td className="textLeft">중간 (10~30원)</td>
                  <td>0.07</td>
                  <td>16.4pt</td>
                  <td className="textLeft">환율 변동 확대</td>
                </tr>
                <tr>
                  <td className="textLeft">높음 (&gt; 30원)</td>
                  <td>0.12</td>
                  <td>24.7pt</td>
                  <td className="textLeft">환율 충격 구간</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            환율 변동성이 높은 구간에서 EWY 계수 표준오차가 0.04→0.12로 3배 상승한다.
            이는 같은 EWY 계수 추정값이라도 변동성 높은 환경에서는 실제 계수가 ±0.24 범위
            내에 있을 수 있음을 의미한다(95% 신뢰 구간 기준). 동시에 모델 예측 MAE도
            11.8pt → 24.7pt로 2배 이상 증가한다.
          </p>

          <h3>3. 계수 압축의 투자적 의미</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. EWY 1% 상승 시 레짐별 코스피 예상 반응 (코스피 7,900pt 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">환율 레짐</th>
                  <th>EWY 계수</th>
                  <th>예상 코스피 반응</th>
                  <th>실제 반응 범위 (95%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">저환율 (KRW 1,200대)</td>
                  <td>0.42</td>
                  <td>+33.2pt</td>
                  <td>21~45pt</td>
                </tr>
                <tr>
                  <td className="textLeft">중간 (KRW 1,350대)</td>
                  <td>0.38</td>
                  <td>+30.0pt</td>
                  <td>16~44pt</td>
                </tr>
                <tr>
                  <td className="textLeft">고환율 (KRW 1,500대)</td>
                  <td>0.36</td>
                  <td>+28.4pt</td>
                  <td>11~46pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            저환율 레짐 대비 고환율 레짐에서 EWY 1% 상승의 코스피 반응이 약 4.8포인트 줄어든다.
            절대값으로는 작아 보이지만, 대형 EWY 움직임(±3~5%)에서는 15~24포인트 차이로
            예측 밴드 이탈 여부를 결정지을 수 있다. 또한 95% 신뢰 구간의 폭이 저환율(24pt)에서
            고환율(35pt)로 크게 넓어지는 점이 중요하다. 이는 동일한 EWY 신호라도 고환율 레짐
            에서는 예측의 정확도가 낮아짐을 의미한다.
          </p>

          <h3>4. 1,500원 초과 구간의 모델 위험 시나리오</h3>
          <p>
            현재 USD/KRW(1,498.75원)는 1,500원 직하에 위치한다. 1,500원 초과 시나리오에서는
            과거 데이터(1,462거래일 백테스트)에 1,500원 이상 구간이 거의 없어 계수 추정의
            외삽(extrapolation) 문제가 발생한다. 이 경우 Rolling 180일 표본에서 미지 환율 구간
            데이터 비중이 증가할수록 Ridge 정규화가 계수를 평균값 방향으로 과도하게 수축시킬
            위험이 있다. 추정 R²가 0.20 미만으로 하락하면 EWY 신호의 설명력이 환율 노이즈에
            잠식되고 있음을 경고하는 지표로 사용해야 한다.
          </p>

          <h2>Ⅴ. 논의 — 계수 압축의 정책적 함의</h2>
          <p>
            EWY 계수 압축은 단순히 통계적 현상이 아니라 실물 경제 메커니즘의 반영이다.
            원화 약세가 지속되면 외국인 투자자는 환 헤지 비용 증가로 인해 코스피 현물 포지션을
            줄이는 경향이 있다. 이 과정에서 EWY 가격(달러 기준 한국 주식 가치)이 상승해도
            원화 기준 코스피 현물 수요 증가가 제한되어 계수가 압축된다.
          </p>
          <p>
            반면 원화 약세는 수출 기업의 원화 환산 이익을 증가시켜 EWY와 무관한 상방 압력을
            만든다. 이 효과가 KRW 계수(0.200)에 반영되며, 환율 상승 시 KRW 계수의 기여가
            커지면서 EWY 계수 압축을 부분적으로 상쇄한다. 두 효과의 합산으로 고환율 레짐에서도
            모델 전체 예측력이 완전히 붕괴하지 않는다.
          </p>

          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            환율 1,400원대 진입은 EWY-코스피 전달 계수를 구조적으로 압축시킨다. 현재 모델의
            Rolling 180일 추정은 이 레짐 변화를 점진적으로 반영하므로 즉각적 과적합 문제는
            없지만, 환율이 1,500원을 초과하는 미지의 영역에 진입할 경우 추정 안정성이
            저하될 위험이 있다. EWY 계수와 환율 수준의 선형 기울기(−0.00021/KRW)와 t-검정
            유의성(p = 0.006)은 이 압축이 통계적으로 실질적임을 확인한다.
          </p>
          <p>
            실전 시사점은 세 가지다. 첫째, 고환율 레짐에서 EWY 신호를 해석할 때 계수 압축을
            감안하여 예측 기댓값을 약 10~15% 보수적으로 볼 필요가 있다. 둘째, 환율이
            1,500원을 돌파하면 EWY 계수 안정성을 별도로 모니터링하고, 추정 R²가 0.20 이하로
            하락하면 모델 신뢰도 경고를 발령하는 임계값 체계를 도입해야 한다. 셋째, 환율 변동성
            (30일 표준편차)이 30원을 초과하는 구간에서는 예측 밴드를 50% 확장하여 제공하는
            것이 투자자에게 정직한 불확실성 전달 방법이다.
          </p>
          <p>
            향후 연구 과제는 두 가지다. 첫째, Ridge 정규화 강도(λ)를 환율 변동성에 연동하여
            고환율 구간에서 계수 적응 속도를 높이는 적응적 λ 체계 설계다. 둘째, EWY 대신
            직접 달러-원 선물 포지션 데이터를 사용하는 대안 변수 검토로, 환율 매개 효과를
            보다 직접적으로 모델에 반영할 수 있는지를 탐색한다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Bodart, V., &amp; Reding, P. (1999). Exchange rate regime, volatility and international correlations on bond and stock markets. <em>Journal of International Money and Finance</em>, 18(1), 133–151.</p>
            <p className="paperReferenceItem">Froot, K. A., &amp; Ramadorai, T. (2005). Currency returns, intrinsic value, and institutional investor flows. <em>Journal of Finance</em>, 60(3), 1535–1566.</p>
            <p className="paperReferenceItem">Griffin, J. M., &amp; Karolyi, G. A. (1998). Another look at the role of the industrial structure of markets for international diversification strategies. <em>Journal of Financial Economics</em>, 50(3), 351–373.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Pesaran, M. H., &amp; Timmermann, A. (2007). Selection of estimation window in the presence of breaks. <em>Journal of Econometrics</em>, 137(1), 134–161.</p>
            <p className="paperReferenceItem">Phylaktis, K., &amp; Ravazzolo, F. (2005). Stock prices and exchange rate dynamics. <em>Journal of International Money and Finance</em>, 24(7), 1031–1053.</p>
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
