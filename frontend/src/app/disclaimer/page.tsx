import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const DISCLAIMER_TITLE = "면책 및 광고 고지";
const DISCLAIMER_DESCRIPTION =
  "KOSPI Dawn의 투자 면책, 광고 표시 원칙, 수익화 운영 기준을 안내합니다.";

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
          KOSPI Dawn은 코스피 시초가 예측과 시장 지표를 제공하는 정보 플랫폼이며, 본 페이지는 투자 판단 책임 범위와 광고
          운영 원칙을 명확히 고지하기 위해 작성되었습니다. 본 서비스의 예측값, 지표, 해설은 교육 및 정보 제공 목적이며
          특정 종목·ETF·파생상품의 매수 또는 매도를 직접 권유하지 않습니다.
        </p>

        <h3>1. 투자 면책</h3>
        <p>
          모든 예측값은 통계적 추정치입니다. 시장 이벤트, 정책 발표, 지정학 이슈, 유동성 급변 등으로 실제 시초가는 예측과
          다를 수 있습니다. 따라서 본 서비스 데이터만으로 투자 결정을 확정해서는 안 되며, 최종 판단과 그 결과에 대한 책임은
          사용자 본인에게 있습니다.
        </p>

        <h3>2. 광고 게재 원칙</h3>
        <p>
          본 사이트는 서비스 유지비용 충당을 위해 광고를 표시할 수 있습니다. 광고는 콘텐츠와 분리된 형태로 노출되며, 편집
          방향이나 예측 결과가 광고주 이해관계에 의해 변경되지 않도록 운영합니다. 광고 노출 여부와 무관하게 데이터 검증 및
          운영 정책은 동일하게 적용됩니다.
        </p>

        <h3>3. 제휴 및 스폰서 고지</h3>
        <p>
          제휴 또는 스폰서 콘텐츠가 포함되는 경우 이용자가 혼동하지 않도록 표시 기준을 적용합니다. 일반 데이터 카드, 예측
          결과, 운영 공지와 광고/제휴 콘텐츠를 시각적으로 구분하고, 필요한 경우 별도 고지 문구를 함께 제공합니다.
        </p>

        <h3>4. 데이터 출처와 시차</h3>
        <p>
          지표별로 갱신 주기가 다르기 때문에 화면 반영 시점이 서로 다를 수 있습니다. 이는 시스템 오류가 아니라 데이터 출처의
          제공 주기 차이로 발생할 수 있으며, 투자 판단 전에는 반드시 원출처 데이터를 확인해야 합니다. 본 서비스는 빠른
          반영을 지향하지만 실시간 체결 시스템을 대체하지 않습니다.
        </p>

        <h3>5. 책임 제한</h3>
        <p>
          운영자는 서비스 안정성과 데이터 품질 개선을 위해 합리적인 노력을 다하지만, 외부 데이터 제공 장애나 통신 문제로
          발생할 수 있는 지연·오표시·접속 제한에 대해 무제한 책임을 부담하지 않습니다. 사용자 손익, 기회비용, 간접 손실 등은
          법령이 허용하는 범위 내에서 책임이 제한될 수 있습니다.
        </p>
      </main>
    </div>
  );
}

