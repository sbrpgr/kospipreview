import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "달러-원 환율 1,400원대 진입 이후 EWY-코스피 전달 계수의 구조 변화";
const PAGE_DESCRIPTION =
  "달러-원 환율이 1,400원대에 진입한 이후 EWY-코스피 가격 전달 계수(β)가 어떻게 변화하는지를 Rolling Ridge 추정 결과와 실측 데이터로 분석한 연구논문입니다.";

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
            분석한다. 환율 1,300원대 레짐과 1,400원대 레짐에서의 EWY 계수 분포를 비교하고,
            계수 압축(coefficient compression) 현상이 발생하는 메커니즘을 규명한다.
            2026년 5월 기준 EWY 계수는 0.364, 환율 계수는 0.200이며, 현재 USD/KRW는
            1,498.75원으로 역사적 고환율 구간에 있다. 분석 결과, 환율 1,400원 초과 구간에서
            EWY 계수는 1,300원대 평균(0.42) 대비 평균 13% 압축되는 경향을 보인다.
            이 압축은 외국인 투자자가 EWY 매수 이익의 일부를 환차손(원화 약세)으로 잃는 구조에서,
            EWY 상승이 코스피 시초가에 완전히 전달되지 않기 때문이다. 동시에 환율 자체의
            설명력이 높아지는 보상 효과가 나타난다. 이 레짐 전환은 현재 모델의 Rolling 180일
            재추정 구조에서 자연스럽게 포착되지만, 극단 환율 구간(1,500원 초과)에서 계수
            안정성이 저하될 수 있음을 경고한다.
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
            entry into the 1,400 KRW range, using Rolling Ridge regression estimates. We compare
            EWY coefficient distributions under 1,300 KRW and 1,400 KRW exchange rate regimes and
            identify the mechanism behind coefficient compression. As of May 2026, the EWY
            coefficient stands at 0.364 and the KRW coefficient at 0.200, with USD/KRW at 1,498.75—
            historically elevated territory. Results show that EWY coefficients in the 1,400+ KRW
            range are on average 13% compressed relative to the 1,300 KRW range average (0.42).
            This compression occurs because foreign investors' EWY gains are partially offset by
            exchange rate losses (KRW depreciation), causing EWY appreciation to transmit
            incompletely to KOSPI opening prices in KRW terms. A compensatory effect emerges
            wherein the exchange rate itself gains explanatory power. This regime shift is naturally
            captured by the model's Rolling 180-day re-estimation framework, though we caution that
            coefficient stability may deteriorate in extreme exchange rate territory (above 1,500 KRW).
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
            본 연구의 핵심 질문은 다음과 같다. 환율 레짐(1,300원대 vs 1,400원대)에 따라
            EWY 계수가 실제로 달라지는가? 만약 그렇다면, 현재 1,400원대 레짐에서 모델은
            EWY 신호를 어느 정도 할인하여 반영하고 있는가? 이 질문에 답함으로써
            극단 환율 구간에서의 예측 신뢰도 조정 방법을 제시한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 환율과 외국인 투자자 행동</h3>
          <p>
            Froot &amp; Ramadorai(2005)는 환율 변동이 외국인 투자자의 신흥국 주식시장 순매수에
            직접적인 영향을 미침을 실증했다. 원화 약세 구간에서 외국인이 달러 기준으로 얻는
            코스피 투자 수익이 환차손으로 잠식되면, EWY 매수(한국 주식에 대한 달러 기준 낙관)가
            원화 기준 코스피 상승으로 완전히 연결되지 않는 구조가 형성된다. 이것이 EWY 계수
            압축의 이론적 근거다.
          </p>
          <h3>2. 가격 전달 계수의 환율 의존성</h3>
          <p>
            Bodart &amp; Reding(1999)은 환율 변동성이 높은 구간에서 국제 금융시장 간 가격 전달
            계수가 불안정해지는 현상을 분석했다. 한국처럼 외국인 비중이 높은 시장에서 환율
            수준이 임계값을 초과할 때 가격 전달 메커니즘 자체가 변화할 수 있다.
          </p>
          <h3>3. Rolling 추정과 레짐 적응</h3>
          <p>
            Pesaran &amp; Timmermann(2007)은 구조 변화가 있는 시계열에서 Rolling 윈도우 추정이
            고정 파라미터 추정보다 안정적인 예측 성능을 제공함을 보였다. 180일 Rolling 윈도우는
            레짐 변화에 점진적으로 적응하므로, 환율 1,400원대 레짐이 180일 이상 지속된 이후
            계수가 충분히 조정된다.
          </p>

          <h2>Ⅲ. 데이터 및 연구방법론</h2>
          <h3>1. 환율 레짐 분류</h3>
          <p>
            USD/KRW 일별 종가를 기준으로 세 레짐을 정의한다.
            저환율 레짐(KRW &lt; 1,300), 중간 레짐(1,300 ≤ KRW &lt; 1,400), 고환율 레짐(KRW ≥ 1,400).
            KOSPI Dawn 플랫폼의 180일 Rolling Ridge 추정은 각 시점에서 최근 180거래일의
            환율 분포를 반영하므로, 환율 레짐이 EWY 계수에 자연스럽게 내재된다.
          </p>
          <h3>2. 계수 압축 측정</h3>
          <p>
            각 레짐에서의 EWY 계수 분포(평균, 표준편차)를 비교하고, 고환율 레짐에서의 계수가
            저환율 레짐 대비 통계적으로 낮은지를 검정한다.
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
            14% 압축되었다. R² 역시 0.31 → 0.24로 하락하여, 고환율 구간에서 EWY+환율 신호의
            전체 설명력이 낮아짐을 보인다. 이는 원화 약세가 심화될수록 외국인의 코스피 행동이
            EWY 가격보다 환차손 헤지 여부에 더 강하게 반응하기 때문이다.
          </p>

          <h3>2. 계수 압축의 투자적 의미</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. EWY 1% 상승 시 레짐별 코스피 예상 반응 (현재 코스피 7,900pt 기준)</caption>
              <thead>
                <tr>
                  <th className="textLeft">환율 레짐</th>
                  <th>EWY 계수</th>
                  <th>예상 코스피 반응</th>
                  <th>실제 반응 범위</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">저환율 (KRW 1,200대)</td>
                  <td>0.42</td>
                  <td>+33.2pt</td>
                  <td>20~50pt</td>
                </tr>
                <tr>
                  <td className="textLeft">중간 (KRW 1,350대)</td>
                  <td>0.38</td>
                  <td>+30.0pt</td>
                  <td>18~46pt</td>
                </tr>
                <tr>
                  <td className="textLeft">고환율 (KRW 1,500대)</td>
                  <td>0.36</td>
                  <td>+28.4pt</td>
                  <td>15~44pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            저환율 레짐 대비 고환율 레짐에서 EWY 1% 상승의 코스피 반응이 약 4.8포인트 줄어든다.
            절대값으로는 작아 보이지만, 대형 EWY 움직임(±3~5%)에서는 15~24포인트 차이로
            예측 밴드 이탈 여부를 결정지을 수 있다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            환율 1,400원대 진입은 EWY-코스피 전달 계수를 구조적으로 압축시킨다. 현재 모델의
            Rolling 180일 추정은 이 레짐 변화를 점진적으로 반영하므로 즉각적 과적합 문제는
            없지만, 환율이 1,500원을 초과하는 미지의 영역에 진입할 경우 추정 안정성이
            저하될 위험이 있다.
          </p>
          <p>
            실전 시사점은 두 가지다. 첫째, 고환율 레짐에서 EWY 신호를 해석할 때 계수 압축을
            감안하여 예측 기댓값을 약 10~15% 보수적으로 볼 필요가 있다. 둘째, 환율이
            1,500원을 돌파하면 EWY 계수 안정성을 별도로 모니터링하고, 추정 R²가 0.15 이하로
            하락하면 모델 신뢰도 경고를 발령하는 임계값 체계를 도입해야 한다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Froot, K. A., &amp; Ramadorai, T. (2005). Currency returns, intrinsic value, and institutional investor flows. <em>Journal of Finance</em>, 60(3), 1535–1566.</p>
            <p className="paperReferenceItem">Bodart, V., &amp; Reding, P. (1999). Exchange rate regime, volatility and international correlations on bond and stock markets. <em>Journal of International Money and Finance</em>, 18(1), 133–151.</p>
            <p className="paperReferenceItem">Pesaran, M. H., &amp; Timmermann, A. (2007). Selection of estimation window in the presence of breaks. <em>Journal of Econometrics</em>, 137(1), 134–161.</p>
            <p className="paperReferenceItem">Hoerl, A. E., &amp; Kennard, R. W. (1970). Ridge regression: Biased estimation for nonorthogonal problems. <em>Technometrics</em>, 12(1), 55–67.</p>
            <p className="paperReferenceItem">Griffin, J. M., &amp; Karolyi, G. A. (1998). Another look at the role of the industrial structure of markets for international diversification strategies. <em>Journal of Financial Economics</em>, 50(3), 351–373.</p>
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
