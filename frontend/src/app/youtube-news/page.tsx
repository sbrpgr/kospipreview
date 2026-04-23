import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { YoutubeNewsArchive } from "@/components/youtube-news-archive";
import { getDataFreshness } from "@/lib/data";
import { getYoutubeNewsIndex } from "@/lib/youtube-news";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const YOUTUBE_NEWS_TITLE = "유튜브 뉴스";
const YOUTUBE_NEWS_DESCRIPTION =
  "경제 유튜버 영상에서 추출한 시장 뉴스 요약과 일일 리포트 아카이브를 모아 볼 수 있습니다.";

export const metadata: Metadata = {
  title: YOUTUBE_NEWS_TITLE,
  description: YOUTUBE_NEWS_DESCRIPTION,
  alternates: {
    canonical: "/youtube-news",
  },
  openGraph: {
    title: `${YOUTUBE_NEWS_TITLE} | ${SITE_NAME}`,
    description: YOUTUBE_NEWS_DESCRIPTION,
    url: toAbsoluteUrl("/youtube-news"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${YOUTUBE_NEWS_TITLE} | ${SITE_NAME}`,
    description: YOUTUBE_NEWS_DESCRIPTION,
  },
};

export default async function YoutubeNewsPage() {
  const [freshness, newsIndex] = await Promise.all([getDataFreshness(), getYoutubeNewsIndex()]);
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${SITE_NAME} 유튜브 뉴스`,
    description: YOUTUBE_NEWS_DESCRIPTION,
    url: toAbsoluteUrl("/youtube-news"),
    inLanguage: "ko-KR",
  });

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <YoutubeNewsArchive initialIndex={newsIndex} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </div>
  );
}
