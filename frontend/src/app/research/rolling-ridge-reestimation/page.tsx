import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "롤링 180일 재추정 — 왜 어제의 계수와 오늘이 다른가";
const PAGE_DESCRIPTION =
  "EWY 계수와 환율 계수를 매일 롤링 윈도우로 재추정하는 이유와 Ridge 정규화의 역할을 실제 파라미터로 설명합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/rolling-ridge-reestimation" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/rolling-ridge-reestimation"),
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
            코스피프리뷰의 EWY 계수(현재 0.3535)와 환율 계수(현재 0.20)는 고정값이 아니다.
            매 예측 사이클마다 최근 180거래일 데이터로 다시 추정된다.
            왜 고정 계수를 쓰지 않는지, Ridge 정규화가 무엇을 막는지 설명한다.
          </p>
        </div>

        <h3>1. 고정 계수 모델의 한계</h3>
        <p>
          EWY와 코스피의 관계는 시장 레짐에 따라 달라진다. 반도체 업황이 호황일 때
          EWY 1% 움직임이 코스피에 미치는 영향은 다운사이클 구간과 다르다.
          원-달러 환율이 1,200원대일 때의 환율 민감도와 1,400원대일 때도 차이가 있다.
          한 번 추정하고 고정하는 방식은 이런 레짐 변화를 따라가지 못한다.
          과거 5년 전 데이터로 추정한 계수가 현재 시장에 맞지 않을 수 있다.
        </p>
        <p>
          이 문제를 해결하는 방법은 계수를 주기적으로 다시 추정하는 것이다.
          코스피프리뷰는 예측 사이클마다 직전 180거래일(약 9개월) 데이터를 사용해
          EWY와 환율의 계수를 다시 계산한다. 이를 롤링 윈도우 재추정이라고 한다.
          오래된 데이터는 자동으로 제외되고, 최근 시장 성격이 반영된 계수로 예측이 이루어진다.
        </p>

        <h3>2. 롤링 180거래일의 의미</h3>
        <p>
          180거래일은 약 9개월에 해당한다. 너무 짧으면 최근 노이즈에 과도하게 반응하고,
          너무 길면 시장 레짐 변화를 제때 반영하지 못한다. 180일은 이 두 가지 위험을
          절충한 선택이다. 현재 이 파라미터로 추정된 EWY 계수는 0.3535이고,
          환율 계수는 0.20이며, 모델 적합 R²는 0.2349, 적합 MAE는 1.0802다.
        </p>
        <p>
          K200 매핑 레이어(합성 KOSPI200 수익률을 실제 코스피 시초가 수익률로 변환하는 단계)는
          별도로 240거래일 윈도우를 사용한다. 현재 K200 매핑 beta는 0.317698이고
          intercept는 0.255767이다. EWY+환율 레이어보다 더 긴 윈도우를 사용하는 이유는
          KOSPI200과 KOSPI의 관계가 EWY-코스피 관계보다 더 구조적으로 안정적이기 때문이다.
        </p>

        <h3>3. Ridge 정규화: 과적합 없이 재추정하는 방법</h3>
        <p>
          단순 OLS(최소제곱법)로 롤링 재추정을 하면 문제가 생긴다.
          최근 180일 안에 이례적인 구간이 포함되면 계수가 그 구간에 과적합하여
          극단적으로 크거나 불안정한 값을 가질 수 있다. 4월 충격 기간처럼
          EWY가 5% 이상 움직이는 날들이 연속될 때 OLS 계수는 크게 왜곡될 수 있다.
        </p>
        <p>
          Ridge 정규화는 계수의 제곱합에 페널티를 부여해 계수가 지나치게 큰 값으로
          추정되는 것을 막는다. 이 덕분에 최근 데이터에 과도하게 반응하지 않으면서도
          레짐 변화를 반영하는 균형 잡힌 계수를 얻을 수 있다.
          현재 EWY 계수 0.3535와 환율 계수 0.20은 이 Ridge 제약 하에서
          최근 180거래일 데이터가 선택한 값이다.
        </p>

        <h3>4. 실제로 계수가 얼마나 변하는가</h3>
        <p>
          롤링 재추정에서 계수는 매일 미세하게 바뀐다. 정상 레짐에서는 변화가 크지 않아
          전일 대비 소수점 셋째 자리 수준의 차이가 나는 경우가 많다.
          그러나 레짐이 크게 바뀌는 구간—원화가 급격히 약세로 전환되거나
          EWY와 코스피의 동조화 강도가 달라지는 시기—에는 계수가 눈에 띄게 이동한다.
          예를 들어 관세 충격 이후 원화 약세가 심화되면 환율 계수가 이전보다
          상향 조정될 수 있다.
        </p>
        <p>
          이 변화는 사용자 입장에서는 보이지 않는다. 그러나 예측 JSON에서
          `ewyFxEwyCoef`, `ewyFxKrwCoef`, `ewyFxFitR2` 값을 매일 확인하면
          모델이 현재 시장을 어떻게 읽고 있는지 간접적으로 파악할 수 있다.
          R²가 낮아지면 EWY+환율 신호의 현재 설명력이 떨어지고 있다는 신호다.
        </p>

        <h3>5. 롤링 재추정이 완전한 해결책이 아닌 이유</h3>
        <p>
          롤링 재추정은 정상 레짐 변화에는 잘 대응하지만,
          4월 관세 충격처럼 단기간에 전례 없는 크기의 충격이 오는 경우에는 한계가 있다.
          충격이 시작된 직후에는 180일 윈도우 안에 아직 충격 이전 데이터가 대부분이므로
          계수가 새 레짐에 완전히 적응하지 못한 상태다. 충격이 끝나고 시간이 지나면서
          점차 새 레짐 데이터 비중이 높아지고, 계수도 새 시장 성격을 반영하게 된다.
          이 적응 지연이 충격 구간 직후 예측 오차가 큰 이유 중 하나다.
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
