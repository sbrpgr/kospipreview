import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "EWY가 올랐는데 코스피가 내린 날 — 달러-원화 괴리의 조건";
const PAGE_DESCRIPTION =
  "EWY 신호는 상승이었지만 코스피 시초가가 하락한 날의 구조를 환율 역전과 수급 관점에서 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/ewy-up-kospi-down-divergence" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/ewy-up-kospi-down-divergence"),
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
      <main className="prose">
        <div className="researchArticleHeader">
          <div className="researchArticleMeta">
            <span className="researchCardTag">사례 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            2026년 4월 23일, EWY+환율 단순환산은 6,889포인트를 가리켰다.
            그러나 실제 코스피 시초가는 6,489포인트로 약 400포인트 낮게 열렸다.
            EWY 신호가 상승을 가리켰는데 시장은 반대로 움직인 이 날의 원인을 분석한다.
          </p>
        </div>

        <h3>1. EWY 상승이 코스피 상승을 보장하지 않는 이유</h3>
        <p>
          EWY는 달러 기준으로 거래되는 한국 주식 ETF다. EWY가 오르면 달러 기준으로
          한국 주식 바스켓의 가치가 상승했다는 뜻이다. 그러나 코스피는 원화 기준이다.
          EWY가 달러로 2% 올랐더라도 같은 시간 원화가 2% 약세가 되면
          원화 기준 한국 주식 가치는 변하지 않는다. 두 신호가 방향이 같더라도
          크기가 서로 상쇄하면 코스피 시초가에 미치는 순효과는 작아진다.
        </p>
        <p>
          4월 23일의 경우는 이 상쇄를 넘어서는 추가 요인이 있었다.
          EWY+환율 단순환산이 6,889로 매우 높은 수치를 나타냈음에도,
          실제 동시호가에서 코스피는 6,489에 시초가를 형성했다.
          400포인트의 괴리는 EWY-환율 복합 신호만으로는 설명되지 않는 부분이다.
        </p>

        <h3>2. 외국인 헤지 포지션이 동시호가에 미치는 영향</h3>
        <p>
          달러 기반 투자자들이 한국 주식에 투자할 때 환율 리스크를 헤지하기 위해
          EWY를 달러로 매수하면서 동시에 코스피 선물이나 현물을 원화로 매도하는
          전략을 사용할 수 있다. 이 헤지 포지션이 대규모로 청산될 때
          코스피 현물 매도 압력이 집중적으로 나타난다.
        </p>
        <p>
          4월 23일처럼 전날 시장이 혼란스러운 상황에서 다음날 반등이 기대될 때,
          일부 투자자들이 보유한 헤지 포지션을 청산하는 과정에서 EWY 매수와
          코스피 현물 매도가 동시에 일어날 수 있다. EWY는 올라가지만
          코스피 현물이 눌리는 패턴이 이때 나타난다.
        </p>

        <h3>3. 4월 20일 케이스: 두 번째 괴리 사례</h3>
        <p>
          4월 23일만이 아니다. 4월 20일에도 비슷한 패턴이 있었다.
          EWY+환율 단순환산은 6,413포인트였지만 실제 시초가는 6,214포인트로 열렸다.
          199포인트 차이였다. 모델 예측(6,343)도 실제보다 높았다.
          이틀 모두 EWY·환율 신호가 실제 시초가보다 상당히 높은 값을 가리켰다.
        </p>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>날짜</th><th>EWY+환율 환산</th><th>모델 예측</th><th>실제 시초가</th><th>신호-실제 괴리</th></tr>
            </thead>
            <tbody>
              <tr><td>2026-04-20</td><td>6,413</td><td>6,343</td><td>6,214</td><td>−199</td></tr>
              <tr><td>2026-04-23</td><td>6,889</td><td>6,632</td><td>6,489</td><td>−400</td></tr>
            </tbody>
          </table>
        </div>

        <h3>4. 두 신호가 크게 엇갈릴 때 예측을 해석하는 법</h3>
        <p>
          EWY+환율 단순환산과 모델 예측이 크게 다른 날은 주의가 필요하다.
          4월 23일처럼 단순환산이 6,889이고 모델이 6,632였다면
          두 값의 차이가 257포인트나 된다는 것 자체가 신호의 불안정성을 나타낸다.
          이런 경우 대형 오차의 가능성이 있으며, 어느 방향으로 오차가 날지도 예측하기 어렵다.
        </p>
        <p>
          반면 세 가지 예측값(야간선물 단순환산, EWY+환율 단순환산, 모델 예측)이
          50포인트 이내에서 수렴할 때는 신뢰도가 높은 구간이다.
          4월 23일의 두 값 차이 257포인트는 이미 신뢰도 경고 신호였다.
          이런 발산 상태를 파악하는 것이 예측을 활용하기 전에 선행되어야 할 점검이다.
        </p>

        <h3>5. EWY-코스피 괴리가 반복되는 조건</h3>
        <p>
          EWY 상승에도 코스피가 내리는 패턴은 대부분 두 가지 조건 중 하나에 해당한다.
          첫째, 원화가 동시에 강하게 약세로 이동해 달러 상승분을 원화로 환산할 때 상쇄되거나 역전되는 경우.
          둘째, 대규모 헤지 포지션 청산이나 기관 리밸런싱으로 코스피 현물에
          집중적인 매도 압력이 발생하는 경우. 두 조건 모두 EWY·환율 신호로는
          사전 감지가 어렵다. 이 한계가 모델 예측 오차의 불가피한 일부를 구성한다.
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
