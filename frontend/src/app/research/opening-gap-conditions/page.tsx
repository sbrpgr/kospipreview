import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "개장 갭이 큰 날의 조건 — 전일 종가와 크게 다르게 열리는 패턴";
const PAGE_DESCRIPTION =
  "코스피가 전일 종가 대비 큰 갭으로 열리는 날의 공통 조건을 실측 데이터에서 추출하고, 대형 갭이 예측에 미치는 영향을 분석합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/opening-gap-conditions" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/opening-gap-conditions"),
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
            <span className="researchCardTag">메커니즘</span>
            <span className="researchCardDate">2026-05-15</span>
          </div>
          <h2 className="sectionTitle">{PAGE_TITLE}</h2>
          <p className="researchArticleLead">
            2026년 4월 9일 코스피는 전일 대비 수백 포인트 아래에서 시초가가 형성되었다.
            4월 10일에는 반대로 급등 갭이 생겼다. 대형 갭이 발생하는 조건과 패턴을
            실측 데이터를 통해 분석하고, 갭 환경에서 예측을 어떻게 해석해야 하는지 설명한다.
          </p>
        </div>

        <h3>1. 개장 갭의 정의와 발생 빈도</h3>
        <p>
          개장 갭은 시초가가 전일 종가와 크게 차이 나는 현상이다.
          일반적으로 ±0.5% 이내는 일상적 변화로 보고, ±1% 이상이면 의미 있는 갭으로 구분한다.
          ±2% 이상의 대형 갭은 전체 거래일 기준 10~15% 수준에서 발생한다.
          이런 날은 전날 밤 미국 시장이나 정치 이벤트에서 시장을 크게 움직인 요인이 있었던 경우가 많다.
        </p>

        <h3>2. 대형 갭이 발생한 날의 실측 기록</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>날짜</th><th>모델 예측</th><th>밴드</th><th>실제 시초가</th><th>밴드 대비 오차</th></tr>
            </thead>
            <tbody>
              <tr><td>2026-04-09</td><td>6,090</td><td>6,054 ~ 6,127</td><td>5,826</td><td>−228 (하방 갭)</td></tr>
              <tr><td>2026-04-10</td><td>5,688</td><td>5,660 ~ 5,716</td><td>5,876</td><td>+160 (상방 갭)</td></tr>
              <tr><td>2026-04-21</td><td>6,106</td><td>6,078 ~ 6,134</td><td>6,303</td><td>+169 (상방 갭)</td></tr>
              <tr><td>2026-04-24</td><td>6,316</td><td>6,288 ~ 6,344</td><td>6,496</td><td>+152 (상방 갭)</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          이 날들의 공통점은 EWY나 환율 신호가 이례적으로 크게 움직였다는 것이다.
          4월 9일은 관세 충격으로 EWY가 급락했고, 4월 10일은 유예 발표로 급등했다.
          4월 21일과 24일은 회복 국면에서 EWY 상승 신호가 모델이 예상한 것보다
          강하게 시초가에 반영된 사례들이다.
        </p>

        <h3>3. 상방 갭과 하방 갭의 조건 차이</h3>
        <p>
          하방 갭(전일 종가보다 낮게 시작)은 주로 미국 시장 급락, 지정학 충격,
          예상치 못한 부정적 정책 발표가 있는 날에 발생한다. EWY가 크게 하락하고
          원화도 약세로 움직이는 두 신호가 같은 방향일 때 하방 갭이 크게 형성된다.
          4월 9일이 이 패턴의 전형이었다.
        </p>
        <p>
          상방 갭은 반대로 미국 증시 급등, 긍정적 정책 서프라이즈, 전날 과도한 하락의 기술적 반등이
          동시에 일어나는 날에 발생한다. 회복 국면에서 상방 갭이 연속적으로 나타나는 것(4/21, 4/24)은
          충격 이후 시장 심리가 빠르게 회복될 때 나타나는 패턴이다.
          비대칭적으로 하방 갭이 더 급격하고 상방 갭이 더 완만한 경향이 있다.
          공포는 탐욕보다 빠르게 작용한다는 시장 격언과 일치한다.
        </p>

        <h3>4. 대형 갭 이후 다음날 예측의 어려움</h3>
        <p>
          대형 갭이 발생한 직후 다음날 예측은 특히 어렵다.
          갭 당일 코스피 종가가 새로운 기준점이 되는데, 이 기준점이 모델이 학습한
          역사적 범위를 크게 벗어나 있는 경우가 많다. 4월 9일 하방 갭 이후
          4월 10일 예측이 5,688로 나온 것도, 전날 급락한 종가를 기준으로 산출되었기 때문이다.
        </p>
        <p>
          갭 이후 첫 1~3거래일은 모델이 새 기준점에 적응하는 기간이다.
          이 기간 예측 오차가 정상 구간보다 클 수 있다.
          MAE30d가 이 기간 급격히 높아지는 것이 이를 반영한다.
        </p>

        <h3>5. 갭 리스크를 예측 밴드에 반영하는 방법</h3>
        <p>
          갭 리스크는 예측 밴드에 자동으로 반영되지만, 시간차가 있다.
          갭이 발생하기 전에는 밴드가 정상 변동성 기준으로 좁게 설정되어 있다.
          갭이 발생한 이후에는 최근 오차가 커지면서 점차 밴드가 넓어진다.
          따라서 갭이 예상되는 날—대형 이벤트 전날, VIX 급등 구간—에는
          현재 밴드 너비에만 의존하지 않고 EWY·환율 신호의 크기 자체를 함께 보는 것이 중요하다.
          EWY+환율 단순환산과 모델 예측의 차이가 클수록 갭 발생 가능성이 높다.
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
