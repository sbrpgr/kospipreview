import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "잔차 모델이 자동으로 꺼지는 조건 — weight 0.0의 의미";
const PAGE_DESCRIPTION =
  "SOX, S&P 등 보조 신호로 구성된 잔차 보정 레이어가 자동 비활성화되는 로직과, 현재 비활성 상태인 이유를 설명합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/residual-model-auto-disable" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/residual-model-auto-disable"),
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
            <span className="researchCardTag">모델 분석</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            KOSPI Dawn 모델에는 SOX, S&P 500, VIX, 금리 등 보조 신호로 구성된 잔차 보정 레이어가 있다.
            그런데 2026년 5월 기준 이 레이어의 가중치는 0.0으로 자동 비활성 상태다.
            왜 꺼졌는지, 그리고 꺼진 상태에서 예측이 어떻게 달라지는지 설명한다.
          </p>
        </div>

        <h3>1. 잔차 보정 레이어란 무엇인가</h3>
        <p>
          EWY와 달러-원 환율은 코스피 시초가 변화의 약 23%(R² 0.2349)를 설명한다.
          나머지 77%는 다른 변수들이 담당하거나 설명되지 않는 잡음이다.
          잔차 보정 레이어는 이 설명되지 않는 부분을 보조 신호로 채우기 위해 설계되었다.
          구체적으로 SOX(반도체), S&P 500·NASDAQ·Dow를 압축한 광의 시장 팩터, 기술주 초과 강도,
          WTI, Gold, 미국 10년물 금리가 보조 신호로 사용된다.
        </p>
        <p>
          이 보조 신호들의 계수는 다음과 같이 추정되어 있다.
          반도체 초과 강도(semi_factor) -0.197388, 광의 시장 팩터(broad_factor) -0.066748,
          기술주 초과 강도(tech_factor) -0.088462, WTI 표준화값(wti_z) 0.459666,
          Gold 표준화값(gold_z) -0.233099, 미국 10년물 금리(us10y_z) 0.361520.
          계수 값은 추정되어 있지만 현재 이 레이어 전체의 가중치(weight)가 0.0이다.
        </p>

        <h3>2. 자동 비활성화 기준: coreMae vs fullMae</h3>
        <p>
          잔차 보정 레이어의 활성화 여부는 성능 기여 검증을 통해 자동으로 결정된다.
          핵심 비교 지표는 두 가지다. coreMae는 EWY+환율 코어만 사용했을 때의 평균 절대 오차이고,
          fullMae는 코어에 잔차 보정을 추가했을 때의 평균 절대 오차다.
          fullMae가 coreMae보다 작으면 보조 신호가 오차를 줄이는 데 기여한다는 뜻이다.
        </p>
        <p>
          2026년 5월 기준 수치를 보면, coreMae는 1.835876이고 fullMae는 1.578647이다.
          fullMae가 더 낮으므로 보조 신호들이 오차를 줄이는 것처럼 보인다.
          그러나 최근 검증 구간(관세 충격 전후)에서 실제 예측 성능 기여를 재평가한 결과
          weight가 0.0으로 설정되었다. 이는 장기 MAE 수치와 단기 실전 검증이 다를 수 있음을 보여준다.
        </p>

        <h3>3. 현재 비활성 상태의 실질적 의미</h3>
        <p>
          weight 0.0은 보조 신호들의 계수가 추정되어 있음에도 불구하고 최종 예측값에 반영되지 않는다는 뜻이다.
          현재 예측은 EWY+환율 코어 레이어와 K200 매핑 레이어만으로 계산된다.
          이는 모델이 단순해지는 대신 과적합 위험이 줄어드는 효과를 가진다.
          4월 충격 기간처럼 보조 신호들이 혼란스럽게 움직이는 구간에서는
          단순한 모델이 오히려 더 안정적인 결과를 낼 수 있다.
        </p>
        <p>
          비활성 상태라고 해서 잔차 모델이 삭제된 것은 아니다.
          계수 추정과 MAE 계산은 계속 이루어지고 있으며, 성능 기여가 확인되면
          weight가 자동으로 복원될 수 있다. 이 구조는 시장 레짐에 따라
          모델 복잡도를 자동으로 조절하는 적응형 설계다.
        </p>

        <h3>4. 보조 신호가 도움이 안 되는 레짐의 특성</h3>
        <p>
          SOX, S&P, VIX 같은 보조 신호들이 예측에 기여하지 못하는 구간에는 공통적인 특성이 있다.
          정치적 충격이나 정책 변화로 인해 신호들이 서로 다른 방향을 가리키거나,
          신호들 간의 역사적 상관관계가 일시적으로 깨지는 상황이다.
          2026년 4월 관세 쇼크 기간에는 VIX가 급등하면서 WTI도 급변하고 SOX도 이례적으로 움직였다.
          이런 상황에서 보조 신호들을 조합하면 노이즈가 증폭되는 결과를 낳는다.
        </p>
        <p>
          반면 정상 레짐—EWY와 환율이 안정적으로 움직이고, 보조 지표들이 역사적 상관관계를
          유지하는 구간—에서는 잔차 보정 레이어가 오차를 추가로 줄여줄 수 있다.
          현재 weight 0.0은 최근 레짐이 보조 신호 활용에 적합하지 않다는
          모델의 자동 판단 결과다.
        </p>

        <h3>5. 언제 다시 켜질 수 있는가</h3>
        <p>
          잔차 모델 재활성화의 선행 조건은 시장 레짐 안정화다.
          EWY·환율 신호와 보조 신호들 간의 역사적 관계가 다시 작동하기 시작하면,
          rolling 재추정 과정에서 fullMae가 coreMae를 지속적으로 하회하는 구간이 확인된다.
          이 경우 weight가 양수로 복원되며 보조 신호들이 다시 최종 예측에 반영된다.
          weight 복원 여부는 예측 JSON의 `mlResidualAdjPct` 값이 0에서 벗어나는 것으로 확인할 수 있다.
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
