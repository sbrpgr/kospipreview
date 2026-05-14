import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { getDataFreshness } from "@/lib/data";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "리서치";
const PAGE_DESCRIPTION =
  "KOSPI Dawn 퀀트 리서치 아카이브. 코스피 시초가 예측 모델을 운영하며 실제 데이터에서 발견한 인사이트를 정리합니다.";

export const metadata: Metadata = {
  title: `${PAGE_TITLE} | ${SITE_NAME}`,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: "/research" },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/research"),
    type: "website",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
};

const ARTICLES = [
  {
    href: "/research/model-in-volatile-markets",
    title: "통계모델은 왜 정치 충격에 취약한가",
    description:
      "2026년 4월 관세 쇼크 구간에서 모델이 13거래일 연속 밴드를 벗어난 이유를 실측 데이터로 분석합니다.",
    date: "2026-05-15",
    tag: "모델 분석",
  },
  {
    href: "/research/ewy-krw-core-signals",
    title: "EWY와 달러-원 환율이 코어 신호인 이유",
    description:
      "현재 모델에서 EWY 계수 0.3535, 환율 계수 0.2가 어떻게 도출되었고 왜 이 두 신호가 핵심인지를 실제 수치로 설명합니다.",
    date: "2026-05-15",
    tag: "알고리즘",
  },
  {
    href: "/research/reading-the-prediction-band",
    title: "예측 밴드를 어떻게 읽어야 하는가",
    description:
      "백테스트 75% 적중률과 최근 실측 기록의 차이를 구체적인 날짜별 데이터로 비교하고, 밴드를 올바르게 해석하는 방법을 안내합니다.",
    date: "2026-05-15",
    tag: "사용 가이드",
  },
] as const;

export default async function ResearchIndexPage() {
  const freshness = await getDataFreshness();
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <main>
        <h2 className="sectionTitle" style={{ marginBottom: "8px" }}>리서치</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "40px", fontSize: "0.97rem" }}>
          코스피 시초가 예측 모델을 실제로 운영하면서 데이터에서 발견한 인사이트를 정리합니다.
          백테스트 결과, 실측 기록, 모델 내부 수치를 바탕으로 한 분석이며 투자 조언이 아닙니다.
        </p>
        <div className="researchList">
          {ARTICLES.map((article) => (
            <a key={article.href} href={article.href} className="researchCard">
              <div className="researchCardMeta">
                <span className="researchCardTag">{article.tag}</span>
                <span className="researchCardDate">{article.date}</span>
              </div>
              <h3 className="researchCardTitle">{article.title}</h3>
              <p className="researchCardDesc">{article.description}</p>
            </a>
          ))}
        </div>
      </main>
    </div>
  );
}
