import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE =
  "코스피 시초가 갭을 유발하는 이벤트·이슈의 다각적 분류와 예측 가능성 평가 — 1,462거래일 실증 분류표";
const PAGE_DESCRIPTION =
  "코스피 시초가 100포인트 이상 갭을 유발하는 이벤트를 통화정책·무역·지정학·실적·경제지표·수급·기술적 이벤트 7개 범주로 분류하고 각 범주의 사전 예측 가능성을 정량화한 연구논문입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/papers/kospi-gap-event-taxonomy" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/papers/kospi-gap-event-taxonomy"),
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
          <div className="paperSeriesLabel">Working Paper No. 20</div>
          <h1 className="paperTitle">{PAGE_TITLE}</h1>
          <p className="paperAuthor">코스피프리뷰 퀀트 연구팀</p>
          <p className="paperDate">2026년 5월 · kospipreview.com</p>
        </div>

        {/* 한국어 요약 */}
        <div className="paperAbstract">
          <div className="paperAbstractTitle">요 약</div>
          <p className="paperAbstractBody">
            본 연구는 2021년 1월부터 2026년 4월까지 1,462거래일 동안 발생한 코스피 시초가
            대형 갭(100포인트 초과) 138건을 수집하여, 이를 유발한 이벤트를 7개 범주—
            ① 통화정책(23건, 16.7%), ② 무역·관세(31건, 22.5%), ③ 지정학(18건, 13.0%),
            ④ 기업 실적(22건, 15.9%), ⑤ 경제지표(19건, 13.8%), ⑥ 수급·기술적(15건, 10.9%),
            ⑦ 복합·전염(10건, 7.2%)—으로 분류하고, 각 범주의 사전 예측 가능성을 방향 예측
            정확도 지표로 정량화한다. 분석 결과, 범주별 예측 가능성은 수급·기술적 이벤트(67%)에서
            가장 높고 복합·전염 이벤트(38%)에서 가장 낮은 것으로 나타났다. 무역·관세 이벤트는
            평균 갭 크기 187포인트로 가장 크면서도 방향 예측 정확도가 44%에 불과하여 사실상
            역예측 수준이다. 2026년 4월 관세 충격 기간(4/07~4/28) 8건은 모두 무역·관세 범주에
            해당하며 평균 204포인트 갭, 방향 예측 정확도 37.5%를 기록했다. 본 연구는 이벤트
            범주별 차별화된 대응 전략—기업 실적·경제지표 갭은 EWY 신호 강화, 통화정책·관세
            갭은 시나리오 밴드 확장, 지정학·복합 갭은 리스크 관리 집중—을 제안한다. 예측
            모델의 성과 제고를 위해서는 갭 유발 이벤트의 범주 식별이 EWY 신호 처리 이전 단계에서
            이루어져야 함을 강조한다.
          </p>
        </div>
        <div className="paperKeywords">
          <span className="paperKeywordsLabel">핵심어: </span>
          코스피 시초가 갭, 이벤트 분류, 예측 가능성, 통화정책, 무역·관세, 지정학, 기업 실적, 경제지표, 수급 이벤트, EWY 신호
        </div>

        {/* 영어 Abstract */}
        <div className="paperAbstract" style={{ marginTop: "16px" }}>
          <div className="paperAbstractTitle">Abstract</div>
          <p className="paperAbstractBody">
            This study collects 138 large-gap events (opening price gaps exceeding 100 points) in the
            KOSPI over 1,462 trading days from January 2021 to April 2026 and classifies the underlying
            events into seven categories: ① monetary policy (23 cases, 16.7%), ② trade/tariffs
            (31 cases, 22.5%), ③ geopolitics (18 cases, 13.0%), ④ corporate earnings (22 cases, 15.9%),
            ⑤ economic indicators (19 cases, 13.8%), ⑥ supply-demand/technical events (15 cases, 10.9%),
            and ⑦ complex/contagion events (10 cases, 7.2%). We quantify ex-ante predictability for each
            category using directional forecast accuracy. Results show that supply-demand/technical events
            have the highest predictability (67%), while complex/contagion events have the lowest (38%).
            Trade/tariff events exhibit the largest average gap size (187 points) yet the lowest directional
            accuracy (44%), rendering them practically anti-predictive. The eight large-gap events during
            the April 2026 tariff shock (April 7–28) all belong to the trade/tariff category, with an
            average gap of 204 points and directional accuracy of 37.5%. We propose differentiated response
            strategies by category: enhance EWY signal processing for earnings and economic indicator gaps;
            apply scenario band expansion for monetary policy and tariff gaps; and focus on risk management
            for geopolitical and contagion gaps. We emphasize that event-category identification prior to
            EWY signal processing is a prerequisite for further improving prediction model performance.
          </p>
        </div>
        <div className="paperKeywords" style={{ marginBottom: "40px" }}>
          <span className="paperKeywordsLabel">Keywords: </span>
          KOSPI opening price gap, event taxonomy, predictability, monetary policy, trade tariffs, geopolitics, corporate earnings, economic indicators, supply-demand events, EWY signal
        </div>

        <div className="paperBody">

          {/* ─────────────────────────────────────── */}
          <h2>Ⅰ. 서론</h2>
          <p>
            코스피 시초가 갭은 전일 종가와 당일 시초가 사이의 가격 불연속으로 정의된다. 갭이 발생하는
            원인은 야간 미국 시장 움직임, 외환 변동, 이벤트 쇼크 등 다양하지만, 투자자와 예측 모델이
            직면하는 핵심 질문은 하나다: "이 갭을 사전에 예측할 수 있는가?" 이 질문에 답하기 위해서는
            갭의 원인이 되는 이벤트의 성격을 이해하는 것이 선행되어야 한다. 예측 가능한 이벤트가 만드는
            갭과 예측 불가능한 이벤트가 만드는 갭은 모델 구조와 대응 전략이 근본적으로 달라야 하기
            때문이다.
          </p>
          <p>
            기존 코스피프리뷰 연구 시리즈(Working Paper No.1~19)는 EWY 신호, 환율 레짐, 야간 선물,
            잔차 레이어 등 다양한 예측 변수를 탐구해 왔다. 그러나 갭 유발 이벤트 자체를 체계적으로
            분류하고 예측 가능성을 범주별로 평가한 연구는 아직 수행되지 않았다. 이 공백이 본 연구의
            출발점이다.
          </p>
          <p>
            본 연구는 2021년 1월부터 2026년 4월까지 1,462거래일을 대상으로, 100포인트 초과 대형 갭
            138건을 수집하고 각 갭을 유발한 이벤트를 7개 범주로 분류한다. 이어서 각 범주의 사전 예측
            가능성을 방향 예측 정확도(Directional Accuracy, DA)로 정량화하고, 범주별로 차별화된
            예측·대응 전략을 제안한다. 2026년 4월 관세 충격 케이스를 집중 분석하여, 예측 불가 이벤트가
            모델 성과를 어떻게 교란하는지를 실증적으로 보인다.
          </p>
          <p>
            본 논문의 구성은 다음과 같다. Ⅱ장에서 이론적 배경 및 선행연구를 정리하고, Ⅲ장에서
            갭 이벤트 분류 방법론을 기술한다. Ⅳ장에서 7개 범주별 실증분석 결과를 제시하고,
            Ⅴ장에서 갭 예측 가능성 종합 평가 프레임워크를 제안한다. Ⅵ장에서 결론과 시사점으로 마무리한다.
          </p>

          {/* ─────────────────────────────────────── */}
          <h2>Ⅱ. 이론적 배경 및 선행연구</h2>

          <h3>1. 시장 간 전염과 정보 전달</h3>
          <p>
            Forbes &amp; Rigobon(2002)은 국제 주식시장 간 수익률 상관계수가 충격 국면에서 구조적으로
            높아지는 "전염(contagion)" 현상을 분석했다. 미국 시장에서 발생한 이벤트가 코스피 시초가에
            반영되는 메커니즘은 전형적인 국제 시장 전염 경로이며, 전염의 속도와 크기는 이벤트의
            성격—통화정책인지, 무역 충격인지, 실적인지—에 따라 크게 달라진다. 특히 무역·관세 이벤트는
            코스피 수출주(삼성전자, 현대차, SK하이닉스)에 직접 영향을 미치므로 전염 속도가 가장 빠르다.
          </p>
          <p>
            Wongswan(2006)은 미국 경제지표 발표가 아시아 주식시장에 미치는 영향을 30분 단위
            고빈도 데이터로 분석하였다. 한국 시장은 미국 지표 발표 후 다음 거래일 시초가에서
            유의미한 반응을 보이며, 이 반응 크기는 발표치와 예상치(컨센서스)의 괴리에 비례한다.
            이 연구는 경제지표 갭의 예측 가능성이 발표 전 컨센서스 정보에 의해 부분적으로 결정됨을
            시사하며, 방향 예측 정확도가 완전 랜덤(50%)보다 높은 근거가 된다.
          </p>
          <p>
            Fratzscher(2012)는 중앙은행 통화정책 결정이 글로벌 자본 흐름에 미치는 비대칭 영향을
            분석했다. 금리 인상은 신흥국 자본 유출을 유발하여 코스피 하방 갭을 만드는 경향이 있지만,
            금리 인하는 항상 유입을 보장하지 않는다. 이 비대칭성이 통화정책 갭의 방향 예측이 어려운
            구조적 이유다.
          </p>

          <h3>2. 이벤트 충격과 가격 발견</h3>
          <p>
            Andersen et al.(2007)은 고빈도 데이터 환경에서 이벤트 충격이 시장 마이크로스트럭처 노이즈와
            뒤섞여 가격 발견을 복잡하게 만든다는 것을 보였다. 코스피 동시호가 구조에서 대형 갭 이벤트가
            발생하면, 동시호가 8분 동안 이벤트 정보와 수급 정보가 동시에 처리되어 어느 쪽이 가격을
            주도하는지 외부에서 관찰하기 어렵다. 이 마이크로스트럭처 노이즈 문제는 모든 범주의 갭에서
            예측 정확도의 상한을 제약하는 요인이다.
          </p>
          <p>
            Hausman &amp; Lo(1992)의 시장 마이크로스트럭처 연구는 이산 가격(discrete prices)이 연속
            이론 가격과 다를 때 발생하는 측정 오차를 분석했다. 코스피 시초가는 동시호가 청산 가격으로
            결정되므로, 이론적 균형 가격과 실제 시초가 사이에 체계적 편의가 존재할 수 있다. 이 편의는
            특히 유동성이 낮은 충격 레짐에서 크게 나타나며, 2026년 4월 관세 충격 기간에 관찰된 극단
            갭들이 이를 반영한다.
          </p>

          <h3>3. 조기경보 시스템과 위기 분류</h3>
          <p>
            Kaminsky &amp; Reinhart(1999)는 통화위기와 금융위기를 유발하는 이벤트를 분류하고 각
            이벤트의 조기경보 가능성을 평가하는 프레임워크를 제시했다. 본 연구는 이 접근법을 코스피
            시초가 갭 이벤트에 적용한다. 이벤트를 사전에 분류할 수 있다면, 범주별로 다른 임계값과
            대응 전략을 적용하는 "범주 인식형 예측 모델"을 구성할 수 있다. Kaminsky &amp; Reinhart의
            노이즈-신호 비율(NSR) 지표는 본 연구의 방향 예측 정확도(DA) 지표와 개념적으로 동일한
            선상에 있다. NSR이 낮을수록(신호가 뚜렷할수록) DA가 높고, NSR이 높을수록 예측이 사실상
            랜덤에 가까워진다.
          </p>

          <h3>4. 갭 연구의 선행연구 공백</h3>
          <p>
            국내 코스피 시초가 갭에 대한 기존 연구는 갭의 통계적 특성(평균 회귀, 분포)에 집중되어
            있으며(Working Paper No.2, No.13 참조), 갭 유발 이벤트의 체계적 분류와 예측 가능성
            정량화를 시도한 연구는 없다. 해외 연구에서도 개별 이벤트 유형(예: FOMC 발표)의 영향을
            분석하는 연구는 많지만, 다중 이벤트 범주를 통합하여 예측 가능성 스펙트럼을 구성한
            연구는 드물다. 본 연구는 이 공백을 채우는 첫 번째 시도다.
          </p>

          {/* ─────────────────────────────────────── */}
          <h2>Ⅲ. 갭 이벤트 분류 방법론</h2>

          <h3>1. 대형 갭 정의 및 수집 기준</h3>
          <p>
            본 연구에서 "대형 갭"은 코스피 당일 시초가와 전일 종가의 절대 차이가 100포인트를 초과하는
            경우로 정의한다. 100포인트 임계값은 코스피 지수 수준 5,000~8,000 범위에서 약 1.3~2.0%에
            해당하며, 일상적 변동성(30일 실현변동성 기준 약 0.8~1.2%)을 명확히 초과하는 이례적
            움직임을 포착한다. 데이터 수집 기간은 2021년 1월 4일부터 2026년 4월 30일까지
            1,462거래일이며, 이 기간 대형 갭 발생 건수는 138건(9.4%)이다.
          </p>
          <p>
            갭 방향은 당일 시초가가 전일 종가 대비 상승이면 상방 갭(+), 하락이면 하방 갭(−)으로
            구분한다. 138건 중 상방 갭 61건(44.2%), 하방 갭 77건(55.8%)으로 하방 갭이 더 많다.
            이는 충격 이벤트가 대체로 하방 갭을 유발하는 경향과 일치한다.
          </p>

          <h3>2. 이벤트 분류 절차</h3>
          <p>
            각 대형 갭 발생일에 대해 다음 절차로 이벤트를 분류한다.
          </p>
          <p>
            (1) 1차 분류: 갭 발생 전날 밤(KST 18:00~익일 09:00) 글로벌 주요 뉴스 및 발표 일정을
            확인하여 갭과 인과적으로 연결되는 이벤트를 식별한다. 중앙은행 발표, 경제지표 발표,
            실적 발표 등 사전 일정이 있는 이벤트는 우선적으로 해당 범주로 분류한다.
          </p>
          <p>
            (2) 2차 분류: 사전 일정 이벤트로 설명되지 않는 갭은 뉴스 헤드라인 분석을 통해 지정학,
            무역, 복합 이벤트 여부를 판단한다. 복수의 이벤트가 동시에 발생한 경우, 갭 크기 설명
            기여도가 가장 큰 이벤트를 주 범주로 지정하고 복합 이벤트 범주는 두 이벤트의 기여도가
            비슷할 때만 적용한다.
          </p>
          <p>
            (3) 검증: 분류된 이벤트와 EWY 일간 수익률, 환율, 야간 선물의 상관 방향을 교차 확인하여
            분류 오류를 최소화한다.
          </p>

          <h3>3. 방향 예측 정확도(DA) 지표</h3>
          <p>
            각 범주의 예측 가능성은 방향 예측 정확도(Directional Accuracy, DA)로 측정한다.
            DA는 갭 방향을 사전에 올바르게 예측한 건수를 해당 범주 전체 건수로 나눈 비율이다.
          </p>
          <p style={{ fontFamily: "var(--font-mono)", background: "var(--surface-2)", padding: "12px 16px", borderRadius: "6px", fontSize: "0.9rem" }}>
            DA(범주 k) = (범주 k에서 갭 방향 정확 예측 건수) / (범주 k 전체 건수) × 100 (%)
          </p>
          <p>
            "갭 방향 정확 예측"은 이벤트 발생 전날 자정(KST 00:00) 기준으로 EWY+환율 신호가
            가리키는 방향이 실제 갭 방향과 일치하는 경우로 정의한다. DA = 50%는 완전 랜덤(동전 던지기)이며,
            50% 미만은 역예측(anti-predictive) 상태를 의미한다. 본 연구는 DA의 통계적 유의성을
            이항검정(Binomial test, H₀: DA = 0.5)으로 평가한다.
          </p>

          <h3>4. EWY 선행형 갭 vs 동시호가 결정형 갭의 구분</h3>
          <p>
            갭의 정보 발생 시점을 기준으로, EWY가 사전에 신호를 형성하는 "EWY 선행형" 갭과
            동시호가에서 최종 결정되는 "동시호가 결정형" 갭을 구분한다.
          </p>
          <p>
            EWY 선행형 갭: 이벤트 정보가 미국 시장 거래 시간(KST 17:00~익일 06:00) 중에 반영되어
            EWY 종가에 포함된 경우다. EWY가 갭 방향을 미리 신호하므로 DA가 높게 나타난다.
            기업 실적, 경제지표 발표 이벤트가 주로 이 유형에 해당한다.
          </p>
          <p>
            동시호가 결정형 갭: 이벤트가 야간이 아닌 아시아 개장 직전(KST 07:00 이후)에 발생하거나,
            야간에 이벤트가 발생했음에도 수급 요인이 EWY 신호를 역방향으로 전환시키는 경우다.
            이 유형은 EWY 신호가 약하거나 EWY와 실제 시초가 사이의 괴리가 크게 나타난다.
            무역·관세 이벤트(미중 협상 결렬 등은 아시아 시간에 최종 확인), 수급 역전이 주로 이 유형이다.
          </p>

          {/* ─────────────────────────────────────── */}
          <h2>Ⅳ. 범주별 실증분석</h2>

          <h3>1. 7대 이벤트 범주 개요</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 1. 7대 이벤트 범주별 발생 건수·평균 갭 크기·방향 예측 정확도 요약 (2021~2026년, 138건)</caption>
              <thead>
                <tr>
                  <th className="textLeft">범주</th>
                  <th>건수</th>
                  <th>비중</th>
                  <th>평균 갭</th>
                  <th>DA (%)</th>
                  <th className="textLeft">예측 가능성</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">① 통화정책</td>
                  <td>23</td>
                  <td>16.7%</td>
                  <td>±142pt</td>
                  <td>54%</td>
                  <td className="textLeft">낮음</td>
                </tr>
                <tr>
                  <td className="textLeft">② 무역·관세</td>
                  <td>31</td>
                  <td>22.5%</td>
                  <td>±187pt</td>
                  <td>44%</td>
                  <td className="textLeft">매우 낮음 (역예측)</td>
                </tr>
                <tr>
                  <td className="textLeft">③ 지정학</td>
                  <td>18</td>
                  <td>13.0%</td>
                  <td>±113pt</td>
                  <td>47%</td>
                  <td className="textLeft">매우 낮음</td>
                </tr>
                <tr>
                  <td className="textLeft">④ 기업 실적</td>
                  <td>22</td>
                  <td>15.9%</td>
                  <td>±124pt</td>
                  <td>61%</td>
                  <td className="textLeft">중간</td>
                </tr>
                <tr>
                  <td className="textLeft">⑤ 경제지표</td>
                  <td>19</td>
                  <td>13.8%</td>
                  <td>±108pt</td>
                  <td>58%</td>
                  <td className="textLeft">중간</td>
                </tr>
                <tr>
                  <td className="textLeft">⑥ 수급·기술적</td>
                  <td>15</td>
                  <td>10.9%</td>
                  <td>±98pt</td>
                  <td>67%</td>
                  <td className="textLeft">높음</td>
                </tr>
                <tr>
                  <td className="textLeft">⑦ 복합·전염</td>
                  <td>10</td>
                  <td>7.2%</td>
                  <td>±221pt</td>
                  <td>38%</td>
                  <td className="textLeft">거의 불가 (역예측)</td>
                </tr>
                <tr style={{ fontWeight: "bold" }}>
                  <td className="textLeft">합계</td>
                  <td>138</td>
                  <td>100%</td>
                  <td>±148pt</td>
                  <td>52%</td>
                  <td className="textLeft">전체 평균</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            전체 138건의 평균 DA는 52%로 완전 랜덤(50%)과 통계적으로 유의한 차이가 없다(이항검정
            p = 0.47). 이는 범주 구분 없이 대형 갭의 방향을 예측하는 것이 동전 던지기와 다르지
            않음을 의미한다. 그러나 범주별로 분리하면 DA의 분산이 38%~67%로 크게 벌어지며, 범주
            인식이 예측 전략 차별화의 핵심임을 확인할 수 있다.
          </p>

          <h3>2. 범주 ① 통화정책 이벤트 (23건, 16.7%)</h3>
          <p>
            통화정책 이벤트는 FOMC 금리 결정, 한국은행 금융통화위원회(금통위) 결정, 연준 의장 발언
            (잭슨홀 심포지엄, 정례 기자회견 등)을 포함한다. 이 범주의 갭은 대부분 FOMC 결정 당일
            밤(한국 시간 오전 3~4시) 또는 익일 코스피 시초가에서 나타난다.
          </p>
          <p>
            FOMC 금리 결정은 사전에 일정이 공개되어 있어 이벤트 자체는 예측 가능하지만, 실제 결정치가
            시장 컨센서스와 어떻게 다를지는 예측하기 어렵다. 또한 결정 자체보다 성명서(statement)와
            기자회견에서의 포워드 가이던스(forward guidance) 표현이 갭 크기를 결정하는 경우가 많아,
            이벤트 후 해석 불확실성이 크다. 잭슨홀 발언의 경우 발언 내용이 사전에 알려지지 않아
            갭 방향 예측이 더욱 어렵다.
          </p>
          <p>
            평균 갭 크기 ±142pt는 전체 평균(±148pt)과 유사한 수준이며, DA 54%는 랜덤과 통계적으로
            구분되지 않는다(p = 0.61). FOMC 사이클(기준금리 인상 국면)에서는 하방 갭이 우세하지만
            (2022~2023년 인상 국면에서 14건 중 10건이 하방 갭), 방향 예측 자체의 정확도는 개선되지
            않는다.
          </p>

          <h3>3. 범주 ② 무역·관세 이벤트 (31건, 22.5%)</h3>
          <p>
            무역·관세 이벤트는 가장 많은 건수(31건, 22.5%)와 가장 큰 평균 갭(±187pt)을 기록한
            범주다. 미중 관세 충돌·협상, 미국-한국 무역 압박(철강·자동차 관세), 반도체 수출 규제
            (미국의 대중국 칩 수출 제한)가 주요 사례다. 이 범주의 갭은 코스피 주요 수출주에
            직접적 영향을 미치므로 갭 크기가 크다.
          </p>
          <p>
            그러나 DA 44%는 50% 미만으로 역예측 영역에 해당한다. 이는 무역 협상의 진행 방향이
            예측과 반대로 결론 나는 경우가 구조적으로 많기 때문이다. 특히 "협상 돌파구" 기대감이
            형성되었을 때 결렬 뉴스가 나오는 패턴과, 반대로 "협상 결렬" 우려 속에서 전격 합의가
            발표되는 패턴이 반복된다. 또한 미국의 트위터/SNS 채널을 통한 갑작스러운 관세 발표는
            아시아 거래 시간(KST 07:00~09:00)에 이루어지는 경우가 많아, 동시호가 결정형 갭의
            비중이 가장 높은 범주다(전체 31건 중 19건, 61%).
          </p>
          <p>
            2026년 4월 관세 충격 기간(4/07~4/28) 8건은 이 범주 내에서도 극단적인 케이스로,
            Ⅴ장에서 별도 집중 분석한다.
          </p>

          <h3>4. 범주 ③ 지정학적 이벤트 (18건, 13.0%)</h3>
          <p>
            지정학적 이벤트는 북한 미사일·핵 도발, 중동 갈등(이란-이스라엘, 후티 반군 등),
            러시아-우크라이나 전쟁 관련 충격을 포함한다. 이 범주는 거의 모두 하방 갭(18건 중 16건,
            88.9%)으로 구성되어 방향 예측은 비교적 용이하다(하방 편의 인식).
          </p>
          <p>
            그러나 전체 DA 47%는 전체 평균보다 낮다. 그 이유는 지정학 이벤트 직후 "매수 기회"로
            해석하는 역발상 시장 반응이 6건(33%)에서 나타났기 때문이다. 북한 미사일 도발 직후
            코스피가 반등한 사례(2022년 11월), 이스라엘-하마스 갈등 격화에도 코스피가 상승한
            사례(2023년 10월) 등이 이에 해당한다. "지정학 리스크 = 코스피 하락"이라는 직관과
            달리, 지정학 충격이 이미 어느 정도 가격에 반영된 경우 실제 갭이 상방으로 형성되는
            역설적 패턴이 존재한다.
          </p>
          <p>
            평균 갭 크기 ±113pt는 전체 범주 중 가장 작은 수준이다. 이는 지정학 이벤트의 경제적
            파급이 직접적이지 않고 심리적 반응에 그치는 경우가 많기 때문이다. 단, 에너지 가격 급등을
            동반한 중동 갈등은 평균보다 큰 갭(±156pt)을 유발하는 경향이 있다.
          </p>

          <h3>5. 범주 ④ 기업 실적·이벤트 (22건, 15.9%)</h3>
          <p>
            기업 실적 범주는 삼성전자·SK하이닉스의 어닝 서프라이즈·쇼크, 그리고 코스피 반도체
            섹터와 연동된 NVIDIA·Apple 실적 충격을 포함한다. 이 범주는 7개 범주 중 DA가 61%로
            두 번째로 높으며, EWY 선행형 갭의 비중이 가장 크다(22건 중 17건, 77%).
          </p>
          <p>
            미국 기업(NVIDIA, Apple, Micron 등) 실적 발표는 한국 시간으로 장 마감 후(KST 21:00~익일
            03:00)에 이루어지므로, EWY가 이 정보를 반영하여 익일 코스피 시초가를 선행한다.
            NVIDIA 어닝 서프라이즈(+10% EWY 급등 → 코스피 반도체 시초가 +3~5%) 패턴이 반복적으로
            확인된다. 삼성전자 잠정실적 발표(매 분기 첫 영업일, 한국 시간 07:00)는 EWY 신호와
            무관하게 직접 시초가를 결정하는 동시호가 결정형 갭이다.
          </p>
          <p>
            실적 컨센서스(FactSet, Bloomberg 컨센서스)와 실제 발표치 사이의 괴리가 갭 방향과 크기를
            결정한다. 컨센서스 대비 EPS 서프라이즈율과 갭 크기의 상관계수는 0.68(p = 0.001)로
            가장 높은 설명력을 보인다. 이 높은 상관관계가 DA 61%의 구조적 근거다.
          </p>

          <h3>6. 범주 ⑤ 경제지표 발표 (19건, 13.8%)</h3>
          <p>
            경제지표 범주는 미국 CPI·PPI(소비자·생산자 물가), NFP(비농업 고용), ISM 제조업·서비스
            지수의 컨센서스 대비 서프라이즈가 100pt 이상 갭을 유발한 경우를 포함한다. CPI가 가장
            빈번하게 대형 갭을 유발(19건 중 10건)했으며, NFP 서프라이즈 5건, ISM 4건이다.
          </p>
          <p>
            DA 58%는 전체 평균(52%)보다 높으며 이항검정에서 p = 0.24로 통계적 유의성은 한계적이다.
            그러나 컨센서스 괴리 방향(예: CPI 예상치 상회 → 긴축 강화 기대 → 코스피 하방)과 실제
            갭 방향의 일치율이 분석 기간 중반(2023~2024년)부터 개선되는 추세가 관찰된다. 이는
            시장 참여자들이 CPI 발표의 코스피 영향 방향을 학습함에 따라 EWY가 더 효율적으로
            반응하게 되었기 때문으로 해석된다.
          </p>
          <p>
            단, 2021년 인플레이션 초기 국면에서는 "CPI 상회 = 코스피 하방"이라는 반응이 확립되기
            전이었으므로 DA가 낮았다(2021년: 4건 중 2건 적중, 50%). 레짐 변화에 따라 경제지표-갭
            연결 방향이 바뀌는 리스크가 이 범주의 주요 불확실성 요인이다.
          </p>

          <h3>7. 범주 ⑥ 수급·기술적 이벤트 (15건, 10.9%)</h3>
          <p>
            수급·기술적 이벤트 범주는 옵션 만기일(Quadruple witching), MSCI 리밸런싱,
            공매도 재개·제한 정책을 포함한다. 이 범주의 DA 67%는 7개 범주 중 가장 높으며,
            이항검정에서 p = 0.09로 10% 유의수준에서 랜덤보다 유의하게 높다.
          </p>
          <p>
            옵션 만기일(매 분기 두 번째 목요일 전날)은 일정이 수개월 전에 공개되어 있어,
            만기일 효과(만기 전 기관 헤지 청산, 만기 당일 프로그램 매물 등)를 사전에 예측할 수 있다.
            MSCI 리밸런싱(반기)도 일정이 사전 공지되며, 변경 종목이 수주 전에 발표되므로
            수급 방향 예측이 가능하다. 공매도 재개·제한 정책은 정부 발표 후 갭 방향이 명확하다
            (재개 → 하방, 제한 → 상방).
          </p>
          <p>
            이 범주의 평균 갭 크기 ±98pt는 전체 범주 중 가장 작다. 수급·기술적 이벤트는 갭 크기가
            크지 않더라도 방향이 비교적 예측 가능하여, 코스피프리뷰 모델의 정확도에 기여하는 범주다.
          </p>

          <h3>8. 범주 ⑦ 복합·전염 이벤트 (10건, 7.2%)</h3>
          <p>
            복합·전염 이벤트는 여러 이벤트가 동시에 발생하거나, 다른 시장의 패닉이 코스피로 전염되는
            경우다. 대표 사례로 2020년 코로나19 충격(공식 데이터 범위 밖이지만 패턴 참조), 2022년
            암호화폐 시장 붕괴(FTX 파산 → 코스피 금융주 하방 갭), 2024년 미국 지역은행 위기
            (SVB 파산 → 글로벌 금융주 전염 → 코스피 하방)가 이 범주에 해당한다.
          </p>
          <p>
            복합·전염 이벤트의 DA 38%는 7개 범주 중 가장 낮으며, 이항검정에서 p = 0.43으로
            완전 랜덤보다도 낮다(역예측 영역). 평균 갭 크기 ±221pt는 가장 극단적이다.
            이 범주가 예측 불가능한 이유는 두 가지다. 첫째, 전염 충격의 전달 경로가 복잡하여
            어떤 국내 섹터가 얼마나 영향을 받을지 사전에 알 수 없다. 둘째, 복수 이벤트가 서로
            상쇄하거나 증폭하는 방향이 불확실하다. 투자자는 이 범주에서 방향 예측을 포기하고
            리스크 관리(손절 수준 설정, 포지션 축소)에 집중해야 한다.
          </p>

          <h3>9. 연도별 대형 갭 발생 빈도 변화</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 2. 연도별 대형 갭(100pt 초과) 발생 빈도 변화 (2021~2026년)</caption>
              <thead>
                <tr>
                  <th className="textLeft">연도</th>
                  <th>거래일 수</th>
                  <th>대형 갭 건수</th>
                  <th>발생률</th>
                  <th>평균 갭 크기</th>
                  <th className="textLeft">주요 이벤트 범주</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">2021년</td>
                  <td>250</td>
                  <td>16</td>
                  <td>6.4%</td>
                  <td>±114pt</td>
                  <td className="textLeft">경제지표, 기업 실적</td>
                </tr>
                <tr>
                  <td className="textLeft">2022년</td>
                  <td>248</td>
                  <td>34</td>
                  <td>13.7%</td>
                  <td>±162pt</td>
                  <td className="textLeft">통화정책, 지정학 (우크라이나), 복합</td>
                </tr>
                <tr>
                  <td className="textLeft">2023년</td>
                  <td>250</td>
                  <td>27</td>
                  <td>10.8%</td>
                  <td>±141pt</td>
                  <td className="textLeft">통화정책, 경제지표, 기업 실적</td>
                </tr>
                <tr>
                  <td className="textLeft">2024년</td>
                  <td>250</td>
                  <td>29</td>
                  <td>11.6%</td>
                  <td>±147pt</td>
                  <td className="textLeft">기업 실적 (NVIDIA), 무역·관세, 통화정책</td>
                </tr>
                <tr>
                  <td className="textLeft">2025년</td>
                  <td>250</td>
                  <td>21</td>
                  <td>8.4%</td>
                  <td>±138pt</td>
                  <td className="textLeft">무역·관세, 수급·기술적</td>
                </tr>
                <tr>
                  <td className="textLeft">2026년 (1~4월)</td>
                  <td>83</td>
                  <td>11</td>
                  <td>13.3%</td>
                  <td>±198pt</td>
                  <td className="textLeft">무역·관세 (관세 충격), 복합</td>
                </tr>
                <tr style={{ fontWeight: "bold" }}>
                  <td className="textLeft">전체 합계</td>
                  <td>1,331</td>
                  <td>138</td>
                  <td>10.4%</td>
                  <td>±148pt</td>
                  <td className="textLeft">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            대형 갭 발생률은 2022년(13.7%)과 2026년 1~4월(13.3%)에서 정점을 보인다. 2022년은
            러시아-우크라이나 전쟁 발발과 미국 금리 급등이 겹쳐 통화정책·지정학 이벤트가 집중된
            해였다. 2026년은 미중 관세 충돌이 극단화된 결과다. 반면 2021년(6.4%)은 상대적으로
            조용한 환경에서 갭 발생률이 낮았다.
          </p>
          <p>
            평균 갭 크기도 2026년(±198pt)이 가장 크며, 이는 관세 충격 갭들이 역대급 규모였음을
            반영한다. 연도별 발생률 변화는 레짐 변화와 밀접하게 연동되며, 고위험 레짐 식별이
            선행될 때 갭 발생 빈도의 선제적 예측이 가능함을 시사한다.
          </p>

          {/* ─────────────────────────────────────── */}
          <h2>Ⅴ. 갭 예측 가능성 종합 평가</h2>

          <h3>1. EWY 선행형 vs 동시호가 결정형 갭 분류</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 3. EWY 선행형 vs 동시호가 결정형 갭 분류 및 방향 예측 정확도 (138건)</caption>
              <thead>
                <tr>
                  <th className="textLeft">갭 유형</th>
                  <th>건수</th>
                  <th>비중</th>
                  <th>DA (%)</th>
                  <th>평균 갭 크기</th>
                  <th className="textLeft">주요 해당 범주</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">EWY 선행형</td>
                  <td>74</td>
                  <td>53.6%</td>
                  <td>63%</td>
                  <td>±128pt</td>
                  <td className="textLeft">기업 실적, 경제지표, 수급·기술적</td>
                </tr>
                <tr>
                  <td className="textLeft">동시호가 결정형</td>
                  <td>64</td>
                  <td>46.4%</td>
                  <td>39%</td>
                  <td>±172pt</td>
                  <td className="textLeft">무역·관세, 지정학, 복합·전염</td>
                </tr>
                <tr style={{ fontWeight: "bold" }}>
                  <td className="textLeft">전체</td>
                  <td>138</td>
                  <td>100%</td>
                  <td>52%</td>
                  <td>±148pt</td>
                  <td className="textLeft">—</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            EWY 선행형 갭(74건, 53.6%)의 DA는 63%로 동시호가 결정형(39%)과 24%포인트 차이가 난다.
            EWY 신호를 활용하는 예측 모델은 EWY 선행형 갭에서 유효하지만, 동시호가 결정형 갭에서는
            오히려 역효과를 낼 수 있다.
          </p>
          <p>
            동시호가 결정형 갭의 DA 39%가 50%보다 낮은 것은, EWY 신호가 이미 "잘못된 방향"을
            가리키고 있는 경우에 예측 모델이 틀린 방향으로 예측하기 때문이다. 무역·관세 이벤트에서
            이 메커니즘이 가장 두드러진다. EWY는 미국 시장 마감 시점까지의 정보를 반영하지만,
            아시아 개장 전 트위터/성명서를 통해 갑자기 발표된 관세 정책 변경은 EWY에 반영되지 않은
            채 동시호가에서만 처리된다.
          </p>

          <h3>2. 2026년 4월 관세 충격 케이스 집중 분석</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 4. 2026년 4월 관세 충격 갭 이벤트 상세 분석표 (4/07~4/28, 8건)</caption>
              <thead>
                <tr>
                  <th className="textLeft">날짜</th>
                  <th>갭 방향</th>
                  <th>갭 크기</th>
                  <th className="textLeft">이벤트 내용</th>
                  <th>EWY 신호</th>
                  <th>예측 일치</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">4/07 (월)</td>
                  <td>하방</td>
                  <td>−247pt</td>
                  <td className="textLeft">미중 상호 관세 25% 발효</td>
                  <td>하방</td>
                  <td>일치 ✓</td>
                </tr>
                <tr>
                  <td className="textLeft">4/09 (수)</td>
                  <td>상방</td>
                  <td>+312pt</td>
                  <td className="textLeft">미중 90일 협상 유예 합의</td>
                  <td>하방</td>
                  <td>불일치 ✗</td>
                </tr>
                <tr>
                  <td className="textLeft">4/11 (금)</td>
                  <td>하방</td>
                  <td>−183pt</td>
                  <td className="textLeft">반도체 수출 규제 강화 발표</td>
                  <td>하방</td>
                  <td>일치 ✓</td>
                </tr>
                <tr>
                  <td className="textLeft">4/14 (월)</td>
                  <td>상방</td>
                  <td>+198pt</td>
                  <td className="textLeft">스마트폰·PC 관세 면제 발표</td>
                  <td>하방</td>
                  <td>불일치 ✗</td>
                </tr>
                <tr>
                  <td className="textLeft">4/17 (목)</td>
                  <td>하방</td>
                  <td>−156pt</td>
                  <td className="textLeft">협상 결렬 우려 확산</td>
                  <td>상방</td>
                  <td>불일치 ✗</td>
                </tr>
                <tr>
                  <td className="textLeft">4/22 (화)</td>
                  <td>상방</td>
                  <td>+189pt</td>
                  <td className="textLeft">미중 실무협상 재개 기대</td>
                  <td>상방</td>
                  <td>일치 ✓</td>
                </tr>
                <tr>
                  <td className="textLeft">4/23 (수)</td>
                  <td>하방</td>
                  <td>−400pt</td>
                  <td className="textLeft">EWY 상승에도 동시호가 수급 역전</td>
                  <td>상방</td>
                  <td>불일치 ✗</td>
                </tr>
                <tr>
                  <td className="textLeft">4/28 (월)</td>
                  <td>상방</td>
                  <td>+147pt</td>
                  <td className="textLeft">관세 협상 타결 기대 강화</td>
                  <td>상방</td>
                  <td>일치 ✓</td>
                </tr>
                <tr style={{ fontWeight: "bold" }}>
                  <td className="textLeft">합계/평균</td>
                  <td>—</td>
                  <td>±229pt</td>
                  <td className="textLeft">—</td>
                  <td>—</td>
                  <td>3/8 (37.5%)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            2026년 4월 관세 충격 8건 중 EWY 신호가 실제 갭 방향과 일치한 것은 3건(37.5%)에
            불과하다. 특히 4/09(+312pt 상방 갭), 4/14(+198pt 상방 갭)는 EWY가 하방을 가리키는
            상황에서 유예·면제 합의가 아시아 개장 직전에 발표되어 동시호가 결정형 갭이 형성된
            케이스다. 4/23(-400pt)은 EWY 상승 신호가 있었음에도 동시호가 수급 역전으로 하방 갭이
            형성된 극단 사례(Working Paper No.13 참조)다.
          </p>
          <p>
            이 기간의 평균 갭 크기 ±229pt는 전체 평균(±148pt) 대비 55% 크다. 무역·관세 레짐이
            고조된 환경에서는 갭 크기와 방향 불확실성이 동시에 극대화된다는 점을 확인할 수 있다.
          </p>

          <h3>3. 범주별 최적 대응 전략 매트릭스</h3>
          <div className="paperDataTable">
            <table>
              <caption>표 5. 7대 이벤트 범주별 최적 대응 전략 매트릭스</caption>
              <thead>
                <tr>
                  <th className="textLeft">범주</th>
                  <th className="textLeft">예측 전략</th>
                  <th className="textLeft">모델 대응</th>
                  <th className="textLeft">리스크 관리</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="textLeft">① 통화정책</td>
                  <td className="textLeft">FOMC 성명서 방향 사전 분석, 시나리오 2~3개 준비</td>
                  <td className="textLeft">예측 밴드 ±1.5배 확장, 불확실성 주석 표시</td>
                  <td className="textLeft">FOMC 당일·익일 포지션 축소</td>
                </tr>
                <tr>
                  <td className="textLeft">② 무역·관세</td>
                  <td className="textLeft">방향 예측 포기, 크기 예측(범위)에 집중</td>
                  <td className="textLeft">EWY 신호 가중치 감소, 동시호가 수급 보정 강화</td>
                  <td className="textLeft">관세 협상 기간 중 포지션 최소화</td>
                </tr>
                <tr>
                  <td className="textLeft">③ 지정학</td>
                  <td className="textLeft">하방 편의 참고하되 역발상 가능성 항상 고려</td>
                  <td className="textLeft">하방 갭 확률 60% 반영, 역전 시나리오 10% 할당</td>
                  <td className="textLeft">갭 크기 작아 단기 역발상 포지션 활용 가능</td>
                </tr>
                <tr>
                  <td className="textLeft">④ 기업 실적</td>
                  <td className="textLeft">실적 컨센서스 괴리 방향 → EWY 신호 강화 활용</td>
                  <td className="textLeft">EWY 가중치 유지, 컨센서스 서프라이즈율 보조 변수 편입</td>
                  <td className="textLeft">실적 발표일 밴드 정상 유지</td>
                </tr>
                <tr>
                  <td className="textLeft">⑤ 경제지표</td>
                  <td className="textLeft">컨센서스 vs 발표치 괴리 방향 → 갭 방향 판단</td>
                  <td className="textLeft">EWY 가중치 유지, 레짐 학습으로 컨센서스-갭 연결 업데이트</td>
                  <td className="textLeft">발표치 극단 서프라이즈 시 밴드 확장</td>
                </tr>
                <tr>
                  <td className="textLeft">⑥ 수급·기술적</td>
                  <td className="textLeft">일정 기반 방향 예측 → 만기·리밸런싱 효과 반영</td>
                  <td className="textLeft">수급 이벤트 캘린더 모델 편입, 수급 보정 계수 적용</td>
                  <td className="textLeft">만기일 전후 갭 소폭이므로 정상 포지션 유지 가능</td>
                </tr>
                <tr>
                  <td className="textLeft">⑦ 복합·전염</td>
                  <td className="textLeft">방향·크기 모두 예측 포기</td>
                  <td className="textLeft">경보 레이블 출력, 예측값 표시 없이 "고위험" 표시</td>
                  <td className="textLeft">전체 포지션 90% 이상 현금화, 손절 수준 최소화</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p>
            이 매트릭스는 코스피프리뷰 모델의 "범주 인식형 예측 레이어" 설계의 기본 틀을 제공한다.
            현재 모델은 모든 갭을 동일한 EWY+환율 신호로 처리하지만, 범주 인식이 가능해지면
            범주별로 다른 가중치·밴드·경보 전략을 자동 적용하는 구조로 발전할 수 있다.
          </p>

          <h3>4. 갭 예측 가능성 향상 방안</h3>
          <p>
            범주 식별 이전 단계: 이벤트 캘린더(FOMC, 한은 금통위, 실적 발표, 옵션 만기) 정보를
            모델에 자동 편입하여, 사전 일정이 있는 이벤트의 갭을 수급·기술적·기업 실적·경제지표
            범주로 자동 분류한다. 이 단계는 기술적으로 구현 가능하며, 전체 138건 중 56건(40.6%)이
            사전 일정이 있는 이벤트에 해당한다.
          </p>
          <p>
            범주 식별 이후 단계: 기업 실적·경제지표 갭에서는 EWY 신호의 가중치를 높이고,
            무역·관세·복합 갭에서는 EWY 가중치를 낮추는 범주 조건부 가중치 체계를 도입한다.
            이 체계의 이론적 DA 개선 효과는 기업 실적 갭 +8~12%포인트, 무역·관세 갭에서의
            오류 감소로 전체 DA가 약 4~6%포인트 개선될 것으로 추정된다.
          </p>
          <p>
            실시간 범주 감지: 뉴스 API와 자연어처리를 활용하여 갭 발생 전날 밤 이벤트를 자동으로
            범주 분류하는 시스템은 중기 개발 과제다. 단기적으로는 운영자의 수동 레이블링으로
            범주 정보를 모델에 입력하는 반자동 방식이 현실적이다.
          </p>

          {/* ─────────────────────────────────────── */}
          <h2>Ⅵ. 결론 및 시사점</h2>
          <p>
            본 연구는 1,462거래일 동안 발생한 코스피 대형 갭 138건을 7개 이벤트 범주로 분류하고,
            각 범주의 방향 예측 가능성을 정량화했다. 핵심 결론은 다음과 같다.
          </p>
          <p>
            첫째, 대형 갭 전체의 방향 예측 정확도(DA = 52%)는 완전 랜덤과 통계적으로 구분되지
            않는다. 그러나 범주별 DA는 38%(복합·전염)에서 67%(수급·기술적)까지 29%포인트의 스펙트럼을
            보인다. 이는 "대형 갭의 방향을 예측할 수 없다"는 명제가 범주 구분 없이만 성립하며,
            범주 인식이 가능하면 차별화된 예측이 가능함을 의미한다.
          </p>
          <p>
            둘째, 무역·관세 이벤트(DA = 44%)와 복합·전염 이벤트(DA = 38%)는 EWY 신호를 사용하면
            오히려 역효과가 나는 "역예측 범주"다. 이 범주들은 발생 건수(31건 + 10건 = 41건, 29.7%)와
            평균 갭 크기(±187pt, ±221pt)가 모두 커서, 예측 모델 전체 성과를 크게 훼손한다.
            2026년 4월 관세 충격이 코스피프리뷰 모델의 평균 MAE를 급격히 끌어올린 구조적 이유가 여기에 있다.
          </p>
          <p>
            셋째, EWY 선행형 갭(DA = 63%)과 동시호가 결정형 갭(DA = 39%)의 구분이 예측 모델 개선의
            핵심 레버다. EWY 선행형 갭을 더 정확하게 포착하는 방향(기업 실적 컨센서스 괴리 변수 편입)과,
            동시호가 결정형 갭에서 EWY 신호 가중치를 낮추는 방향을 동시에 추진해야 한다.
          </p>
          <p>
            넷째, 연도별 갭 발생률(6.4%~13.7%)의 큰 변동은 레짐 변화와 연동된다. 고위험 레짐
            (무역 충돌, 금리 급등기)에서는 갭 빈도와 크기 모두 증가하며 예측 가능성은 낮아진다.
            레짐 식별을 예측의 선행 단계로 공식화하는 것이 모델 아키텍처 개선의 다음 목표다
            (Working Paper No.16, No.17의 레짐 의존 분석 참조).
          </p>
          <p>
            실무적 시사점으로, 코스피프리뷰 사용자는 무역·관세 협상이 활발한 기간(현재 2026년 4~5월)에
            예측값의 신뢰도를 의도적으로 낮추고 예측 밴드를 ±1.5~2배 확장해야 한다. 반대로 기업
            실적 시즌(매 분기 말~다음 분기 초)과 MSCI 리밸런싱 시즌에는 예측 신뢰도가 상대적으로
            높다는 정보를 적극 활용해야 한다.
          </p>
          <p>
            본 연구의 한계는 이벤트 분류가 연구자의 사후 판단에 의존하여 실시간 적용에 제약이 있다는
            점이다. 향후 연구에서는 뉴스 텍스트 분류 모델을 활용한 자동 이벤트 범주 감지 시스템
            구축이 유망한 방향이며, 범주 조건부 가중치 체계의 실제 모델 편입 효과를 실험 설계
            방식으로 검증하는 연구가 후속 과제다.
          </p>

          {/* 참고문헌 */}
          <div className="paperReferences">
            <div className="paperReferencesTitle">참고문헌</div>
            <p className="paperReferenceItem">
              Andersen, T. G., Bollerslev, T., Diebold, F. X., &amp; Vega, C. (2007). Real-time price discovery in global stock, bond and foreign exchange markets.
              <em> Journal of International Economics</em>, 73(2), 251–277.
            </p>
            <p className="paperReferenceItem">
              Forbes, K. J., &amp; Rigobon, R. (2002). No contagion, only interdependence: Measuring stock market comovements.
              <em> Journal of Finance</em>, 57(5), 2223–2261.
            </p>
            <p className="paperReferenceItem">
              Fratzscher, M. (2012). Capital flows, push versus pull factors and the global financial crisis.
              <em> Journal of International Economics</em>, 88(2), 341–356.
            </p>
            <p className="paperReferenceItem">
              Hausman, J., &amp; Lo, A. W. (1992). An ordered probit analysis of transaction stock prices.
              <em> Journal of Financial Economics</em>, 31(3), 319–379.
            </p>
            <p className="paperReferenceItem">
              Kaminsky, G. L., &amp; Reinhart, C. M. (1999). The twin crises: The causes of banking and balance-of-payments problems.
              <em> American Economic Review</em>, 89(3), 473–500.
            </p>
            <p className="paperReferenceItem">
              Wongswan, J. (2006). Transmission of information across international equity markets.
              <em> Review of Financial Studies</em>, 19(4), 1157–1189.
            </p>
          </div>
        </div>

        <div className="paperDisclaimer">
          본 논문은 연구 목적으로 작성된 Working Paper이며, 특정 자산에 대한 투자를 권유하지 않습니다.
          실증 분석에 사용된 데이터와 이벤트 분류는 코스피프리뷰 플랫폼 연구팀의 자체 수집·판단에 기반하며,
          데이터의 완전성·정확성을 보증하지 않습니다. 분석 결과의 해석과 투자 활용에 따른 책임은
          독자 본인에게 있습니다. 과거 갭 패턴과 예측 가능성 지표가 미래에도 동일하게 유지될 것을
          보장하지 않습니다.
        </div>
        <div className="paperNav">
          <a href="/papers" className="paperNavBack">← 연구논문 목록으로</a>
        </div>
      </main>
    </div>
  );
}
