"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { dedupeYoutubeNewsItems } from "@/lib/youtube-news-board";
import { fetchYoutubeNewsIndex } from "@/lib/youtube-news-client";
import type { YoutubeNewsItem } from "@/lib/youtube-news-types";

type YoutubeNewsPostViewerProps = {
  initialItems: YoutubeNewsItem[];
};

function normalizeSummary(item: YoutubeNewsItem) {
  const raw = item.summary?.trim() || item.summaryLead?.trim() || "";
  if (!raw) {
    return [];
  }

  return raw
    .split(/\r?\n\r?\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function YoutubeNewsPostViewer({ initialItems }: YoutubeNewsPostViewerProps) {
  const searchParams = useSearchParams();
  const targetItemId = searchParams.get("item") ?? "";
  const dedupedInitialItems = useMemo(() => dedupeYoutubeNewsItems(initialItems), [initialItems]);

  const [items, setItems] = useState<YoutubeNewsItem[]>(dedupedInitialItems);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const sync = async () => {
      setIsLoading(true);
      try {
        const index = await fetchYoutubeNewsIndex();
        if (cancelled) {
          return;
        }

        setItems(dedupeYoutubeNewsItems(index.latestItems));
      } catch {
        if (!cancelled) {
          setItems(dedupedInitialItems);
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
  }, [dedupedInitialItems]);

  const item = items.find((candidate) => candidate.id === targetItemId) ?? null;
  const summaryParagraphs = item ? normalizeSummary(item) : [];

  return (
    <main>
      <section className="newsPostSection">
        <a className="newsPostBackButton" href="/youtube-news">
          목록으로 돌아가기
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
              {item.youtuber} · {item.videoPublishedDisplay || item.reportDateDisplay}
            </span>
            <h1>{item.headline}</h1>
            <div className="newsPostSummary">
              {summaryParagraphs.length ? (
                summaryParagraphs.map((paragraph, index) => <p key={`${item.id}-${index}`}>{paragraph}</p>)
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
              <a className="newsPostActionButton" href={item.reportHref}>
                수집 리포트 보기
              </a>
            </div>
          </article>
        )}
      </section>
    </main>
  );
}
