import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "VIX 임계값과 시초가 변동성 — 18, 25, 30 구간별 패턴";
const PAGE_DESCRIPTION =
  "공포지수 VIX 수준에 따라 코스피 시초가 예측의 불확실성이 어떻게 달라지는지 구간별로 분석합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/vix-thresholds-and-volatility" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/vix-thresholds-and-volatility"),
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
            VIX는 S&P 500 옵션 시장이 향후 30일 변동성을 어떻게 보는지를 나타낸다.
            2026년 5월 기준 VIX는 18.39로 안정 구간이다. 그런데 4월 충격 기간에는 30대까지 올랐다.
            VIX 수준이 코스피 시초가 예측 불확실성과 어떻게 연결되는지 분석한다.
          </p>
        </div>

        <h3>1. VIX란 무엇이며 왜 주목하는가</h3>
        <p>
          CBOE Volatility Index(VIX)는 S&P 500 옵션의 내재 변동성을 지수화한 것이다.
          시장 참여자들이 향후 30일간 S&P 500이 얼마나 크게 움직일 것으로 예상하는지를
          가격으로 반영한 결과다. VIX가 높다는 것은 불확실성이 크다는 시장 합의를 의미하며,
          공포지수라고 불리는 이유다.
        </p>
        <p>
          코스피 시초가 예측에서 VIX가 중요한 이유는 두 가지다.
          첫째, VIX가 높을수록 EWY와 환율 신호의 크기 자체가 커져 예측값의 불확실성도 커진다.
          둘째, 극단적 공포 구간에서는 정상적인 신호-반응 관계가 깨져 모델의
          역사적 계수가 현재 시장에 맞지 않게 된다.
        </p>

        <h3>2. VIX 20 이하: 안정 구간의 예측 특성</h3>
        <p>
          VIX 20 이하는 역사적으로 정상 변동성 구간이다. 2026년 5월 기준 VIX 18.39는
          이 안정 구간에 해당한다. 이 수준에서는 EWY와 환율 신호가 비교적 안정적으로 움직이고,
          신호와 코스피 시초가의 역사적 관계가 유지될 가능성이 높다.
          코스피프리뷰의 백테스트 75.26% 밴드 적중률은 대부분 이 안정 구간에서 달성된 수치다.
        </p>
        <p>
          VIX 18~20 수준에서는 예측 밴드 너비도 상대적으로 좁게 형성된다.
          최근 오차 분포가 작으므로 밴드도 타이트해진다. 이런 구간에서 밴드 이탈이 발생하면
          예상치 못한 이벤트가 있었다는 신호일 수 있다.
        </p>

        <h3>3. VIX 25~30: 경계 구간</h3>
        <p>
          VIX 25를 넘으면 시장이 정상 레짐에서 벗어나고 있다는 신호다.
          이 구간에서는 EWY의 일일 변동폭 자체가 커지고, 환율도 더 빠르게 움직이는 경향이 있다.
          예측 밴드 너비는 최근 오차가 반영되어 넓어지기 시작한다.
          50~60포인트 수준이던 밴드가 80포인트 이상으로 넓어질 수 있다.
        </p>
        <p>
          이 구간에서 밴드 이탈 빈도도 올라간다. 정상 레짐의 75% 적중률이 60~65%대로
          하락하는 경향이 관찰된다. 그렇더라도 VIX 25~30 구간은 아직 모델이 방향성에서는
          의미 있는 신호를 제공할 수 있는 범위 안에 있다.
        </p>

        <h3>4. VIX 30 이상: 극단 구간과 모델 한계</h3>
        <p>
          2026년 4월 관세 충격 기간, VIX는 30대 초반까지 급등했다.
          이 기간 코스피프리뷰의 밴드 적중률은 0%(13거래일 연속 이탈)였다.
          VIX 30 이상 극단 구간에서는 시장 자체의 방향 예측이 어려워지고,
          하루하루 정치·정책 변수에 의해 방향이 바뀌는 상황이 지속된다.
          이 구간에서 통계 모델의 역사적 계수는 현재 시장과 관계없는 값이 된다.
        </p>
        <p>
          VIX 30 이상에서는 예측 밴드를 단순한 참고 범위로만 보고,
          그 외부의 시나리오 가능성도 함께 열어두어야 한다.
          이 구간이 얼마나 지속될지는 VIX가 다시 20대 아래로 복귀하는 시점을 보면 알 수 있다.
        </p>

        <h3>5. VIX를 예측 해석의 컨텍스트로 활용하는 방법</h3>
        <p>
          코스피프리뷰 대시보드의 signalSummary에는 VIX 상승·하락 여부가 표시된다.
          2026년 5월 4일 기준 "VIX 상승(불안)"이라는 문구가 포함되어 있었다.
          이는 절대적으로 높지는 않지만(18.39) 직전보다 상승한 상태임을 알려준다.
          이 맥락 정보를 예측값과 함께 보면 현재 모델의 컨디션을 더 정확히 파악할 수 있다.
          VIX가 낮고 안정적인 날의 예측과 VIX가 높아지는 날의 예측은
          같은 밴드 너비여도 다르게 해석해야 한다.
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
