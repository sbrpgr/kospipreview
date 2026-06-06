import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "4월 21~24일: 회복 구간에서 모델이 과소추정을 반복한 이유";
const PAGE_DESCRIPTION =
  "충격 이후 반등 구간에서 나흘 연속 실제 시초가가 예측 밴드 위에서 열린 패턴을 실측 데이터로 분석합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/april-recovery-underestimation" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/april-recovery-underestimation"),
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
            2026년 4월 21일부터 24일까지 코스피는 관세 충격 이후 반등 국면에 접어들었다.
            그런데 코스피프리뷰 모델은 이 4거래일 중 3일에서 실제 시초가를 크게 낮게 예측했고,
            하루는 반대로 크게 높게 예측했다. 이 불규칙한 오차 패턴의 이유를 분석한다.
          </p>
        </div>

        <h3>1. 충격 이후 회복 국면의 특성</h3>
        <p>
          대형 충격 이후 시장이 반등을 시작하는 구간은 통계 모델에게 특히 어렵다.
          충격 기간 동안 급락한 지수를 기준으로 EWY와 환율 계수가 설정되어 있는 상태에서,
          반등 신호가 들어오면 그 크기를 제대로 평가하기 어렵다.
          모델의 롤링 180일 윈도우 안에는 아직 충격 이전 정상 레짐 데이터가 대부분이라,
          반등 속도와 크기를 과소평가하는 경향이 나타난다.
        </p>

        <h3>2. 나흘간 실측 기록</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>날짜</th><th>모델 예측</th><th>EWY+환율 환산</th><th>실제 시초가</th><th>오차</th></tr>
            </thead>
            <tbody>
              <tr><td>2026-04-21</td><td>6,106</td><td>6,075</td><td>6,303</td><td>+196 (과소)</td></tr>
              <tr><td>2026-04-22</td><td>6,302</td><td>6,266</td><td>6,388</td><td>+85 (과소)</td></tr>
              <tr><td>2026-04-23</td><td>6,632</td><td>6,889</td><td>6,489</td><td>−143 (과대)</td></tr>
              <tr><td>2026-04-24</td><td>6,316</td><td>6,226</td><td>6,496</td><td>+180 (과소)</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          4월 21일과 22일은 모델이 실제보다 낮은 예측을 내놓았다. 196포인트, 85포인트 과소.
          반등 강도를 과소평가한 전형적 패턴이다. 그런데 4월 23일은 반전이 일어났다.
          모델과 EWY+환율 환산 모두 높은 값(각각 6,632, 6,889)을 예측했지만
          실제 시초가는 오히려 6,489포인트로 낮게 열렸다. 143포인트 과대 예측이었다.
          24일에는 다시 180포인트 과소 예측으로 돌아갔다.
        </p>

        <h3>3. 4월 23일의 역전 현상</h3>
        <p>
          4월 23일은 이 기간에서 가장 이해하기 어려운 날이다.
          EWY+환율 단순환산이 6,889포인트라는 큰 양의 신호를 보내고 있었는데
          실제 시초가는 6,489포인트로 400포인트나 낮게 열렸다.
          EWY 신호가 강하게 상승 방향을 가리켰음에도 불구하고 시장이 하락 방향으로 열린 것이다.
        </p>
        <p>
          이런 괴리는 외국인 투자자들의 국내 현물 매도와 헤지 포지션 청산이 동시에 일어날 때 발생한다.
          EWY를 달러 기준으로 매수하면서 동시에 코스피 현물을 원화 기준으로 매도하는 전략이
          동시호가에 집중될 경우, EWY 상승에도 불구하고 코스피 시초가는 낮게 형성된다.
          이 수급 정보는 EWY·환율 신호로는 포착되지 않는다.
        </p>

        <h3>4. 연속 과소추정이 반복되는 구조적 이유</h3>
        <p>
          21일, 22일, 24일의 연속 과소추정은 회복 국면에서 반등 속도가 모델의 예측 범위를
          지속적으로 초과하는 패턴을 보여준다. 모델의 EWY 계수(0.3535)와 K200 매핑 beta(0.317698)는
          정상 레짐에서 추정된 값이다. 충격 이후 반등 구간에서 시장 참여자들의 복귀 속도가
          정상 레짐보다 빠를 때, 이 계수들은 반등의 크기를 체계적으로 과소평가하는 경향을 보인다.
        </p>
        <p>
          이 기간의 MAE30d는 31.17포인트로, 4월 충격 기간 대비는 낮아졌지만
          여전히 정상 레짐 대비 높은 수준이었다. 회복 구간은 충격 구간과 다른 방식으로
          모델에 어려움을 준다. 충격 구간은 방향 자체가 불안정하지만,
          회복 구간은 방향은 맞아도 크기를 일관되게 과소평가하는 문제가 생긴다.
        </p>

        <h3>5. 회복 구간에서 예측 밴드를 읽는 방법</h3>
        <p>
          대형 충격 이후 첫 1~2주간의 반등 구간에서는 밴드 상단 초과 가능성을 더 열어두는 것이 합리적이다.
          이 기간 모델은 체계적으로 과소추정하는 경향을 보인다. 따라서 밴드 상단이 예측의
          최대치가 아니라 더 강한 반등이 올 수 있다는 가능성을 인지하고 해석해야 한다.
          4월 27일 이후 레짐이 안정화되면서 이 체계적 편향이 해소되기 시작했다.
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
