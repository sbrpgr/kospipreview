import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const TERMS_TITLE = "이용약관";
const TERMS_DESCRIPTION =
  "KOSPI Dawn 서비스의 무료 이용 원칙, 허용 범위, 금지 행위, 책임 제한에 관한 이용약관 안내입니다.";

export const metadata: Metadata = {
  title: TERMS_TITLE,
  description: TERMS_DESCRIPTION,
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: `${TERMS_TITLE} | ${SITE_NAME}`,
    description: TERMS_DESCRIPTION,
    url: toAbsoluteUrl("/terms"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${TERMS_TITLE} | ${SITE_NAME}`,
    description: TERMS_DESCRIPTION,
  },
};

export default async function TermsPage() {
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
        <h2 className="sectionTitle">이용약관</h2>
        <p>
          본 약관은 KOSPI Dawn 서비스의 이용 조건과 기본 원칙을 안내하기 위해 작성되었습니다. 본 서비스는 공개형
          연구·검증 플랫폼으로 운영되며, 사용자는 별도의 회원가입이나 유료 결제 없이 자유롭게 열람하고 참고할 수 있습니다.
          다만 무료 공개 서비스라고 해서 무제한 책임이나 무제한 권리를 의미하는 것은 아니므로, 서비스의 성격과 책임 범위를
          아래 기준에 따라 이해해 주시기 바랍니다.
        </p>

        <h3>1. 서비스의 성격</h3>
        <p>
          KOSPI Dawn은 다음 거래일 코스피 시초가를 연구하고 검증하기 위한 데이터 기반 플랫폼입니다. 화면에 표시되는 시장
          지표, 모델 예측값, 최근 실측 기록, 야간선물 단순환산은 모두 연구·비교 목적의 참고 자료이며, 특정 상품의 매수·매도
          또는 투자 수익을 보장하는 자문 서비스가 아닙니다.
        </p>

        <h3>2. 무료 이용 원칙</h3>
        <p>
          사용자는 본 서비스를 별도의 요금 없이 자유롭게 이용할 수 있습니다. 페이지 열람, 지표 확인, 예측값 확인, 공지·정책
          문서 열람은 모두 무료로 제공됩니다. 현재 기준으로 회원제, 유료 구독제, 유료 예측 해제 기능은 운영하지 않으며,
          일반 사용자는 공개된 웹페이지 범위 안에서 자유롭게 참고용으로 이용할 수 있습니다.
        </p>

        <h3>3. 허용되는 이용 범위</h3>
        <p>
          개인적인 시장 참고, 연구, 학습, 블로그·커뮤니티에서의 일반적인 인용, 서비스 품질 확인 목적의 열람은 허용됩니다.
          다만 인용 시에는 출처를 명확히 표시하는 것이 바람직하며, 본 서비스의 내용을 독자적인 공식 투자지표 또는 확정적
          추천 신호처럼 오해하게 만드는 방식의 재배포는 지양해야 합니다.
        </p>

        <h3>4. 금지되는 이용 행위</h3>
        <p>
          서비스 운영을 방해하는 과도한 자동 요청, 비정상적인 크롤링, 우회 접속, 보안 설정 무력화 시도, 광고 노출을 왜곡하는
          행위, 운영자를 사칭한 문의 또는 허위 신고, 법령에 위반되는 방식의 재배포는 금지됩니다. 또한 본 서비스의 수치를
          확정적 수익 보장 자료인 것처럼 판매하거나, 운영자와의 제휴·보증 관계가 있는 것처럼 표시하는 행위 역시 허용되지
          않습니다.
        </p>

        <h3>5. 낮 시간 운영에 대한 안내</h3>
        <p>
          본 플랫폼의 주 운영 구간은 한국장 마감 이후부터 다음 날 개장 전까지입니다. 따라서 낮 시간에는 장중 실시간 매매
          보조도구로 운영되지 않으며, 낮 시간에는 최근 실측 기록, 공지·모델 설명, 구조 이해를 위한 참고 자료로 활용하는
          것이 적합합니다. 장중 매매 판단은 공식 시세와 증권사 HTS/MTS를 우선 기준으로 삼아야 합니다.
        </p>

        <h3>6. 데이터와 예측값의 책임 제한</h3>
        <p>
          운영자는 서비스의 안정성과 데이터 품질을 높이기 위해 노력하지만, 외부 데이터 소스 지연, 시장 충격, 비정상 체결,
          네트워크 문제, 캐시 반영 지연, 모델 오차 등으로 인해 실제 결과와 차이가 발생할 수 있습니다. 따라서 사용자는 본
          서비스의 값을 참고 자료로만 활용해야 하며, 이를 근거로 한 투자 판단과 그 결과에 대한 책임은 전적으로 사용자
          본인에게 있습니다.
        </p>

        <h3>7. 광고 및 수익화</h3>
        <p>
          본 서비스에는 운영을 위한 광고가 포함될 수 있습니다. 광고의 존재는 예측값이나 정책 문서의 해석 기준을 바꾸지
          않으며, 광고 게재 여부와 무관하게 서비스의 연구 목적과 책임 제한 원칙은 동일하게 적용됩니다.
        </p>

        <h3>8. 약관의 변경</h3>
        <p>
          서비스 구조, 운영 정책, 법령, 광고 정책, 보안 정책의 변경에 따라 본 약관은 수정될 수 있습니다. 중요한 변경이
          있는 경우 사이트 내 공지 또는 관련 정책 페이지를 통해 반영되며, 변경 이후 서비스를 계속 이용하는 경우 변경된
          약관의 취지에 동의한 것으로 볼 수 있습니다.
        </p>
      </main>
    </div>
  );
}
