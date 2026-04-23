import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
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

function formatGeneratedAt(value: string) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(date);
}

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
      <main>
        <section className="newsArchiveHero">
          <div>
            <h1>유튜브 뉴스</h1>
            <p>경제 유튜버 영상 요약을 날짜별 리포트와 최신 기사 목록으로 정리합니다.</p>
          </div>
          <div className="newsArchiveStat">
            <strong>{newsIndex.reports.length.toLocaleString("ko-KR")}</strong>
            <span>일일 리포트</span>
          </div>
        </section>

        <section className="newsArchiveSection">
          <div className="newsSectionHeader">
            <div>
              <h2>최근 뉴스</h2>
              <p>영상 게시 시각 기준 최신순입니다.</p>
            </div>
          </div>

          {newsIndex.latestItems.length ? (
            <div className="newsArchiveList">
              {newsIndex.latestItems.map((item) => (
                <a className="newsArchiveItem" href={item.reportHref} key={item.id}>
                  <span className="newsArchiveMeta">
                    {item.youtuber} · {item.videoPublishedDisplay || item.reportDateDisplay}
                  </span>
                  <strong>{item.headline}</strong>
                  {item.summaryLead ? <span>{item.summaryLead}</span> : null}
                </a>
              ))}
            </div>
          ) : (
            <div className="card newsEmptyCard">아직 등록된 유튜브 뉴스가 없습니다.</div>
          )}
        </section>

        <section className="newsArchiveSection">
          <div className="newsSectionHeader">
            <div>
              <h2>일일 리포트</h2>
              <p>생성된 전체 유튜브 뉴스 자료입니다.</p>
            </div>
          </div>

          {newsIndex.reports.length ? (
            <div className="newsReportGrid">
              {newsIndex.reports.map((report) => (
                <a className="newsReportCard" href={report.href} key={report.id}>
                  <span>{report.dateDisplay}</span>
                  <strong>{report.title}</strong>
                  <em>
                    {report.period || "일일 요약"} · 기사 {report.count.toLocaleString("ko-KR")}개
                  </em>
                  {report.generatedAt ? <small>생성 {formatGeneratedAt(report.generatedAt)}</small> : null}
                </a>
              ))}
            </div>
          ) : null}
        </section>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />
    </div>
  );
}
