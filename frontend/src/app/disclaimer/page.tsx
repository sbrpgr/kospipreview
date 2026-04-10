import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const DISCLAIMER_TITLE = "면책 및 광고 고지";
const DISCLAIMER_DESCRIPTION =
  "KOSPI Dawn의 연구 목적, 투자 면책, 광고 운영 원칙, 책임 제한 범위를 안내합니다.";

export const metadata: Metadata = {
  title: DISCLAIMER_TITLE,
  description: DISCLAIMER_DESCRIPTION,
  alternates: {
    canonical: "/disclaimer",
  },
  openGraph: {
    title: `${DISCLAIMER_TITLE} | ${SITE_NAME}`,
    description: DISCLAIMER_DESCRIPTION,
    url: toAbsoluteUrl("/disclaimer"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${DISCLAIMER_TITLE} | ${SITE_NAME}`,
    description: DISCLAIMER_DESCRIPTION,
  },
};

export default async function DisclaimerPage() {
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
        <h2 className="sectionTitle">면책 및 광고 고지</h2>
        <p>
          KOSPI Dawn은 퀀트급 금융 예측모델의 개발과 검증을 위해 운영되는 연구용 플랫폼입니다. 본 페이지는 서비스의 연구
          목적, 투자 면책, 광고 표시 원칙, 책임 제한 범위를 명확히 안내하기 위해 작성되었습니다. 사이트에 표시되는 예측값,
          지표, 단순환산치, 해설, 기록 비교는 모두 연구·학습·비교 검증을 위한 참고 자료이며, 특정 상품의 매수 또는 매도를
          직접 권유하지 않습니다.
        </p>

        <h3>1. 연구 목적 고지</h3>
        <p>
          본 사이트의 주된 목적은 다음 거래일 코스피 개장가 형성에 영향을 주는 해외 신호를 구조적으로 검증하고, 그 결과를
          실제 시초가와 비교해 모델 성능을 개선하는 것입니다. 따라서 서비스는 투자 자문보다는 공개 연구 및 모델 검증 환경에
          가깝습니다. 사용자는 화면에 표시되는 수치를 완성된 투자 신호가 아니라 연구 중인 분석 산출물로 이해해야 합니다.
        </p>

        <h3>2. 투자 판단 및 면책</h3>
        <p>
          모든 예측값은 통계적 추정치이며 실제 결과와 다를 수 있습니다. 정책 발표, 지정학 이슈, 개장 직전 유동성 변화,
          데이터 지연, 비정상 체결, 시장 충격 등은 모델이 완전하게 반영하지 못할 수 있습니다. 최종 투자 판단과 그에 따른
          책임은 전적으로 사용자 본인에게 있으며, 운영자는 본 사이트 수치에 대한 활용 결과를 보장하지 않습니다.
        </p>

        <h3>3. 야간선물 단순환산의 해석</h3>
        <p>
          사이트에 표시되는 야간선물 단순환산치는 직접적인 메인 서비스가 아니라 비교 검증용 기준선입니다. 이는 연구용 모델이
          전통적인 직접 지표와 비교해 어느 정도 설명력을 보이는지 확인하기 위한 도구이며, 그 자체가 독립적인 투자 신호나
          공식 추천값을 의미하지 않습니다. 사용자는 단순환산치와 모델 예측치를 모두 참고 자료로만 해석해야 합니다.
        </p>

        <h3>4. 데이터 출처와 시차</h3>
        <p>
          지표별로 데이터 출처와 갱신 주기가 다르므로 화면 반영 시점이 서로 다를 수 있습니다. 이는 시스템 오류가 아니라
          외부 데이터 구조 차이에서 발생할 수 있으며, 일부 지표는 장 종료 후 마지막 유효값이 유지될 수 있습니다. 실제 거래
          전에는 반드시 원출처 데이터와 실시간 체결 환경을 교차 확인하시기 바랍니다.
        </p>

        <h3>5. 광고 게재 및 수익화 원칙</h3>
        <p>
          본 사이트는 서비스 운영과 인프라 유지비 충당을 위해 광고를 표시할 수 있습니다. 광고는 콘텐츠와 구분된 형태로
          노출되며, 광고주 이해관계에 따라 예측값이나 운영 공지가 바뀌지 않도록 분리 원칙을 유지합니다. 광고가 존재하더라도
          연구 목적, 검증 원칙, 면책 구조는 동일하게 적용됩니다.
        </p>

        <h3>6. 책임 제한</h3>
        <p>
          운영자는 서비스 안정성과 데이터 품질 향상을 위해 합리적인 노력을 기울이지만, 외부 데이터 소스 장애, 네트워크 문제,
          반영 지연, 가격 오표시, 접속 불가, 캐시 지연 등으로 인해 발생할 수 있는 직접·간접 손실, 기회비용, 투자 손익에
          대해 책임을 지지 않습니다. 본 서비스를 이용한다는 것은 이러한 연구용·참고용 성격과 책임 제한 범위를 이해한 것으로
          봅니다.
        </p>
      </main>
    </div>
  );
}
