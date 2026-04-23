"use client";

import { useEffect, useRef, useState } from "react";
import { dedupeYoutubeNewsItems, getYoutubeNewsPostHref } from "@/lib/youtube-news-board";
import { fetchYoutubeNewsIndex } from "@/lib/youtube-news-client";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";

const NEWS_POLL_INTERVAL_MS = 120_000;

type YoutubeNewsArchiveProps = {
  initialIndex: YoutubeNewsIndex;
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

function toIndexVersion(index: YoutubeNewsIndex) {
  return [
    index.generatedAt ?? "",
    index.reports.map((report) => report.id).join("|"),
    index.latestItems.map((item) => item.id).join("|"),
  ].join("::");
}

export function YoutubeNewsArchive({ initialIndex }: YoutubeNewsArchiveProps) {
  const [newsIndex, setNewsIndex] = useState(initialIndex);
  const versionRef = useRef(toIndexVersion(initialIndex));
  const boardItems = dedupeYoutubeNewsItems(newsIndex.latestItems);

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    const syncNews = async () => {
      try {
        const nextIndex = await fetchYoutubeNewsIndex();
        if (cancelled) {
          return;
        }

        const nextVersion = toIndexVersion(nextIndex);
        if (nextVersion !== versionRef.current) {
          versionRef.current = nextVersion;
          setNewsIndex(nextIndex);
        }
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

      <section className="newsArchiveSection">
        <div className="newsSectionHeader">
          <div>
            <h2>게시판</h2>
            <p>각 뉴스는 별도 게시글 상세 화면에서 확인할 수 있습니다.</p>
          </div>
        </div>

        {boardItems.length ? (
          <div className="newsArchiveList">
            {boardItems.map((item) => (
              <a className="newsArchiveItem" href={getYoutubeNewsPostHref(item.id)} key={item.id}>
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
  );
}
