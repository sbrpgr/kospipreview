import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "통계모델은 왜 정치 충격에 취약한가";
const PAGE_DESCRIPTION =
  "2026년 4월 관세 쇼크 구간에서 코스피 시초가 예측 모델이 13거래일 연속 밴드를 벗어난 이유를 실측 데이터로 분석합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/model-in-volatile-markets" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/model-in-volatile-markets"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

export default async function ModelInVolatileMarketsPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main className="prose">
        <div className="researchArticleHeader">
          <div className="researchArticleMeta">
            <span className="researchCardTag">모델 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            2026년 4월, KOSPI Dawn 모델은 13거래일 연속으로 예측 밴드를 벗어났다.
            같은 모델이 1,462행 백테스트에서 75% 밴드 적중률을 기록한 것과 대비해,
            무엇이 달랐는지 실측 데이터를 통해 분석한다.
          </p>
        </div>

        <h3>1. 4월 9일: 첫 번째 충격</h3>
        <p>
          4월 9일 새벽, 트럼프 행정부의 상호관세 발효 소식이 아시아 시장 전반을 강타했다.
          KOSPI Dawn 모델의 당일 예측값은 6,090포인트였다. 실제 시초가는 5,826포인트로 열렸다.
          오차는 264포인트, 전일 대비 약 4.5% 하방 충격이었다. 모델 예측 밴드의 하단(6,053포인트)보다도
          227포인트 아래로 시장이 열린 것이다.
        </p>
        <p>
          이날 EWY는 이미 급락한 상태였다. 환율도 원화 약세 방향으로 움직였다.
          문제는 그 낙폭의 크기였다. 모델이 학습한 180일 치 데이터 안에서 이 정도 규모의 동시 충격은
          사실상 전례가 없었다. 통계 모델은 과거의 정상적 관계를 학습한다. 전례 없는 크기의 충격에는
          계수값이 그대로 적용되지만, 선형 모델의 작동 범위를 벗어난 이벤트는 필연적으로 큰 오차를 낳는다.
        </p>

        <h3>2. 4월 10일: 반대 방향 충격</h3>
        <p>
          하루 뒤인 4월 10일, 트럼프 대통령이 90일 관세 유예를 발표했다.
          미국 시장은 전날 충격의 상당 부분을 되돌렸고, EWY는 급등했다.
          그런데 모델은 이미 전날 급락을 반영한 상태에서 다음날 예측을 5,688포인트로 산출했다.
          실제 시초가는 5,876포인트였다. 이번에는 반대 방향으로 188포인트 오차가 발생했다.
        </p>
        <p>
          이틀 연속, 서로 반대 방향의 대규모 오차. 모델이 잘못 설계되었기 때문이 아니다.
          두 거래일 사이에 미국 행정부의 정책 결정이 두 번 바뀌었기 때문이다.
          어떤 통계 모델도 트위터 하나로 결정되는 관세 정책 변경을 예측 변수에 담을 수 없다.
        </p>

        <h3>3. 13거래일 연속 밴드 이탈</h3>
        <p>
          4월 9일부터 4월 23일까지, 모델은 단 한 번도 밴드 안에 시초가를 맞추지 못했다.
          이 기간의 실측 기록을 살펴보면 패턴이 보인다.
        </p>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr>
                <th>날짜</th>
                <th>모델 예측</th>
                <th>실제 시초가</th>
                <th>오차</th>
                <th>방향</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>2026-04-09</td><td>6,090</td><td>5,826</td><td>−264</td><td>모델 과대</td></tr>
              <tr><td>2026-04-10</td><td>5,688</td><td>5,876</td><td>+188</td><td>모델 과소</td></tr>
              <tr><td>2026-04-13</td><td>5,830</td><td>5,737</td><td>−93</td><td>모델 과대</td></tr>
              <tr><td>2026-04-14</td><td>5,918</td><td>5,960</td><td>+42</td><td>모델 과소</td></tr>
              <tr><td>2026-04-15</td><td>6,112</td><td>6,142</td><td>+30</td><td>모델 과소</td></tr>
              <tr><td>2026-04-16</td><td>6,019</td><td>6,149</td><td>+130</td><td>모델 과소</td></tr>
              <tr><td>2026-04-17</td><td>6,327</td><td>6,227</td><td>−100</td><td>모델 과대</td></tr>
              <tr><td>2026-04-20</td><td>6,343</td><td>6,214</td><td>−129</td><td>모델 과대</td></tr>
              <tr><td>2026-04-21</td><td>6,106</td><td>6,303</td><td>+197</td><td>모델 과소</td></tr>
              <tr><td>2026-04-22</td><td>6,302</td><td>6,388</td><td>+86</td><td>모델 과소</td></tr>
              <tr><td>2026-04-23</td><td>6,632</td><td>6,489</td><td>−143</td><td>모델 과대</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          오차 방향이 일정하지 않다는 점이 주목할 만하다. 모델이 지속적으로 한쪽 방향으로만 틀린 것이 아니라,
          크게 과대 예측했다가 크게 과소 예측하는 패턴을 반복했다. 이는 모델 자체의 편향 문제가 아니라
          시장이 외부 정치 변수에 의해 예측 불가능한 방향으로 움직였음을 나타낸다.
        </p>

        <h3>4. 왜 통계 모델은 이런 구간에 취약한가</h3>
        <p>
          KOSPI Dawn 모델은 EWY와 달러-원 환율을 핵심 신호로 사용하고, S&P 500, SOX, VIX 등을
          보조 신호로 활용한다. 이 신호들은 정상적인 시장 레짐에서는 코스피 시초가 변화의 방향과
          대략적인 크기를 설명한다. 그러나 모든 신호가 동시에 전례 없는 크기로 움직이는 구간에서는
          계수의 선형 적용 자체가 한계에 부딪힌다.
        </p>
        <p>
          관세 충격이 특히 다루기 어려운 이유가 있다. 발표 내용이 하루 단위로 바뀌었기 때문이다.
          4월 9일의 EWY 움직임과 4월 10일의 EWY 움직임은 서로 반대 방향이었고, 모두 모델이
          학습한 평균 변동폭을 크게 벗어났다. 모델이 이런 연속 충격을 즉시 흡수하려면 계수를 매일
          재추정해야 하는데, 그 과정에서 노이즈에 과적합하는 문제가 발생한다.
          현재 모델이 180일 롤링 윈도우로 계수를 재추정하는 것도 바로 이 균형 때문이다.
        </p>

        <h3>5. 4월 27일 이후: 빠른 회복</h3>
        <p>
          정치 충격이 일단락되자 모델은 빠르게 성능을 회복했다.
          4월 27일부터 5월 4일까지 5거래일 중 4거래일에서 밴드 적중에 성공했다(80%).
          관세 협상의 1단계 윤곽이 잡히고 시장이 새로운 안정 레짐에 접어들자,
          EWY와 환율 신호의 설명력이 다시 작동하기 시작한 것이다.
        </p>
        <p>
          이 패턴은 의미 있는 관찰이다. 모델 자체가 망가진 것이 아니라,
          모델이 전제하는 정상 레짐을 벗어난 구간이 끝나면서 성능이 회복되었다.
          통계 모델의 한계는 "특정 조건에서 작동하지 않는다"가 아니라
          "어떤 조건에서 작동하는지를 명확히 이해해야 한다"는 것이다.
        </p>

        <h3>6. 실용적 시사점</h3>
        <p>
          이 기간의 데이터에서 얻을 수 있는 실용적 결론은 다음 세 가지다.
        </p>
        <ul>
          <li>
            <strong>정치 이벤트 대기 구간에서는 밴드를 보수적으로 해석해야 한다.</strong>
            미국 의회 일정, 무역 협상 발표, 연준 회의 등 시장 전체의 방향을 바꿀 수 있는
            정치·정책 이벤트가 예정된 구간에서는 모델 밴드 외부의 시나리오도 함께 고려해야 한다.
          </li>
          <li>
            <strong>방향 신호보다 크기 신호에 더 주의해야 한다.</strong>
            관세 충격 구간에서도 모델의 방향 예측(상승/하락)은 완전히 틀리지 않은 날이 많았다.
            오히려 크기를 얼마나 과소 또는 과대 평가했는지가 더 큰 문제였다.
          </li>
          <li>
            <strong>충격 이후 회복 구간을 구분해서 봐야 한다.</strong>
            충격 직후 2~3거래일은 모델 신뢰도가 가장 낮은 시기다.
            시장이 새로운 레짐을 찾아가는 과정에서는 전날 대비 변화의 방향 자체가 불안정하다.
          </li>
        </ul>
        <p>
          KOSPI Dawn은 이 기간의 실측 기록을 그대로 공개한다.
          모델이 틀린 날을 숨기지 않는 것이 이 플랫폼의 운영 원칙 중 하나다.
          예측이 맞은 날만 골라 보여주는 것은 통계적으로 의미 없는 주장이기 때문이다.
        </p>

        <div className="researchDisclaimer">
          본 분석은 연구 및 참고 목적이며 특정 종목이나 시장에 대한 투자를 권유하지 않습니다.
          모든 투자 판단과 그에 따른 책임은 투자자 본인에게 있습니다.
        </div>

        <div className="researchNav">
          <a href="/research" className="researchNavBack">← 리서치 목록으로</a>
        </div>
      </main>
    </div>
  );
}
