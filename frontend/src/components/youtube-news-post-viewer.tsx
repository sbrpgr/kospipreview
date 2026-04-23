"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getBoardYoutubeNewsItems, getYoutubeNewsPostHref } from "@/lib/youtube-news-board";
import { fetchYoutubeNewsIndex } from "@/lib/youtube-news-client";
import {
  getYoutubeNewsCleanHeadline,
  getYoutubeNewsDisplayDate,
  getYoutubeNewsLead,
  parseYoutubeNewsSummarySections,
} from "@/lib/youtube-news-format";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";
import type { YoutubeNewsItem } from "@/lib/youtube-news-types";

type YoutubeNewsPostViewerProps = {
  initialItems: YoutubeNewsItem[];
};

export function YoutubeNewsPostViewer({ initialItems }: YoutubeNewsPostViewerProps) {
  const searchParams = useSearchParams();
  const targetItemId = searchParams.get("item") ?? "";
  const [index, setIndex] = useState<YoutubeNewsIndex>({
    generatedAt: "",
    latestItems: initialItems,
    reports: [],
  });
  const indexRef = useRef(index);

  const items = useMemo(() => getBoardYoutubeNewsItems(index.latestItems, undefined, { filterBoardReady: false }), [index]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    indexRef.current = index;
  }, [index]);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      setIsLoading(true);
      try {
        const nextIndex = await fetchYoutubeNewsIndex(indexRef.current);
        if (cancelled) {
          return;
        }

        setIndex(nextIndex);
      } catch {
        if (!cancelled) {
          setIndex(indexRef.current);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void sync();
    return () => {
      cancelled = true;
    };
  }, [initialItems]);

  const item = items.find((candidate) => candidate.id === targetItemId) ?? null;
  const itemIndex = item ? items.findIndex((candidate) => candidate.id === item.id) : -1;
  const newerItem = itemIndex > 0 ? items[itemIndex - 1] : null;
  const olderItem = itemIndex >= 0 && itemIndex < items.length - 1 ? items[itemIndex + 1] : null;
  const summarySections = item ? parseYoutubeNewsSummarySections(item) : [];
  const lead = item ? getYoutubeNewsLead(item) : "";
  const cleanedHeadline = item ? getYoutubeNewsCleanHeadline(item) : "";

  return (
    <main>
      <section className="newsPostSection">
        <a className="newsPostBackButton" href="/youtube-news">
          게시판으로 돌아가기
        </a>

        {!targetItemId ? (
          <div className="card newsPostCard">
            <h1>게시글을 찾을 수 없습니다.</h1>
            <p>유튜브 뉴스 게시판에서 게시글을 선택해 주세요.</p>
          </div>
        ) : isLoading ? (
          <div className="card newsPostCard">
            <h1>게시글 불러오는 중</h1>
            <p>최신 뉴스 데이터를 확인하고 있습니다.</p>
          </div>
        ) : !item ? (
          <div className="card newsPostCard">
            <h1>게시글을 찾을 수 없습니다.</h1>
            <p>데이터가 갱신되었거나 링크가 만료되었을 수 있습니다.</p>
          </div>
        ) : (
          <article className="card newsPostCard">
            <span className="newsPostMeta">
              {item.youtuber} · {getYoutubeNewsDisplayDate(item)}
            </span>
            <h1>{cleanedHeadline}</h1>
            {item.originalTitle && item.originalTitle !== cleanedHeadline ? (
              <p className="newsPostOriginalTitle">원제: {item.originalTitle}</p>
            ) : null}
            {lead ? <p className="newsPostLead">{lead}</p> : null}
            <div className="newsPostSummary">
              {summarySections.length ? (
                summarySections.map((section, index) => (
                  <section className="newsPostSummarySection" key={`${item.id}-${section.title}-${index}`}>
                    <h2>{section.title}</h2>
                    {section.paragraphs.map((paragraph, paragraphIndex) => (
                      <p key={`${item.id}-paragraph-${index}-${paragraphIndex}`}>{paragraph}</p>
                    ))}
                    {section.bullets.length ? (
                      <ul>
                        {section.bullets.map((bullet, bulletIndex) => (
                          <li key={`${item.id}-bullet-${index}-${bulletIndex}`}>{bullet}</li>
                        ))}
                      </ul>
                    ) : null}
                  </section>
                ))
              ) : lead ? (
                <p>{lead}</p>
              ) : (
                <p>요약 본문이 아직 준비되지 않았습니다.</p>
              )}
            </div>
            <div className="newsPostActions">
              {item.sourceUrl ? (
                <a className="newsPostActionButton" href={item.sourceUrl} rel="noopener noreferrer" target="_blank">
                  원본 영상 보기
                </a>
              ) : null}
              <a className="newsPostActionButton" href={item.reportHref} rel="noopener noreferrer" target="_blank">
                원문 리포트(새 탭)
              </a>
            </div>
            <div className="newsPostPager">
              {newerItem ? (
                <a className="newsPostPagerLink" href={getYoutubeNewsPostHref(newerItem.id)}>
                  ← 더 최신 글
                </a>
              ) : (
                <span className="newsPostPagerLink isDisabled">← 더 최신 글</span>
              )}
              {olderItem ? (
                <a className="newsPostPagerLink" href={getYoutubeNewsPostHref(olderItem.id)}>
                  이전 글 →
                </a>
              ) : (
                <span className="newsPostPagerLink isDisabled">이전 글 →</span>
              )}
            </div>
            <a className="newsPostBackButton newsPostBackButtonBottom" href="/youtube-news">
              게시판으로 돌아가기
            </a>
          </article>
        )}
      </section>
    </main>
  );
}
