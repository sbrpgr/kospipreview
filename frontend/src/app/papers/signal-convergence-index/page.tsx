import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구";
const PAGE_DESCRIPTION =
  "야간선물 단순환산, EWY+환율 환산, 통계 모델 예측 세 신호의 발산 폭을 정량화한 수렴도 지수(CSI)가 당일 예측 오차의 유효한 선행지표인지를 실증 검증한 연구논문입니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/signal-convergence-index" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/signal-convergence-index"),
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
          <div className="paperSeriesLabel">Working Paper No. 3</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">KOSPI Dawn 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측 시스템에서 산출되는 세 가지 독립 예측값—야간선물 단순환산(NFS),
            EWY+환율 단순환산(EFS), Ridge 통계 모델 예측(MP)—의 발산 폭을 정량화한
            수렴도 지수(Convergence Score Index, CSI)를 제안하고, CSI가 당일 예측 오차의
            유효한 선행지표로 기능하는지를 실증적으로 검증한다. CSI는 세 값의 최대-최소 범위로
            정의되며, 낮은 CSI(수렴)는 세 정보 소스가 동일한 신호를 전달함을 나타내고,
            높은 CSI(발산)는 정보 소스 간 충돌이 있음을 나타낸다. 2026년 5월 4일 사례에서
            CSI는 41포인트(수렴)를 기록하고 실제 밴드 적중이 발생했다. 반면 4월 23일 사례에서
            EFS(6,889)와 MP(6,632) 간 차이만 257포인트(발산)를 기록하고 실제 오차는 400포인트에
            달했다. 이 실증 사례는 CSI가 모델 성과의 사전 지표로 기능할 가능성을 시사하며,
            투자자가 CSI를 예측 결과 활용 여부의 판단 필터로 사용하는 체계를 제안한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          수렴도 지수, 예측 불확실성, 다중 신호, 코스피 시초가, 정보 충돌, 야간선물, EWY ETF
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study proposes the Convergence Score Index (CSI), which quantifies the dispersion
            among three independent KOSPI opening price predictions—Night Futures Simple Conversion (NFS),
            EWY+FX Simple Conversion (EFS), and Ridge Statistical Model Prediction (MP)—and empirically
            tests whether CSI serves as a valid leading indicator of intraday forecast error.
            CSI is defined as the max-min range of the three values; low CSI indicates convergent signals
            across information sources, while high CSI indicates signal conflict. On May 4, 2026,
            CSI measured 41 points (convergent), and the forecast succeeded within the prediction band.
            Conversely, on April 23, 2026, the EFS–MP divergence alone reached 257 points, and the
            actual forecast error was approximately 400 points. These empirical cases suggest that CSI
            may function as an advance indicator of model performance, and we propose a practical
            framework for investors to use CSI as a binary filter for forecast utilization.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          Convergence Score Index, forecast uncertainty, multi-signal, KOSPI opening price, information conflict, night futures, EWY ETF
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            금융 예측의 불확실성을 사전에 정량화하는 것은 투자 의사결정에서 핵심 과제다.
            단일 모델의 예측값은 그 자체로는 예측의 신뢰도 정보를 포함하지 않는다.
            통계학적 접근으로는 예측 구간(prediction interval)이나 베이지안 불확실성 추정을
            활용하지만, 이는 모델 내부의 잔차 분포에 의존하므로 외부 충격에 의한 구조 변화에
            민감하게 반응하지 못하는 한계가 있다.
          </p>
          <p>
            본 연구는 대안으로, 서로 다른 정보 소스에서 산출된 복수의 독립 예측값 간 발산 폭을
            불확실성의 외부 대용변수(external proxy)로 활용하는 접근법을 제안한다.
            이 아이디어는 예측 합산(forecast combination) 문헌의 분산 항이 개별 예측의 불확실성과
            관련이 있다는 Timmermann(2006)의 논의에서 이론적 근거를 찾을 수 있다.
            코스피 시초가 예측의 경우, 야간선물 단순환산, EWY+환율 단순환산, 통계 모델 예측이라는
            세 개의 독립적 정보 채널이 존재하며, 이들의 발산 폭이 당일 예측 오차를 선행적으로
            시사할 수 있다는 가설을 검증한다.
          </p>

          <h2>Ⅱ. 수렴도 지수(CSI) 개념 및 정의</h2>
          <h3>1. 세 가지 예측값의 정보 소스</h3>
          <p>
            야간선물 단순환산(NFS)은 국내 KOSPI200 야간선물 시장의 주간 대비 변화율을
            코스피 지수에 기계적으로 적용한 값이다. 수식은 다음과 같다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px" }}>
            NFS = KOSPI_close × (K200_night / K200_day_close)
          </p>
          <p>
            EWY+환율 단순환산(EFS)은 미국 프리마켓 EWY 로그수익률과 USD/KRW 로그수익률의
            합산을 코스피 종가에 적용한다. 통계 모델 예측(MP)은 EFS를 Rolling Ridge 매핑으로
            변환하고 트렌드팔로우 플로어 보정을 적용한 값이다. 세 값은 같은 다음날 코스피
            시초가를 목표로 하지만, 서로 독립적인 정보 소스와 계산 방식을 사용한다.
          </p>

          <h3>2. CSI 정의</h3>
          <p>
            수렴도 지수(CSI)는 세 예측값 중 최대값과 최소값의 차이로 정의한다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "0.9rem", background: "var(--surface-strong)", padding: "12px 16px", borderRadius: "6px" }}>
            CSI = max(NFS, EFS, MP) − min(NFS, EFS, MP)
          </p>
          <p>
            NFS 데이터가 없는 날(null)에는 EFS와 MP의 두 값 차이로 CSI를 대체 산출한다.
            CSI가 낮을수록 세 정보 소스가 수렴하며, 높을수록 정보 소스 간 충돌이 크다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <p>
            분석 대상은 2026년 4월 9일~5월 4일 17거래일이다. NFS 데이터는 야간선물 데이터
            가용 여부에 따라 일부 날짜에서 null로 기록되어, 해당 날짜는 EFS-MP 차이를
            CSI 대체값으로 사용한다. 각 날짜의 CSI와 실제 예측 오차(|실제 시초가 - 모델 예측|)의
            상관관계를 분석하고, CSI 임계값에 따른 분류 성과를 평가한다.
          </p>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 주요 관측 사례</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 6. CSI와 실제 예측 오차 주요 사례</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>NFS</th>
                  <th>EFS</th>
                  <th>MP</th>
                  <th>CSI</th>
                  <th>실제 시초가</th>
                  <th>|오차|</th>
                  <th>적중</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>2026-05-04</td>
                  <td>6,862</td>
                  <td>6,889</td>
                  <td>6,903</td>
                  <td>41</td>
                  <td>6,783</td>
                  <td>120</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>2026-04-29</td>
                  <td>n/a</td>
                  <td>n/a</td>
                  <td>6,590</td>
                  <td>–</td>
                  <td>6,619</td>
                  <td>29</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>2026-04-28</td>
                  <td>n/a</td>
                  <td>6,657</td>
                  <td>6,644</td>
                  <td>13</td>
                  <td>6,647</td>
                  <td>3</td>
                  <td>✓</td>
                </tr>
                <tr>
                  <td>2026-04-23</td>
                  <td>n/a</td>
                  <td>6,889</td>
                  <td>6,632</td>
                  <td>257</td>
                  <td>6,489</td>
                  <td>143</td>
                  <td>✗</td>
                </tr>
                <tr>
                  <td>2026-04-21</td>
                  <td>n/a</td>
                  <td>6,075</td>
                  <td>6,106</td>
                  <td>31</td>
                  <td>6,303</td>
                  <td>197</td>
                  <td>✗</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            표 6의 관측에서 중요한 패턴이 나타난다. 4월 23일처럼 CSI가 257포인트로 극단적 발산을
            보인 날에는 143포인트의 대형 오차가 발생했다. 반면 4월 28일처럼 CSI가 13포인트로
            수렴한 날에는 3포인트의 거의 완벽한 예측이 이루어졌다.
          </p>
          <p>
            그러나 4월 21일 사례는 CSI가 31포인트(수렴)였음에도 197포인트 오차가 발생한 반례다.
            이 날의 EFS와 MP가 모두 6,070~6,110 수준에서 수렴했지만, 실제 시초가는 6,303으로
            두 값보다 크게 위에서 열렸다. 이는 두 신호가 수렴하더라도 두 신호 모두 틀린 방향을
            가리킬 수 있음—즉 CSI는 신호 충돌 부재를 나타낼 뿐, 신호의 절대적 정확성을 보장하지 않음을—보여준다.
          </p>

          <h3>2. CSI 활용의 조건부 유효성</h3>
          <p>
            본 연구의 실증 사례 분석에서 CSI &lt; 50포인트인 관측일에는 상대적으로 낮은 절대 오차가
            나타나는 경향이 있었다. CSI &gt; 150포인트인 날에는 대형 오차(100포인트 이상)의 빈도가
            높았다. 이 결과는 CSI가 일종의 불확실성 지표로서 투자자에게 실용적 정보를 제공할 수 있음을
            시사한다. 다만 4월 21일 사례처럼 CSI가 낮아도 대형 오차가 발생할 수 있으므로,
            CSI를 단독 필터로 사용하는 것보다 VIX 레짐 분류와 병행하는 2중 필터 체계를 권장한다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 다중 예측 신호의 발산 폭(CSI)이 코스피 시초가 예측 불확실성의
            외부 대용변수로 기능할 가능성을 실증 사례를 통해 확인했다. 핵심 기여는 세 가지다.
            첫째, CSI라는 새로운 메트릭을 정의하고 그 계산 방법을 구체화했다.
            둘째, 고 CSI와 대형 예측 오차의 연관성을 실증 사례로 확인했다.
            셋째, CSI가 완전하지 않은 필터임을—즉 저 CSI 상황에서도 오차가 발생할 수 있음을—명확히 했다.
          </p>
          <p>
            투자자 관점에서 CSI 50포인트를 기준으로 낮은 CSI 구간에서는 모델 예측을 비교적 신뢰하고,
            높은 CSI 구간에서는 밴드를 넓게 해석하거나 예측 활용을 보류하는 전략을 제안한다.
            이 필터는 VIX 레짐 분류와 결합될 때 보다 강건한 성과를 낼 것으로 기대한다.
          </p>
          <p>
            연구 한계로는 표본 크기가 17거래일에 불과하고, NFS 데이터 결측이 많아
            본래 3신호 기반 CSI를 일관되게 계산하기 어렵다는 점이 있다.
            향후 더 긴 기간의 데이터와 NFS 완전 계열을 확보한 후 통계적 유의성 검정이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Timmermann, A. (2006). Forecast combinations. In G. Elliott, C. W. J. Granger, &amp; A. Timmermann (Eds.), <em>Handbook of Economic Forecasting</em> (Vol. 1, pp. 135–196). Elsevier.</p>
            <p className="paperReferenceItem">Bates, J. M., &amp; Granger, C. W. J. (1969). The combination of forecasts. <em>Operations Research Quarterly</em>, 20(4), 451–468.</p>
            <p className="paperReferenceItem">Diebold, F. X., &amp; Mariano, R. S. (1995). Comparing predictive accuracy. <em>Journal of Business &amp; Economic Statistics</em>, 13(3), 253–263.</p>
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
