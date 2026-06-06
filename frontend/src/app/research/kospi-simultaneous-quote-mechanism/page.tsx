import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "코스피 동시호가 8분 — 시초가가 결정되는 구조";
const PAGE_DESCRIPTION =
  "KRX 동시호가 제도에서 09:00 시초가가 형성되는 과정을 설명하고, 이 구조가 왜 통계적 예측을 어렵게 만드는지 분석합니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/kospi-simultaneous-quote-mechanism" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/kospi-simultaneous-quote-mechanism"),
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
            코스피 시초가는 08:30부터 09:00까지 30분간 접수된 매수·매도 주문을
            09:00에 한꺼번에 체결하는 동시호가 방식으로 결정된다.
            이 구조를 이해하면 왜 전날 밤 해외 지표가 시초가에 완전히 반영되지 않는지,
            그리고 왜 예측이 어려운지를 더 잘 이해할 수 있다.
          </p>
        </div>

        <h3>1. 동시호가란 무엇인가</h3>
        <p>
          코스피 장중 거래는 연속매매 방식이다. 매수 주문이 들어오면 현재 최저 매도 호가와
          즉시 체결된다. 그러나 장 시작(09:00)과 장 마감(15:30)에는 동시호가 방식을 사용한다.
          동시호가는 일정 시간 주문을 모아놨다가 한 가격에 일괄 체결하는 방식이다.
          시초가는 이 동시호가의 첫 번째 결과다.
        </p>
        <p>
          09:00 동시호가의 주문 접수 시간은 08:30부터 09:00까지 30분이다.
          이 30분 동안 접수된 모든 매수·매도 주문을 가격 우선, 수량 우선 원칙으로
          한꺼번에 처리해 가장 많은 수량이 체결되는 단일 가격이 시초가가 된다.
          이 가격은 09:00 이전에는 확정되지 않는다.
        </p>

        <h3>2. 08:30~09:00: 주문이 쌓이는 구간</h3>
        <p>
          08:30부터 주문 접수가 시작되면, 전날 밤부터 아침까지 쌓인 정보가
          매수·매도 주문으로 표현되기 시작한다. EWY가 급등한 날에는 삼성전자·SK하이닉스
          매수 주문이 몰릴 것이고, 미국 증시가 급락한 날에는 매도 주문이 집중된다.
          이 주문들이 경쟁하면서 09:00 동시호가 체결 예상 가격이 실시간으로 변한다.
        </p>
        <p>
          코스피프리뷰의 예측은 09:00 이전 마지막 갱신을 기준으로 한다.
          따라서 08:30~09:00 구간에 새로운 정보가 들어와도 그 정보는 예측에 반영되지 않는다.
          이 시간대에 발표되는 경제지표나 기업 공시, 외신 뉴스 등은 예측값에 나타나지 않지만
          실제 시초가에는 반영될 수 있다.
        </p>

        <h3>3. 동시호가 체결 가격이 심리를 반영하는 방식</h3>
        <p>
          동시호가에서 결정되는 시초가는 단순히 전날 마감가 + 해외 지표 변화의 합산이 아니다.
          30분 동안 쌓인 수만 건의 매수·매도 주문이 경쟁한 결과다.
          여기에는 알고리즘 트레이딩, 외국인 프로그램 매매, 개인 투자자 주문,
          기관의 리밸런싱 주문이 모두 포함된다.
          각 참여자가 해외 정보를 어떻게 해석했는지가 주문 형태로 표현된다.
        </p>
        <p>
          EWY가 2% 올랐을 때 모든 참여자가 동일하게 "코스피도 2% 오를 것"이라고 판단하지 않는다.
          일부는 이미 선반영되었다고 보고, 일부는 추가 상승을 기대하며, 일부는 리스크를 줄이기 위해 매도한다.
          이 다양한 판단이 동시호가에서 경쟁하고, 그 결과가 시초가다.
          통계 모델은 이 복잡한 인간 행동 레이어를 완전히 포착할 수 없다.
        </p>

        <h3>4. 동시호가 구조가 예측을 어렵게 만드는 이유</h3>
        <p>
          EWY·환율 신호가 코스피 시초가에 영향을 주는 경로는 해외 지표 → 주문 → 동시호가 체결이다.
          신호와 실제 시초가 사이에 인간의 주문 행동이 개입한다.
          이 행동은 역사적 패턴을 따르는 경우가 많지만, 특수한 상황(정치 이벤트, 서프라이즈 뉴스,
          대형 기관 리밸런싱)에서는 역사적 패턴에서 크게 벗어난다.
          이것이 R² 23.49%, 즉 신호가 결과의 23%만 설명하는 이유다.
        </p>

        <h3>5. 이 구조를 알고 예측 밴드를 해석하는 방법</h3>
        <p>
          예측 밴드는 "EWY·환율 신호가 동시호가로 변환되는 과정의 역사적 오차 범위"라고 볼 수 있다.
          밴드가 좁다는 것은 신호가 동시호가를 통해 비교적 일관되게 코스피에 반영될 것으로
          기대된다는 뜻이다. 밴드가 넓다는 것은 이 변환 과정의 불확실성이 크다는 뜻이다.
          09:00 이전에 나오는 예측값이 실제 동시호가 결과와 차이가 날 수 있는 이유를
          이해하면, 예측을 더 현실적으로 활용할 수 있다.
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
