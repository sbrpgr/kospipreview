import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "세 가지 예측값을 함께 읽는 방법 — 수렴할 때와 발산할 때";
const PAGE_DESCRIPTION =
  "대시보드의 야간선물 단순환산, EWY+환율 환산, 모델 예측 세 값이 수렴·발산하는 경우 각각 어떻게 해석해야 하는지 안내합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/three-numbers-together" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/three-numbers-together"),
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
            <span className="researchCardTag">사용 가이드</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            코스피프리뷰 대시보드에는 야간선물 단순환산, EWY+환율 단순환산, 모델 예측 세 가지 숫자가 나란히 표시된다.
            2026년 5월 4일 기준으로 세 값은 6,862, 6,889, 6,903이었다—41포인트 범위 안의 수렴.
            이 세 숫자를 함께 읽는 방법과, 발산할 때 무엇을 의심해야 하는지 안내한다.
          </p>
        </div>

        <h3>1. 세 숫자가 각각 측정하는 것</h3>
        <p>
          야간선물 단순환산은 국내 KOSPI200 야간선물 시장의 시그널이다.
          전날 주간선물 종가 대비 야간선물이 얼마나 움직였는지를 코스피 지수에 기계적으로 환산한 값이다.
          EWY+환율 단순환산은 미국 시장 기반 시그널이다. 미국 프리마켓에서 EWY가 얼마나 움직이고
          달러-원 환율이 어떻게 변했는지를 코스피에 환산한 값이다.
          모델 예측은 EWY+환율 코어 신호를 Ridge 매핑으로 변환하고 트렌드팔로우 보정을 적용한 통계 추정값이다.
        </p>
        <p>
          세 값은 같은 다음날 코스피 시초가를 목표로 하지만,
          서로 다른 정보 소스와 방법론으로 계산된다. 그렇기 때문에 세 값이 수렴하면
          여러 다른 경로의 정보가 같은 방향을 가리킨다는 의미이고,
          발산하면 서로 다른 정보 소스가 충돌하고 있다는 신호다.
        </p>

        <h3>2. 수렴 구간: 신뢰도 높은 신호의 조건</h3>
        <p>
          2026년 5월 4일처럼 세 값이 50포인트 이내(6,862~6,903, 범위 41포인트)에 모이면
          수렴 상태다. 이 날은 야간선물, EWY+환율, 모델 세 경로 모두 코스피가
          소폭 하락할 것을 예상하고 있었다. 실제 시초가도 6,783으로 밴드(6,740~6,801) 안에 들어왔다.
        </p>
        <p>
          수렴은 안정 레짐의 특성이다. EWY와 환율이 안정적으로 움직이고,
          야간선물도 큰 이탈 없이 움직이는 날에 세 값은 자연스럽게 수렴한다.
          이런 날은 모델의 밴드 적중률이 백테스트 75% 수준에 근접할 가능성이 높다.
        </p>

        <h3>3. 발산 구간: 신호 충돌의 조건</h3>
        <p>
          4월 23일처럼 EWY+환율 단순환산이 6,889인데 모델 예측이 6,632인 경우,
          두 값의 차이가 257포인트나 된다. 이것은 발산 상태다.
          EWY 신호는 큰 상승을 가리키는데 모델 Ridge 변환은 그보다 훨씬 보수적인 수치를 내놓는 상황이다.
          실제 그날 시초가는 6,489로 두 값 모두를 크게 하회했다.
        </p>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>상태</th><th>세 값 최대 범위</th><th>의미</th></tr>
            </thead>
            <tbody>
              <tr className="researchTableHit"><td>강한 수렴</td><td>50pt 이내</td><td>신호 일치, 안정 레짐 가능성 높음</td></tr>
              <tr><td>보통</td><td>50~150pt</td><td>일부 불일치, 주의해서 해석</td></tr>
              <tr><td>발산</td><td>150pt 이상</td><td>신호 충돌, 대형 오차 가능성 있음</td></tr>
            </tbody>
          </table>
        </div>

        <h3>4. 야간선물이 null일 때</h3>
        <p>
          실측 기록에서 확인할 수 있듯이 야간선물 데이터가 없는 날이 많다.
          야간선물이 null이면 두 값(EWY+환율 단순환산, 모델 예측)만으로 판단해야 한다.
          이 경우 두 값의 방향이 같고 차이가 50포인트 이내면 상대적으로 안정적인 신호다.
          두 값이 다른 방향이거나 100포인트 이상 차이가 나면 불확실성이 높다.
        </p>

        <h3>5. 세 숫자를 한 줄로 요약하는 실전 방법</h3>
        <p>
          세 값을 확인할 때 다음 순서로 읽으면 효율적이다.
          첫째, 세 값이 모두 같은 방향(상승 또는 하락)인가.
          둘째, 세 값의 최대-최소 범위가 50포인트 이내인가.
          셋째, VIX가 안정 수준(20 이하)인가.
          셋 모두 해당하면 신뢰도 높은 신호 구간이다.
          하나라도 해당하지 않으면 예측 불확실성이 있다는 것을 인지하고 해석해야 한다.
          이 세 가지 점검이 예측을 읽기 전에 먼저 해야 할 컨텍스트 확인이다.
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
