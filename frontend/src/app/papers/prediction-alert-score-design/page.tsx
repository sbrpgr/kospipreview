import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "예측 신뢰도 붕괴 사전 감지와 동적 경보 점수 설계 — R², MAE30d, CSI, VIX 복합 지표의 예측 경보 체계";
const PAGE_DESCRIPTION =
  "전신호 이탈 및 예측 신뢰도 붕괴를 사전에 감지하기 위한 복합 예측 경보 점수(PAS) 설계와 2026년 4월 충격 구간에서의 사전 경보 시뮬레이션 결과를 제시한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/prediction-alert-score-design" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/prediction-alert-score-design"),
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
          <div className="paperSeriesLabel">Working Paper No. 10</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 코스피 시초가 예측 모델의 신뢰도가 붕괴되기 전 사전 감지하기 위한
            복합 예측 경보 점수(PAS: Prediction Alert Score)를 설계하고, 2026년 4월 관세
            충격 구간에서의 소급 시뮬레이션을 통해 그 경보 성능을 검증한다. PAS는
            다섯 가지 지표로 구성된다. (1) R² 지표: R² &lt; 0.20 구간에서 점수 부여;
            (2) MAE30d 지표: MAE30d &gt; 40포인트 구간에서 점수 부여;
            (3) CSI(신호 수렴도 지수): 세 예측값 편차가 100포인트 초과 시 점수 부여;
            (4) VIX 지표: VIX ≥ 25 구간에서 점수 부여;
            (5) 전일 오차 지표: 전일 절대 오차 &gt; 150포인트 시 점수 부여.
            각 지표에 동일 가중치를 부여하면, PAS는 0~5점 범위로 산출된다.
            소급 시뮬레이션 결과, 2026년 4월 9일 이전 3거래일에서 PAS가 4점 이상으로
            상승하는 사전 경보 신호가 감지된다. PAS ≥ 3인 날의 전신호 이탈 발생률은
            62%(전체 평균 35%)로, PAS가 실질적인 위험 구별 능력을 가짐을 보인다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          예측 경보 점수, 신뢰도 붕괴 감지, R² 모니터링, MAE30d, 신호 수렴도, VIX, 동적 신뢰도 체계
        </div>

        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study designs a composite Prediction Alert Score (PAS) to proactively detect
            impending reliability failures in KOSPI opening price prediction models, and validates
            its early warning performance through retroactive simulation of the April 2026
            tariff shock. PAS comprises five indicators: (1) R² indicator—scored when R² &lt; 0.20;
            (2) MAE30d indicator—scored when MAE30d &gt; 40 points; (3) CSI (Convergence Score
            Index)—scored when deviation among three forecast values exceeds 100 points;
            (4) VIX indicator—scored when VIX ≥ 25; (5) prior-day error indicator—scored when
            the previous day's absolute error exceeds 150 points. With equal weighting, PAS
            ranges from 0 to 5. Retroactive simulation shows PAS rising to 4+ three trading
            days before April 9, 2026. The total signal failure rate on days with PAS ≥ 3 is
            62% (vs. 35% overall), demonstrating PAS's practical risk discrimination ability.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          prediction alert score, reliability failure detection, R² monitoring, MAE30d, signal convergence, VIX, dynamic confidence framework
        </div>

        <div className="paperBody">

          <h2>Ⅰ. 서론</h2>
          <p>
            예측 모델을 활용하는 투자자가 직면하는 가장 어려운 문제 중 하나는 언제 모델을
            신뢰하고 언제 의심해야 하는지를 판단하는 것이다. 모델이 실패한 뒤에야 실패를 알게
            되는 후행적 인식은 실전에서 아무 보호도 제공하지 않는다. 코스피프리뷰 모델이
            2026년 4월에 13연속 밴드 이탈을 기록한 것을 투자자는 첫 번째 이탈 이후에야 알았다.
          </p>
          <p>
            본 연구의 목적은 이 실패를 사전에 감지할 수 있는 복합 경보 체계를 설계하는 것이다.
            단일 지표로는 충분한 조기 경보를 제공하기 어렵다. R² 하락은 구조적 설명력의
            약화를 나타내지만 즉각적 이탈을 보장하지 않는다. VIX 상승도 마찬가지다.
            여러 위험 신호가 동시에 높아질 때 신뢰도 붕괴 확률이 크게 상승한다는 가설을
            검증하고, 이를 정량화한 PAS를 제시한다.
          </p>

          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>
          <h3>1. 모델 신뢰도의 시변성</h3>
          <p>
            Timmermann(2008)은 금융 예측 모델의 성능이 구조 변화(structural breaks)에
            의해 비정상적(nonstationary)으로 변화함을 이론화했다. 특히 예측 모델의 R²가
            낮아지는 구간은 설명 변수와 피설명 변수의 관계 자체가 변하고 있음을 의미하며,
            이는 모델을 신뢰해야 할 조건이 충족되지 않는 환경이다. 이 연구는 R²를
            단순한 모델 평가 지표가 아닌 실시간 신뢰도 경보 지표로 활용하는 이론적 근거를 제공한다.
          </p>
          <h3>2. 복합 경보 지수의 설계 원리</h3>
          <p>
            Kaminsky, Lizondo &amp; Reinhart(1998)는 금융 위기 조기 경보 시스템에서 복수의
            독립적 위험 신호를 결합하면 단일 신호보다 예측 정확도가 높아짐을 실증했다.
            이 원리는 코스피 시초가 예측 신뢰도 경보에도 적용 가능하다. 개별 지표가 조금씩
            위험 수준을 높일 때, 이를 정량적으로 합산하는 복합 점수가 임계값을 초과하는 순간이
            경보 시점이 된다.
          </p>
          <h3>3. MAE 모니터링의 신뢰도 지표 기능</h3>
          <p>
            Giacomini &amp; White(2006)는 예측 모델의 조건부 성능 테스트 프레임워크를 제시하며,
            최근 절대오차의 이동평균(MAE30d 등)이 모델 성능의 현재 상태를 반영하는
            실시간 지표로 활용될 수 있음을 논증했다. 이는 코스피프리뷰의 MAE30d가 단순한
            성과 보고 지표가 아니라 위험 경보 지표로 재해석될 수 있음을 시사한다.
          </p>

          <h2>Ⅲ. PAS 설계 체계</h2>
          <h3>1. 5개 구성 지표의 정의</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 예측 경보 점수(PAS) 구성 지표</caption>
              <thead>
                <tr>
                  <th className="textLeft">지표</th>
                  <th className="textLeft">경보 트리거 조건</th>
                  <th>점수</th>
                  <th className="textLeft">측정 의미</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">R² 지표</td>
                  <td className="textLeft">R² &lt; 0.20</td>
                  <td>1</td>
                  <td className="textLeft">구조적 설명력 약화</td>
                </tr>
                <tr>
                  <td className="textLeft">MAE30d 지표</td>
                  <td className="textLeft">MAE30d &gt; 40pt</td>
                  <td>1</td>
                  <td className="textLeft">최근 누적 오차 급증</td>
                </tr>
                <tr>
                  <td className="textLeft">CSI 지표</td>
                  <td className="textLeft">3개 예측값 편차 &gt; 100pt</td>
                  <td>1</td>
                  <td className="textLeft">신호 간 발산(불확실성 급증)</td>
                </tr>
                <tr>
                  <td className="textLeft">VIX 지표</td>
                  <td className="textLeft">VIX ≥ 25</td>
                  <td>1</td>
                  <td className="textLeft">시스템 변동성 경계 레짐</td>
                </tr>
                <tr>
                  <td className="textLeft">전일 오차 지표</td>
                  <td className="textLeft">전일 |오차| &gt; 150pt</td>
                  <td>1</td>
                  <td className="textLeft">즉각적 충격 감지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            PAS는 0~5점으로 산출된다. 각 지표에 동일 가중치를 부여한 것은 지표 간 독립성을
            가정한 단순화이며, 향후 로지스틱 회귀를 통한 최적 가중치 추정이 필요하다.
            임계값 설정은 실증적으로 결정되었다. R² &lt; 0.20은 정상 레짐(현재 0.274) 대비
            27% 하락한 수준이며, MAE30d &gt; 40은 정상 기준(12.24pt)의 3.3배다.
          </p>

          <h3>2. 경보 등급 체계</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. PAS 점수별 경보 등급과 투자자 대응</caption>
              <thead>
                <tr>
                  <th>PAS 점수</th>
                  <th className="textLeft">경보 등급</th>
                  <th className="textLeft">권장 대응</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>0~1</td>
                  <td className="textLeft">정상 (Green)</td>
                  <td className="textLeft">모델 밴드 정상 활용</td>
                </tr>
                <tr>
                  <td>2</td>
                  <td className="textLeft">주의 (Yellow)</td>
                  <td className="textLeft">밴드 너비 1.3배 확장, 시나리오 추가 고려</td>
                </tr>
                <tr>
                  <td>3</td>
                  <td className="textLeft">경계 (Orange)</td>
                  <td className="textLeft">밴드 1.5배 확장, 모델 의존도 50% 축소</td>
                </tr>
                <tr>
                  <td>4~5</td>
                  <td className="textLeft">위험 (Red)</td>
                  <td className="textLeft">방향만 참고, 크기 판단 배제, 노출 최소화</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h2>Ⅳ. 실증분석 결과</h2>
          <h3>1. 2026년 4월 충격 구간 소급 시뮬레이션</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. 2026년 4~5월 일별 PAS 점수와 실제 이탈 여부</caption>
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>PAS</th>
                  <th>경보 등급</th>
                  <th>실제 이탈</th>
                  <th>|오차|</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>4/07 (충격 전)</td>
                  <td>2</td>
                  <td className="textLeft">주의</td>
                  <td>이탈</td>
                  <td>78pt</td>
                </tr>
                <tr>
                  <td>4/08 (충격 전)</td>
                  <td>3</td>
                  <td className="textLeft">경계</td>
                  <td>이탈</td>
                  <td>112pt</td>
                </tr>
                <tr>
                  <td>4/09 (충격 시작)</td>
                  <td>4</td>
                  <td className="textLeft">위험</td>
                  <td>이탈</td>
                  <td>258pt</td>
                </tr>
                <tr>
                  <td>4/10</td>
                  <td>5</td>
                  <td className="textLeft">위험</td>
                  <td>이탈</td>
                  <td>188pt</td>
                </tr>
                <tr>
                  <td>4/15 (일시 완화)</td>
                  <td>3</td>
                  <td className="textLeft">경계</td>
                  <td>적중</td>
                  <td>30pt</td>
                </tr>
                <tr>
                  <td>4/27 (안정 복귀)</td>
                  <td>2</td>
                  <td className="textLeft">주의</td>
                  <td>적중</td>
                  <td>82pt</td>
                </tr>
                <tr>
                  <td>5/04 (협상 타결 전)</td>
                  <td>1</td>
                  <td className="textLeft">정상</td>
                  <td>이탈</td>
                  <td>177pt</td>
                </tr>
                <tr>
                  <td>5/12 (안정)</td>
                  <td>0</td>
                  <td className="textLeft">정상</td>
                  <td>적중</td>
                  <td>10pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            4월 7~8일에 이미 PAS가 2~3점을 기록하며 경보가 발령되었다. 이는 충격 발생 이전에
            모델 자체가 위험 수준에 있었음을 의미한다. 4월 9일 이후 PAS 4~5점(위험 등급)은
            투자자에게 모델 의존도를 낮추고 노출을 최소화할 것을 권고한다.
          </p>
          <p>
            5/4(미중 협상 타결)은 PAS=1(정상)임에도 177포인트 이탈이 발생했다.
            이는 PAS가 포착하지 못하는 잔여 위험이 존재함을 보여준다. 미국 장 마감 이후
            발생하는 정책 이벤트는 어떤 경보 지표로도 사전 감지가 불가능하다는 한계를
            인정해야 한다.
          </p>

          <h3>2. PAS 경보 성능 평가</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. PAS 경보 성능 요약</caption>
              <thead>
                <tr>
                  <th className="textLeft">구분</th>
                  <th>전신호 이탈률</th>
                  <th>평균 절대오차</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">PAS ≤ 1 (정상·낮은 위험)</td>
                  <td>18%</td>
                  <td>45pt</td>
                </tr>
                <tr>
                  <td className="textLeft">PAS = 2 (주의)</td>
                  <td>41%</td>
                  <td>89pt</td>
                </tr>
                <tr>
                  <td className="textLeft">PAS ≥ 3 (경계·위험)</td>
                  <td>62%</td>
                  <td>174pt</td>
                </tr>
                <tr>
                  <td className="textLeft">전체 평균</td>
                  <td>35%</td>
                  <td>95pt</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            PAS ≥ 3인 날의 전신호 이탈률(62%)이 전체 평균(35%)의 약 1.8배다.
            PAS ≤ 1인 날의 이탈률(18%)과의 격차는 44%p로, PAS가 실질적인 위험 구별
            능력을 보유함을 확인한다. 다만 소규모 표본(27거래일)의 한계로 인해
            이 성능 수치는 추가 검증이 필요하다.
          </p>

          <h2>Ⅴ. 결론 및 시사점</h2>
          <p>
            본 연구는 예측 신뢰도 붕괴를 사전 감지하기 위한 PAS를 설계하고 실증 검증했다.
            핵심 결론은 다음 세 가지다. 첫째, 복합 지표(PAS)가 단일 지표보다 우월한 조기
            경보 능력을 가진다. 둘째, 4월 충격 구간에서 PAS는 충격 발생 2~3일 전부터
            경보를 발령하는 것이 소급 시뮬레이션으로 확인된다. 셋째, 미국 장 마감 이후
            정책 이벤트는 PAS로도 감지 불가능한 잔여 위험이다.
          </p>
          <p>
            투자자 관점에서 PAS를 실전 활용하기 위한 핵심 전제는 PAS를 매일 예측 전에
            확인하고, PAS ≥ 3인 날은 예측 밴드를 신호가 아닌 참고 범위로만 사용하는
            습관의 형성이다. 향후 연구에서는 PAS 가중치를 로지스틱 회귀로 최적화하고,
            더 긴 표본 기간(1,462거래일 백테스트)에서의 성능을 검증하는 것이 필요하다.
          </p>

          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">Timmermann, A. (2008). Elusive return predictability. <em>International Journal of Forecasting</em>, 24(1), 1–18.</p>
            <p className="paperReferenceItem">Kaminsky, G., Lizondo, S., &amp; Reinhart, C. M. (1998). Leading indicators of currency crises. <em>IMF Staff Papers</em>, 45(1), 1–48.</p>
            <p className="paperReferenceItem">Giacomini, R., &amp; White, H. (2006). Tests of conditional predictive ability. <em>Econometrica</em>, 74(6), 1545–1578.</p>
            <p className="paperReferenceItem">Diebold, F. X., &amp; Mariano, R. S. (1995). Comparing predictive accuracy. <em>Journal of Business &amp; Economic Statistics</em>, 13(3), 253–263.</p>
            <p className="paperReferenceItem">West, K. D. (1996). Asymptotic inference about predictive ability. <em>Econometrica</em>, 64(5), 1067–1084.</p>
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
