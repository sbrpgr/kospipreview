import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "한국장 마감 이후 정보 타임라인 — 15:30 KST에서 익일 09:00까지";
const PAGE_DESCRIPTION =
  "코스피 마감 이후 다음날 시초가까지 정보가 순서대로 쌓이는 타임라인과, 각 시점에서 KOSPI Dawn이 무엇을 처리하는지 설명합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research/information-timeline-1530-to-0900" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research/information-timeline-1530-to-0900"),
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
            코스피가 오후 3시 30분에 마감하고 다음날 오전 9시에 시초가가 형성되기까지
            약 17시간 30분 동안 정보가 단계적으로 쌓인다. KOSPI Dawn은 이 타임라인의
            각 시점에서 다른 데이터를 처리한다. 타임라인을 알면 현재 표시된 예측값이
            어떤 정보를 기반으로 하는지 이해할 수 있다.
          </p>
        </div>

        <h3>1. 15:30 KST: 한국장 마감과 기준선 설정</h3>
        <p>
          오후 3시 30분 코스피가 마감하면 KOSPI Dawn은 이 종가를 prevClose로 확정한다.
          이것이 다음날 예측의 기준점이 된다. 이 시점부터 EWY 예측 운영이 시작된다.
          그러나 EWY는 미국 시장 시간에 거래되므로 한국 시간 15:30에는 아직 거래 중이 아니다.
          미국 프리마켓이 열리는 한국 시간 17:00(서머타임)까지는 야간선물만 거래된다.
        </p>
        <p>
          15:30부터 17:00까지는 정보 공백 구간이다. 코스피는 닫혔고, EWY는 아직 거래 안 되며,
          야간선물만 움직이는 약 1시간 30분의 구간이다. 이 구간의 야간선물 움직임은
          참고값으로 표시되지만 모델의 메인 신호로 사용되지 않는다.
        </p>

        <h3>2. 15:45 KST: KOSPI200 주간선물 최종 확정</h3>
        <p>
          KOSPI200 주간선물의 최종 종가는 15:45 이후 eSignal 소켓 신호를 통해 확정된다.
          이 값이 야간선물 단순환산 공식의 분모(K200 주간선물 종가)에 사용된다.
          15:45 이전에 수집된 주간선물 값은 잠정치로 처리되고,
          15:45 이후 소켓 신호가 확인되면 최종값으로 고정된다.
          이 구분이 중요한 이유는 잠정 주간선물 값을 최종값으로 잘못 처리하면
          야간선물 단순환산이 틀어지기 때문이다.
        </p>

        <h3>3. 17:00 KST: 브릿지 샘플링과 EWY 기준점 설정</h3>
        <p>
          미국 서머타임 기준 한국 시간 17:00에 미국 프리마켓이 열리고 EWY 거래가 시작된다.
          KOSPI Dawn은 이 시점 전후 2분 간격으로 5개 슬롯을 샘플링해
          EWY와 환율의 기준점(브릿지 앵커)을 설정한다.
          이 앵커가 이후 모든 EWY 수익률 계산의 출발점이 된다.
          17:00 이후 EWY가 1% 올랐다는 계산은 이 앵커 대비 변화량이다.
        </p>
        <p>
          브릿지 샘플링이 한 번으로 제한되는 이유는 기준점을 고정해야 이후 변화를
          일관되게 측정할 수 있기 때문이다. 브릿지 앵커가 설정된 이후에는
          야간선물이 더 움직여도 브릿지 기준점이 바뀌지 않는다.
          한국 겨울시간에는 18:00에 미국 프리마켓이 열리고 브릿지 샘플링도 그에 맞춰 이루어진다.
        </p>

        <h3>4. 17:00~09:00: 분당 갱신 구간</h3>
        <p>
          브릿지 앵커가 설정된 이후부터 다음날 09:00까지 KOSPI Dawn은 분당 1회
          EWY와 환율 변화를 반영해 예측을 갱신한다. 최대 1,080개 관측값이 기록된다.
          이 구간에서 EWY가 추가로 움직이면 예측값도 분 단위로 변한다.
          대시보드의 "예측 추이" 차트가 이 분당 갱신 데이터를 시각화한다.
        </p>
        <p>
          따라서 같은 날이라도 새벽 2시에 본 예측값과 아침 8시에 본 예측값이 다를 수 있다.
          미국 장이 열리고 장중 이벤트가 있었다면, 그 정보가 반영된 최신 예측이 표시된다.
          예측을 참고할 때는 언제 갱신된 값인지(마지막 반영 시각)도 함께 확인하는 것이 좋다.
        </p>

        <h3>5. 09:00: 예측 대상 전환</h3>
        <p>
          09:00이 되면 당일 코스피 장이 열리고, 전날 예측 대상이었던 시초가는 확정된다.
          이 시점에서 예측 대상이 다음 거래일로 넘어간다.
          09:00~15:30 사이 장중 시간에는 모델이 비작동 구간에 들어가고,
          15:30 코스피 마감 이후 다시 새 사이클이 시작된다.
          이 타임라인을 이해하면 왜 KOSPI Dawn의 예측이 항상 "다음 거래일" 기준이며,
          정확히 어떤 시점의 정보를 담고 있는지 파악할 수 있다.
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
