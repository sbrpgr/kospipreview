import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "예측 모델을 참고할 때 반드시 알아야 할 다섯 가지";
const PAGE_DESCRIPTION =
  "코스피프리뷰 예측값을 올바르게 활용하고 잘못 사용하지 않기 위한 다섯 가지 원칙을 정리합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/five-principles-for-using-forecast" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/five-principles-for-using-forecast"),
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
            코스피프리뷰는 코스피 시초가를 예측하는 퀀트 리서치 플랫폼이다.
            예측값을 잘못 해석하거나 과도하게 신뢰하면 예상치 못한 결과를 낳는다.
            이 리서치 아티클들을 통해 쌓은 데이터와 사례를 바탕으로,
            예측을 올바르게 참고하는 다섯 가지 원칙을 정리한다.
          </p>
        </div>

        <h3>1. 밴드는 보장 구간이 아니다</h3>
        <p>
          예측 밴드(rangeLow ~ rangeHigh)는 "이 범위 안에 반드시 시초가가 들어온다"는
          확정 구간이 아니다. 백테스트 1,462거래일 기준 밴드 적중률은 75.26%다.
          이는 4번 중 1번은 밴드를 벗어난다는 뜻이다.
          2026년 4월 관세 충격 기간에는 13거래일 연속 밴드를 벗어났다.
          충격 구간이 아닌 안정 레짐에서도 75%는 4번 중 3번이지, 4번 모두가 아니다.
        </p>
        <p>
          밴드를 "이 안에 들어오면 맞고 나오면 틀린다"는 이분법으로 보지 말고,
          "역사적 분포에서 이 범위 안에 들어올 가능성이 가장 높다"는 확률적 시나리오로 봐야 한다.
          밴드 상단보다 높게 열릴 수도, 하단보다 낮게 열릴 수도 있다는 여지를 항상 남겨두어야 한다.
        </p>

        <h3>2. MAE30d를 먼저 확인하라</h3>
        <p>
          대시보드에 표시되는 MAE30d(최근 30일 평균 절대 오차)는 현재 모델 컨디션의 실시간 지표다.
          2026년 5월 기준 MAE30d는 31.17포인트다. 이는 최근 30거래일 동안 예측과
          실제 시초가 사이의 평균 거리가 약 31포인트라는 뜻이다.
          4월 충격 기간이 포함되어 있어 높아진 상태다. 정상 레짐에서는 이 수치가 낮아진다.
        </p>
        <p>
          MAE30d가 50포인트를 넘는다면 현재 모델이 최근 시장을 잘 설명하지 못하는 상태다.
          이 경우 예측값에 대한 의존도를 낮추고, 불확실성이 큰 구간임을 인지해야 한다.
          반대로 MAE30d가 20포인트 미만이면 모델이 현재 시장과 잘 맞는 상태다.
          예측을 참고하기 전 MAE30d 확인을 습관화하는 것이 중요하다.
        </p>

        <h3>3. 정치·정책 이벤트 예정일에는 밴드 외부 시나리오를 준비하라</h3>
        <p>
          통계 모델이 가장 취약한 순간은 미국 연준 금리 결정, 무역 협상 발표,
          대형 지정학 이벤트처럼 시장의 방향 자체를 바꿀 수 있는 사건이 예정된 날이다.
          이런 이벤트의 결과는 역사적 데이터에서 학습되지 않은 새로운 상황일 수 있다.
          2026년 4월 관세 충격처럼 발표 결과가 연속으로 반전되면 모델은 연속 오차를 낼 수밖에 없다.
        </p>
        <p>
          이런 날에는 예측 밴드를 중심 시나리오로 보되, 이벤트 결과에 따라
          밴드 외부—상방 또는 하방—로 크게 벗어나는 시나리오를 미리 준비해야 한다.
          예측값이 시나리오의 전부라는 생각이 가장 위험한 착각이다.
        </p>

        <h3>4. 세 숫자 중 하나만 보지 마라</h3>
        <p>
          코스피프리뷰는 야간선물 단순환산, EWY+환율 단순환산, 모델 예측 세 값을 함께 제공한다.
          이 세 값을 비교하면 신호의 일치도와 불확실성을 판단할 수 있다.
          세 값이 50포인트 이내에서 수렴(2026-05-04: 6,862~6,903, 범위 41포인트)하면
          서로 다른 경로의 정보가 같은 방향을 가리키는 것이고,
          150포인트 이상 발산(4/23: EWY+환율 6,889 vs 모델 6,632, 차이 257포인트)하면
          신호가 충돌하는 구간이다.
        </p>
        <p>
          모델 예측값 하나만 보고 판단하면 정보의 절반 이상을 놓치는 셈이다.
          야간선물이 null이어도 EWY+환율과 모델 예측의 차이는 확인할 수 있다.
          이 차이가 클수록 예측 불확실성이 높다.
        </p>

        <h3>5. 예측값은 진입 타이밍이 아니라 방향과 범위 참고용이다</h3>
        <p>
          코스피프리뷰의 예측은 "내일 코스피가 6,900포인트에 정확히 시작할 것"을 주장하지 않는다.
          "현재 해외 지표 흐름에 근거하면 6,870~6,930 범위에서 개장할 가능성이 높다"는
          방향과 범위에 대한 연구 추정이다. 이를 특정 가격에서의 진입·청산 시그널로
          사용하는 것은 이 플랫폼의 설계 목적을 벗어난 활용이다.
        </p>
        <p>
          방향 적중률 76.53%는 6년치 데이터의 통계적 결과다. 특정 날이 그 76% 안에 드는지
          25% 밖에 드는지는 사전에 알 수 없다. 코스피프리뷰는 미래를 보장하는 답안지가 아니라,
          불확실한 시장을 구조적으로 읽기 위한 연구 도구다.
          이 도구를 올바르게 활용하는 것은 전적으로 사용자의 판단에 달려 있다.
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
