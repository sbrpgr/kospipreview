import type { YoutubeNewsItem } from "@/lib/youtube-news";

type YoutubeNewsSummaryProps = {
  items: YoutubeNewsItem[];
};

export function YoutubeNewsSummary({ items }: YoutubeNewsSummaryProps) {
  if (!items.length) {
    return null;
  }

  return (
    <section className="card youtubeNewsSummary" aria-labelledby="youtube-news-summary-title">
      <div className="youtubeNewsSummaryHeader">
        <div>
          <h2 id="youtube-news-summary-title">최근 유튜브 뉴스</h2>
          <p>경제 유튜버 영상 요약 중 최신 5개 기사입니다.</p>
        </div>
        <a className="youtubeNewsSummaryLink" href="/youtube-news">
          전체보기
        </a>
      </div>

      <div className="youtubeNewsSummaryList">
        {items.slice(0, 5).map((item) => (
          <a className="youtubeNewsSummaryItem" href={item.reportHref} key={item.id}>
            <span className="youtubeNewsSummaryMeta">
              {item.youtuber} · {item.videoPublishedDisplay || item.reportDateDisplay}
            </span>
            <strong>{item.headline}</strong>
          </a>
        ))}
      </div>
    </section>
  );
}
