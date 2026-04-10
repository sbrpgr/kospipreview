import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const ABOUT_TITLE = "모델 설명";
const ABOUT_DESCRIPTION =
  "KOSPI Dawn의 퀀트투자모델 구조, 알고리즘 파이프라인, 검증 방식, 운영 철학을 안내합니다.";

export const metadata: Metadata = {
  title: ABOUT_TITLE,
  description: ABOUT_DESCRIPTION,
  alternates: {
    canonical: "/about",
  },
  openGraph: {
    title: `${ABOUT_TITLE} | ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
    url: toAbsoluteUrl("/about"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${ABOUT_TITLE} | ${SITE_NAME}`,
    description: ABOUT_DESCRIPTION,
  },
};

export default async function AboutPage() {
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
        <h2 className="sectionTitle">KOSPI Dawn 예측모델 안내</h2>
        <p>
          KOSPI Dawn은 다음 거래일 코스피 시초가를 연구하기 위해 만든 퀀트투자모델 연구환경입니다. 본 서비스의 핵심 목적은
          특정 방향을 단정적으로 제시하는 것이 아니라, 한국장 마감 이후 누적되는 해외 시장 정보를 구조적으로 읽어 개장가
          형성을 설명할 수 있는 모델을 개발하고 공개 검증하는 데 있습니다. 따라서 이 페이지는 단순 서비스 소개가 아니라,
          현재 어떤 수준의 로직과 알고리즘을 운영하고 있는지 설명하는 기술 개요에 가깝습니다.
        </p>

        <h3>1. 왜 이런 모델이 필요한가</h3>
        <p>
          한국시장 시초가는 장 마감 이후에도 계속 쌓이는 해외 변수의 영향을 받습니다. EWY, 환율, 반도체, 미국 지수, 금리,
          원자재, 변동성, 야간선물 참고값은 모두 서로 다른 층위의 정보를 주지만, 문제는 이 신호들이 동시에 움직일 때 사람이
          일관되게 해석하기 어렵다는 점입니다. KOSPI Dawn은 이 복잡한 정보를 하나의 퀀트형 예측 프레임 안에 넣고, 어떤
          신호가 실제 개장가 설명력에 기여했는지를 검증하기 위해 설계되었습니다.
        </p>

        <h3>2. 기준 시점 정렬과 로그수익률 레이어</h3>
        <p>
          현재 메인 엔진은 한국장 기준 시점을 먼저 맞춘 뒤 EWY와 USD/KRW를 코어 변수로 삼습니다. 이는 미국장 개장 시각
          자체보다 한국 투자자가 실제로 마주하는 기준선, 즉 한국장 마감 이후 해외에서 새롭게 누적된 변화에 더 집중하기 위한
          선택입니다. 이 과정에서 모델은 수익률을 단순 퍼센트가 아니라 로그수익률 계열로 정렬해 누적 오차를 줄이고, 기준선이
          섞이지 않도록 별도 스냅샷을 유지합니다. 이 단계만 보더라도 단순 사칙연산 수준을 넘어선 전처리 구조가 들어가 있습니다.
        </p>

        <h3>3. EWY+환율 코어와 합성 KOSPI200 레이어</h3>
        <p>
          코어 단계에서는 EWY와 환율을 통해 달러 기준 한국주식 바스켓 흐름을 원화 기준 신호로 환산하고, 이를 합성 KOSPI200
          흐름으로 바꿉니다. 여기서 끝나는 것이 아니라 최근 데이터에 더 높은 가중치를 두는 rolling ridge 계수로 EWY 민감도와
          환율 민감도를 계속 다시 추정합니다. 즉, 같은 EWY 상승이라도 환율 방향과 최근 시장 레짐에 따라 국내 개장가로
          번역되는 강도가 달라지도록 설계되어 있습니다.
        </p>

        <h3>4. 잔차 보정과 특징량 엔지니어링</h3>
        <p>
          코어 신호만으로 설명되지 않는 부분은 잔차 보정 레이어가 담당합니다. SOX, 미국 주요 지수, US10Y, WTI, Gold 같은
          보조 지표는 메인 방향을 임의로 뒤집는 용도가 아니라, EWY·환율 코어가 놓칠 수 있는 기술주 편향, 반도체 초과 강도,
          금리 충격, 원자재 리스크를 미세 조정하는 데 사용됩니다. 이 과정에서 S&P500, NASDAQ, Dow는 broad factor로 압축하고,
          기술주 초과 강도나 반도체 초과 강도 같은 별도 특징량을 만들어 투입합니다. 이는 단순히 지표를 많이 쓰는 것과는
          완전히 다른 수준의 특징량 설계입니다.
        </p>

        <h3>5. 야간선물과의 관계</h3>
        <p>
          KOSPI Dawn의 메인 예측값은 야간선물 단순추종 모델이 아닙니다. 사이트에 표시되는 야간선물 단순환산치는 별도 비교
          기준선이며, 현재 연구 목적은 야간선물을 직접 입력하지 않아도 EWY 코어 기반 모델이 얼마나 독립적인 설명력을 가질 수
          있는지를 검증하는 데 있습니다. 즉, 야간선물은 참고용이자 비교용이며, 서비스의 직접적인 핵심 산출물은 독립 예측모델
          자체입니다.
        </p>

        <h3>6. 안정화 장치와 예측 밴드</h3>
        <p>
          KOSPI Dawn은 보조지표가 성능 개선에 기여하지 못하면 자동으로 개입 강도를 줄이고, 최종 예측값이 과도하게 튀지 않도록
          완충 로직과 범위 제한을 둡니다. 여기에 최근 오차와 변동성을 반영한 예측 밴드를 함께 제시해, 숫자 하나가 아니라
          현재 모델이 어느 정도 불확실성을 보고 있는지도 같이 보여줍니다. 이는 자극적인 값을 뽑기보다 연구용 모델을 공개
          환경에서 안정적으로 검증하기 위한 장치입니다.
        </p>

        <h3>7. 검증 방식과 운영 철학</h3>
        <p>
          본 사이트는 단순 적중률만으로 모델을 평가하지 않습니다. 최근 실측 기록, 실제 시초가와의 거리, 예측 밴드의 안정성,
          야간선물 단순환산 대비 비교, 실시간 갱신의 일관성까지 함께 봅니다. 또한 배포 후에도 값이 실제로 갱신되고 기록이
          올바르게 반영되는지 운영 차원에서 검증합니다. 연구용 모델은 계산식만 좋아서는 안 되고, 공개 환경에서도 재현 가능한
          검증 루틴을 유지해야 하기 때문입니다.
        </p>

        <h3>8. 왜 단순 환산기가 아니라고 말할 수 있는가</h3>
        <p>
          현재 구조는 기준 시점 정렬, EWY+환율 코어, 합성 KOSPI200 레이어, 특징량 엔지니어링, 잔차 보정, 안정화, 라이브
          재연산, 최근 기록 검증까지 이어지는 다층 파이프라인입니다. 따라서 KOSPI Dawn은 지표 몇 개를 곱하고 빼는 수준의
          환산기가 아니라, 공개 데이터 위에서 퀀트투자모델을 실험하고 검증하고 고도화하는 리서치형 예측 엔진이라고 보는 편이
          맞습니다. 문의나 협업 관점에서도, 이 점이 이 플랫폼의 가장 중요한 차별점입니다.
        </p>

        <h3>9. 활용 한계와 사용자 책임</h3>
        <p>
          본 서비스의 예측값은 연구와 비교 검증을 위한 참고 자료입니다. 실제 시장은 뉴스, 정책 발표, 지정학 리스크, 유동성
          급변, 데이터 지연 등으로 언제든 달라질 수 있으며, 모델은 이를 완전하게 예측할 수 없습니다. 투자 및 활용 여부는
          사용자 스스로 판단해야 하며, 그에 따른 책임 역시 전적으로 사용자 본인에게 있습니다. KOSPI Dawn은 미래를 보장하는
          답안지가 아니라, 불확실한 시장을 구조적으로 읽기 위한 연구 도구입니다.
        </p>
      </main>
    </div>
  );
}
