"use client";

import { useEffect, useRef, useState } from "react";
import { getBoardYoutubeNewsItems, getYoutubeNewsPostHref } from "@/lib/youtube-news-board";
import { fetchYoutubeNewsIndex } from "@/lib/youtube-news-client";
import { getYoutubeNewsCleanHeadline, getYoutubeNewsDisplayDate, getYoutubeNewsLead } from "@/lib/youtube-news-format";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";

const NEWS_POLL_INTERVAL_MS = 120_000;
const NEWS_BOARD_LIMIT = 10;

type YoutubeNewsArchiveProps = {
  initialIndex: YoutubeNewsIndex;
};

function toIndexVersion(index: YoutubeNewsIndex) {
  return [
    index.generatedAt ?? "",
    index.latestItems.map((item) => item.id).join("|"),
  ].join("::");
}

function clampPage(page: number, totalPages: number) {
  if (!Number.isFinite(page)) {
    return 1;
  }

  return Math.min(Math.max(Math.trunc(page), 1), totalPages);
}

function getYoutubeNewsPageHref(page: number) {
  return page <= 1 ? "/youtube-news" : `/youtube-news?page=${page}`;
}

function getBrowserPage() {
  if (typeof window === "undefined") {
    return 1;
  }

  return Number(new URLSearchParams(window.location.search).get("page") ?? "1");
}

export function YoutubeNewsArchive({ initialIndex }: YoutubeNewsArchiveProps) {
  const [newsIndex, setNewsIndex] = useState(initialIndex);
  const [requestedPage, setRequestedPage] = useState(1);
  const versionRef = useRef(toIndexVersion(initialIndex));
  const indexRef = useRef(initialIndex);
  const allBoardItems = getBoardYoutubeNewsItems(newsIndex.latestItems, undefined, { filterBoardReady: false });
  const totalPages = Math.max(1, Math.ceil(allBoardItems.length / NEWS_BOARD_LIMIT));
  const currentPage = clampPage(requestedPage, totalPages);
  const pageStartIndex = (currentPage - 1) * NEWS_BOARD_LIMIT;
  const boardItems = allBoardItems.slice(pageStartIndex, pageStartIndex + NEWS_BOARD_LIMIT);
  const hasPreviousPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const applyNewsIndex = (nextIndex: YoutubeNewsIndex) => {
    const nextVersion = toIndexVersion(nextIndex);
    if (nextVersion !== versionRef.current) {
      versionRef.current = nextVersion;
      indexRef.current = nextIndex;
      setNewsIndex(nextIndex);
    }
  };

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    const syncNews = async () => {
      try {
        const nextIndex = await fetchYoutubeNewsIndex(indexRef.current);
        if (cancelled) {
          return;
        }
        applyNewsIndex(nextIndex);
      } catch {
        // keep static fallback already rendered at build time
      }
    };

    const scheduleNextPoll = () => {
      if (!cancelled) {
        pollTimer = window.setTimeout(async () => {
          await syncNews();
          scheduleNextPoll();
        }, NEWS_POLL_INTERVAL_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncNews();
      }
    };

    void syncNews();
    scheduleNextPoll();

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    indexRef.current = newsIndex;
  }, [newsIndex]);

  useEffect(() => {
    const syncRequestedPage = () => {
      setRequestedPage(getBrowserPage());
    };

    syncRequestedPage();
    window.addEventListener("popstate", syncRequestedPage);

    return () => {
      window.removeEventListener("popstate", syncRequestedPage);
    };
  }, []);

  return (
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

    </main>
  );
}

