import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "트렌드팔로우 플로어가 작동할 때 — 모델이 신호를 강제 반영하는 조건";
const PAGE_DESCRIPTION =
  "EWY+환율 신호가 크게 움직일 때 모델이 과소반응하지 않도록 강제하는 trendFollowFloor 로직을 실제 수치로 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/trend-follow-floor-explained" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/trend-follow-floor-explained"),
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
            모델이 EWY+환율 신호를 K200 매핑을 통해 변환할 때 신호를 과도하게 압축하는 문제가 있다.
            이를 막기 위해 트렌드팔로우 플로어가 작동한다. 2026년 5월 4일 예측에서
            trendFollowApplied가 true로 기록된 실제 사례를 통해 설명한다.
          </p>
        </div>

        <h3>1. K200 매핑이 과소반응하는 문제</h3>
        <p>
          EWY+환율 코어 신호는 합성 KOSPI200 수익률을 추정한다. 이 값을 실제 코스피 시초가
          수익률로 변환하는 단계가 K200 매핑이다. 현재 매핑 beta는 0.317698이다.
          이는 합성 K200 수익률 1%에 대해 코스피 시초가가 약 0.32% 움직인다는 뜻이다.
          이 변환 과정에서 문제가 생긴다. EWY+환율이 1% 이상 크게 움직일 때
          K200 매핑이 그 크기를 지나치게 압축해 최종 예측이 지나치게 보수적이 된다.
        </p>
        <p>
          실제 시장에서 EWY가 2% 급등하면 코스피 시초가도 그에 상응하는 규모로 올라가는 경향이 있다.
          그런데 K200 매핑만 적용하면 최종 예측 변화율이 너무 낮게 나와 실제 시초가와
          큰 괴리가 생길 수 있다. 트렌드팔로우 플로어는 이 과소반응을 막기 위해 도입된 장치다.
        </p>

        <h3>2. 트렌드팔로우 플로어의 작동 조건</h3>
        <p>
          플로어는 두 단계 트리거로 작동한다. EWY+환율 로그수익률 신호의 절대값이
          0.45% 이상이면 medium 트리거가 활성화되고, 최종 모델 예측이 그 신호의
          최소 70%를 반영하도록 강제한다. 신호가 2.0% 이상으로 커지면 high 트리거가 작동해
          최소 78%를 반영해야 한다. 단, 1회 조정 상한은 1.75%로 제한되어 있어
          극단적 신호에 의한 과도한 단일 조정을 막는다.
        </p>
        <p>
          이 구조는 신호 크기에 따라 플로어 강도가 높아지는 계단식 설계다.
          작은 신호(0.45% 미만)에는 플로어가 작동하지 않아 K200 매핑 결과를 그대로 사용한다.
          중간 신호(0.45~2.0%)에는 70% 플로어, 큰 신호(2.0% 이상)에는 78% 플로어가 적용된다.
        </p>

        <h3>3. 2026년 5월 4일 실제 적용 사례</h3>
        <p>
          2026년 5월 4일 예측에서 trendFollowApplied는 true였다.
          EWY+환율 복합 신호(trendFollowSignalPct)는 -0.69%로 medium 트리거(0.45%) 이상이었다.
          70% 플로어가 적용된 결과 최소 반영 하한(trendFollowMinPct)은 -0.48%로 설정되었다.
          실제 조정값(trendFollowAdjustmentPct)은 -0.59%로, 최소 하한보다 더 강하게 반영되었다.
          최종 예측 변화율(predictedChangePct)은 -0.48%로 기록되었다.
        </p>
        <p>
          이 사례에서 보듯, 트렌드팔로우 플로어가 작동할 때 최종 예측은 EWY+환율 신호의
          방향을 따라가되 K200 매핑이 압축하려는 크기를 일정 비율 이상 유지하도록 조정된다.
          EWY+환율이 -0.69% 신호를 냈을 때 모델 최종 예측이 -0.48% 이상을 반영하도록
          강제한 것이 이번 사례의 핵심이다.
        </p>

        <h3>4. 왜 100% 반영이 아닌가</h3>
        <p>
          EWY+환율 신호를 100% 반영하면 단순환산(ewyFxSimplePoint)과 동일해진다.
          모델이 존재하는 이유는 단순환산보다 정확한 예측을 제공하기 위함이다.
          70~78% 플로어는 과소반응을 막으면서도 K200 매핑과 잔차 보정이 제공하는
          구조적 정보를 일부 유지하는 균형점이다.
          완전히 EWY를 따라가면 단순환산이 되고, 너무 압축하면 신호를 무시하는 셈이 된다.
        </p>

        <h3>5. high 트리거(2.0%)가 켜지면</h3>
        <p>
          EWY+환율 신호가 2.0% 이상인 날은 시장에서 매우 이례적인 대형 이벤트가 있는 날이다.
          2026년 4월 관세 충격 기간이 대표적이다. 이 구간에서는 78% 플로어가 작동해
          신호의 78% 이상을 강제 반영한다. 그러나 1회 조정 상한 1.75%가 있어
          단일 예측 갱신에서 과도한 급변을 막는다. 결과적으로 대형 신호에도
          단계적으로 반영되는 구조를 유지한다.
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
