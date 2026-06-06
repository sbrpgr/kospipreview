import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "4월 10일 케이스 — 관세 유예 발표에 모델이 188포인트 아래를 본 이유";
const PAGE_DESCRIPTION =
  "트럼프 90일 관세 유예 발표 당일, 모델이 실제 시초가보다 188포인트 낮게 예측한 구조적 이유를 분석합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/april-10-tariff-pause-case" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/april-10-tariff-pause-case"),
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
            2026년 4월 10일, 트럼프 행정부의 90일 관세 유예 발표로 코스피는 급등해 5,876포인트에 시초가를 형성했다.
            그날 코스피프리뷰 모델은 5,688포인트를 예측했다. 188포인트 오차가 발생한 구조적 원인을 분석한다.
          </p>
        </div>

        <h3>1. 4월 9일 충격 이후 모델이 처한 상황</h3>
        <p>
          4월 10일 예측을 이해하려면 전날인 4월 9일부터 시작해야 한다. 4월 9일,
          트럼프 행정부의 상호관세 발효 소식이 아시아 시장을 강타했다.
          EWY는 급락했고 모델 예측은 6,090포인트였지만 실제 시초가는 5,826포인트로 열렸다.
          263포인트 오차였다. 이날 코스피가 크게 하락하면서 새로운 기준선이 형성되었다.
        </p>
        <p>
          4월 10일 예측의 prevClose(이전 종가 기준)는 4월 9일의 낮아진 코스피 종가였다.
          EWY도 전날 급락한 수준에서 출발했다. 모델은 이 낮아진 기준점을 바탕으로
          5,688포인트를 예측했다. 밴드는 5,660~5,716포인트로 설정되었다.
        </p>

        <h3>2. 관세 유예 발표의 정보 도달 경로</h3>
        <p>
          트럼프 대통령의 90일 관세 유예 발표는 미국 시간 기준 새벽에 이루어졌다.
          한국 기준으로 4월 10일 새벽, 미국 프리마켓이 열리면서 EWY가 급등하기 시작했다.
          이 정보는 코스피프리뷰의 브릿지 샘플링(17:00 KST 전후, 2분 간격 5슬롯)을 통해
          모델에 반영되기 시작했다.
        </p>
        <p>
          그러나 EWY+환율 단순환산(ewyFxSimpleOpen)도 5,663포인트로 실제보다 낮게 나왔다.
          이는 EWY 자체의 반등 신호가 모델의 입력 기준 시점(KRX 15:30 기준)에서
          충분히 포착되지 않았거나, 반등의 속도가 브릿지 샘플링 시점보다
          더 빠르게 진행되었을 가능성을 시사한다.
        </p>

        <h3>3. 이틀 연속 반대 방향 오차의 구조</h3>
        <div className="researchDataTable">
          <table>
            <thead>
              <tr><th>날짜</th><th>모델 예측</th><th>EWY+환율 환산</th><th>실제 시초가</th><th>오차</th></tr>
            </thead>
            <tbody>
              <tr><td>2026-04-09</td><td>6,090</td><td>6,430</td><td>5,826</td><td>−264 (모델 과대)</td></tr>
              <tr><td>2026-04-10</td><td>5,688</td><td>5,663</td><td>5,876</td><td>+188 (모델 과소)</td></tr>
            </tbody>
          </table>
        </div>
        <p>
          4월 9일에는 모델이 실제보다 264포인트 위를 봤다. 4월 10일에는 188포인트 아래를 봤다.
          연속으로 반대 방향 오차가 난 것은 모델 자체의 결함이 아니라,
          하루 단위로 반전된 정책 결정이 만들어낸 결과다. 4월 9일 충격이 아니었다면
          4월 10일 유예 발표의 영향도 이만큼 크지 않았을 것이다.
        </p>

        <h3>4. 통계 모델이 즉각 대응할 수 없는 이유</h3>
        <p>
          롤링 180일 재추정 구조에서 4월 10일 예측 시점의 계수는 아직 충격 이전 데이터가
          대부분인 상태였다. 충격 당일(4월 9일) 하루치 데이터가 새로 추가되었지만
          180일 전체에서 하루의 비중은 크지 않다. 따라서 전날 급락을 반영한 낮은 기준선에서
          출발하면서도, 반등 가능성을 충분히 반영하지 못한 계수로 예측이 이루어졌다.
        </p>
        <p>
          이 사례가 보여주는 한계는 분명하다. 정책 발표 같은 이산적(discrete) 이벤트는
          EWY·환율 연속 신호로 포착되기 어렵다. 발표 직전과 직후의 EWY 수준 차이가
          모델의 정상 레짐 가정을 벗어나는 크기일 때, 통계 모델은 그 차이를
          완전히 흡수하지 못한다.
        </p>

        <h3>5. 이런 이벤트 전후 예측을 대하는 방법</h3>
        <p>
          대형 정책 발표가 예정된 구간에서는 예측 밴드를 보수적으로 해석하는 것이 맞다.
          4월 10일처럼 밴드가 5,660~5,716포인트로 좁게 설정되어 있더라도,
          이벤트 결과에 따라 그 범위를 크게 벗어날 수 있다는 가능성을 열어두어야 한다.
          트럼프 유예 발표처럼 예측 불가능한 방향 전환이 있는 날에는 밴드보다
          세 가지 예측값의 방향 일치 여부와 VIX 수준을 함께 확인하는 것이 더 유용하다.
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
