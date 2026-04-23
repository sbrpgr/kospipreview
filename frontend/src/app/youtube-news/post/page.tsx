import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/site-header";
import { YoutubeNewsPostViewer } from "@/components/youtube-news-post-viewer";
import { getDataFreshness } from "@/lib/data";
import { getYoutubeNewsIndex } from "@/lib/youtube-news";
import { SITE_NAME, toAbsoluteUrl } from "@/lib/seo";

const PAGE_TITLE = "유튜브 뉴스 게시글";
const PAGE_DESCRIPTION = "경제 유튜버 뉴스 게시글 상세입니다.";

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: {
    canonical: "/youtube-news/post",
  },
  openGraph: {
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
    url: toAbsoluteUrl("/youtube-news/post"),
    type: "article",
    locale: "ko_KR",
    siteName: SITE_NAME,
  },
  twitter: {
    card: "summary",
    title: `${PAGE_TITLE} | ${SITE_NAME}`,
    description: PAGE_DESCRIPTION,
  },
};

export default async function YoutubeNewsPostPage() {
  const [freshness, newsIndex] = await Promise.all([getDataFreshness(), getYoutubeNewsIndex()]);
  const updatedAt = new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(freshness.newestModifiedAt));

  return (
    <div className="pageContainer">
      <SiteHeader lastUpdated={updatedAt} status={freshness.status} />
      <Suspense fallback={<main><section className="newsPostSection"><div className="card newsPostCard"><h1>게시글 불러오는 중</h1><p>잠시만 기다려 주세요.</p></div></section></main>}>
        <YoutubeNewsPostViewer initialItems={newsIndex.latestItems} />
      </Suspense>
    </div>
  );
}
