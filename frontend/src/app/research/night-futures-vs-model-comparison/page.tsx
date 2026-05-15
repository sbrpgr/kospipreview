import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "야간선물 단순환산 vs 모델 예측 — 두 숫자가 다를 때 무엇을 보는가";
const PAGE_DESCRIPTION =
  "대시보드의 야간선물 단순환산과 모델 예측이 각각 무엇을 측정하고, 두 값이 크게 다를 때 어떻게 해석해야 하는지 설명합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/night-futures-vs-model-comparison" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/night-futures-vs-model-comparison"),
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
            <span className="researchCardTag">지표 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            KOSPI Dawn 대시보드에는 세 가지 숫자가 나란히 표시된다. 2026년 5월 4일 기준으로
            야간선물 단순환산 6,862, EWY+환율 단순환산 6,889, 모델 예측 6,903이었다.
            이 세 값이 무엇이 다르고, 차이가 클 때 어떻게 읽어야 하는지 설명한다.
          </p>
        </div>

        <h3>1. 야간선물 단순환산의 계산 구조</h3>
        <p>
          야간선물 단순환산(nightFuturesSimplePoint)은 다음 공식으로 계산된다.
          KOSPI 종가 × (KOSPI200 야간선물 / KOSPI200 주간선물 종가).
          이 계산은 순수하게 KOSPI200 야간선물이 주간선물 대비 얼마나 올랐는지를 기계적으로
          코스피 지수에 적용한 것이다. 어떤 통계 모델도, 회귀 계수도, EWY 신호도 들어가지 않는다.
        </p>
        <p>
          이 값의 의미는 "국내 선물 시장 참여자들이 주간 대비 야간에 얼마나 움직였는가"다.
          외국인보다 국내 시장 참여자들의 포지션을 더 직접적으로 반영한다.
          반면 미국 시장에서 EWY나 해외 지표가 어떻게 움직이는지는 반영하지 않는다.
        </p>

        <h3>2. EWY+환율 단순환산과의 차이</h3>
        <p>
          EWY+환율 단순환산(ewyFxSimplePoint)은 미국 프리마켓 EWY 움직임과 달러-원 환율 변화를
          로그수익률로 합산한 뒤 코스피 종가에 적용한다. 야간선물이 국내 시장 기반이라면
          EWY+환율은 미국 시장 기반이다. 같은 밤 시간대 정보를 서로 다른 창구로 읽는다.
        </p>
        <p>
          두 값이 같은 방향이면 국내 선물 시장과 미국 EWY 시장이 같은 신호를 주고 있다는 뜻이다.
          두 값이 다른 방향이면 국내와 해외 투자자들이 같은 정보를 다르게 해석하고 있다는 신호다.
          이 경우 어느 쪽이 맞을지 판단하기 어렵고, 예측 불확실성이 높아진다.
        </p>

        <h3>3. 모델 예측이 두 단순환산과 다른 이유</h3>
        <p>
          모델 예측(pointPrediction)은 EWY+환율 코어 신호를 Ridge 매핑으로 변환하고,
          트렌드팔로우 플로어와 잔차 보정(현재 비활성)을 거친 값이다.
          단순환산이 신호를 그대로 적용하는 반면, 모델은 역사적 관계를 통해 변환한다.
          2026년 5월 4일의 경우 야간선물 6,862, EWY+환율 6,889, 모델 6,903으로
          세 값 모두 같은 방향(하락)이었고 범위는 41포인트에 불과했다. 수렴 상태였다.
        </p>

        <h3>4. 세 값이 수렴할 때와 발산할 때</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>상태</th><th>세 값의 범위</th><th>해석</th></tr>
            </thead>
            <tbody>
              <tr className="researchTableHit"><td>수렴</td><td>50포인트 이내</td><td>신호 일치 — 비교적 신뢰도 높은 구간</td></tr>
              <tr><td>중간</td><td>50~150포인트</td><td>일부 신호 불일치 — 주의 필요</td></tr>
              <tr><td>발산</td><td>150포인트 이상</td><td>신호 충돌 — 예측 불확실성 높음</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          4월 23일의 극단적 발산 사례에서 EWY+환율 단순환산이 6,889였고
          모델 예측이 6,632였다. 두 값의 차이가 257포인트였다.
          이 발산 자체가 그날 예측이 매우 불안정한 상태임을 나타내는 신호였다.
          결과적으로 실제 시초가 6,489는 두 값 모두를 크게 하회했다.
        </p>

        <h3>5. 야간선물 데이터가 없을 때</h3>
        <p>
          실측 기록(history.json)을 보면 nightFuturesSimpleOpen이 null인 날이 많다.
          야간선물 데이터가 없거나 신뢰할 수 없는 상태일 때다. 이 경우
          EWY+환율 단순환산과 모델 예측 두 값만으로 판단해야 한다.
          두 값이 같은 방향이고 50포인트 이내 수렴이면 상대적으로 안정적인 신호 구간이다.
          두 값이 다른 방향이거나 100포인트 이상 차이면 예측 신뢰도가 낮다고 보는 것이 맞다.
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
