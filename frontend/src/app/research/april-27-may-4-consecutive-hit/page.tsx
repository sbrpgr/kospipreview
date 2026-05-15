import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "4월 27일~5월 4일: 연속 적중 구간은 무엇이 달랐나";
const PAGE_DESCRIPTION =
  "13일 연속 밴드 이탈 이후 5거래일 중 4적중으로 모델 성능이 회복된 구간의 시장 조건을 데이터로 분석합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/april-27-may-4-consecutive-hit" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/april-27-may-4-consecutive-hit"),
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
            2026년 4월 9일부터 23일까지 13거래일 연속 밴드를 벗어난 모델이
            4월 27일부터 5월 4일까지 5거래일 중 4거래일 밴드 적중으로 빠르게 회복했다.
            무엇이 달라졌는지 실측 데이터로 분석한다.
          </p>
        </div>

        <h3>1. 5거래일 실측 기록</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>날짜</th><th>예측</th><th>밴드</th><th>실제 시초가</th><th>결과</th></tr>
            </thead>
            <tbody>
              <tr className="researchTableHit"><td>2026-04-27</td><td>6,503</td><td>6,472 ~ 6,534</td><td>6,534</td><td>✓</td></tr>
              <tr className="researchTableHit"><td>2026-04-28</td><td>6,644</td><td>6,614 ~ 6,675</td><td>6,647</td><td>✓</td></tr>
              <tr className="researchTableHit"><td>2026-04-29</td><td>6,590</td><td>6,559 ~ 6,621</td><td>6,619</td><td>✓</td></tr>
              <tr><td>2026-04-30</td><td>6,700</td><td>6,669 ~ 6,731</td><td>6,739</td><td>✗</td></tr>
              <tr className="researchTableHit"><td>2026-05-04</td><td>6,771</td><td>6,740 ~ 6,801</td><td>6,783</td><td>✓</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          5거래일 중 4적중(80%). 4월 30일 하나를 제외하면 모두 밴드 안에 시초가가 들어왔다.
          4월 30일 이탈도 밴드 상단(6,731)에서 겨우 8.39포인트 위에서 열린 근접 미스였다.
          통계적으로 정상 범위 안의 이탈이었다.
        </p>

        <h3>2. 안정기의 특성: 충격 변수가 잠잠해진 구간</h3>
        <p>
          4월 27일 이후 구간에서 결정적으로 달라진 것은 외부 정치 변수의 예측 불가능성이
          낮아졌다는 점이다. 관세 협상의 1단계 윤곽이 나타나면서 시장의 일일 정책 리스크가
          줄어들었다. EWY와 달러-원 환율이 서로 상충하지 않고 같은 방향으로 움직이는
          구간이 늘어났다. 두 코어 신호가 같은 방향을 가리킬 때 모델의 신뢰도는 높아진다.
        </p>
        <p>
          VIX도 이 기간 동안 안정권으로 복귀했다. VIX가 낮을수록 EWY와 환율 신호의
          설명력이 높아지는 경향이 있다. 변동성이 낮은 구간에서 해외 지표가 코스피 시초가에
          미치는 영향이 더 일관적이고 예측 가능하다.
        </p>

        <h3>3. 4월 27일: 밴드 상단 정확히 적중</h3>
        <p>
          4월 27일 실제 시초가는 6,534포인트로, 예측 밴드 상단(6,533.88포인트)과
          0.12포인트 차이의 거의 완벽한 상단 적중이었다. 모델이 상방 압력을 충분히 반영하면서도
          밴드 범위 안에 들어온 사례다. 이날부터 모델이 새 안정 레짐을 포착하기 시작했다는
          신호로 볼 수 있다.
        </p>
        <p>
          4월 29일은 예측 6,590, 실제 6,619로 29포인트 차이로 밴드(6,559~6,621) 안 적중이었다.
          5월 4일은 예측 6,771, 실제 6,783으로 12포인트 차이의 정확한 예측이었다.
          이 세 날의 공통점은 EWY·환율 신호와 실제 시초가의 방향·크기가 정상적인 상관관계를
          유지했다는 점이다.
        </p>

        <h3>4. 4월 30일 이탈의 의미</h3>
        <p>
          4월 30일은 예측 밴드(6,669~6,731)보다 8.39포인트 위인 6,739포인트에서 열렸다.
          hit이 false로 기록되었지만, 이 이탈은 통계적으로 의미 있는 예측 실패가 아니다.
          밴드는 100% 보장 구간이 아니라 역사적 오차 분포를 기반으로 설정된 기대 범위다.
          밴드 상단에서 단 8포인트 위로 열렸다는 것은 모델의 방향과 대략적 크기가
          정확했다는 뜻이기도 하다.
        </p>

        <h3>5. 이 구간이 가르쳐주는 것</h3>
        <p>
          4월 27일~5월 4일 구간은 모델이 충격에서 얼마나 빠르게 회복할 수 있는지 보여준다.
          13거래일 연속 이탈 후 불과 며칠 만에 정상 적중률을 회복했다.
          모델 자체가 망가진 것이 아니라 전제 조건인 정상 레짐이 복원되면서 성능이 돌아온 것이다.
          이 패턴은 미래 충격 발생 시에도 동일하게 적용된다. 충격 레짐이 끝나고
          시장이 안정되면 모델의 성능도 회복된다. 중요한 것은 충격 구간과 안정 구간을
          구분해서 예측을 해석하는 것이다.
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
