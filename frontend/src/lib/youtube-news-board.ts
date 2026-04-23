import type { YoutubeNewsItem } from "@/lib/youtube-news-types";
import {
  compareYoutubeNewsByQuality,
  compareYoutubeNewsByRecency,
  getYoutubeNewsCleanHeadline,
  isBoardReadyYoutubeNewsItem,
} from "@/lib/youtube-news-format";

function dedupeKey(item: YoutubeNewsItem) {
  if (item.sourceUrl) {
    const title = getYoutubeNewsCleanHeadline(item).trim();
    const publishedAt = item.videoPublishedAt ?? "";
    return `source:${item.sourceUrl}|title:${title}|publishedAt:${publishedAt}`;
  }

  const title = getYoutubeNewsCleanHeadline(item) || item.originalTitle || item.headline;
  return `title:${item.youtuber}|${title}`;
}

export function dedupeYoutubeNewsItems(items: YoutubeNewsItem[]) {
  const grouped = new Map<string, YoutubeNewsItem[]>();

  for (const item of items) {
    const key = dedupeKey(item);
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(item);
    } else {
      grouped.set(key, [item]);
    }
  }

  return [...grouped.values()]
    .map((group) => group.sort(compareYoutubeNewsByQuality)[0])
    .sort(compareYoutubeNewsByRecency);
}

export function getBoardYoutubeNewsItems(
  items: YoutubeNewsItem[],
  limit?: number,
  options: { filterBoardReady?: boolean } = {},
) {
  const deduped = dedupeYoutubeNewsItems(items);
  const shouldFilterBoardReady = options.filterBoardReady ?? true;
  const boardReadyItems = shouldFilterBoardReady
    ? deduped.filter((item) => isBoardReadyYoutubeNewsItem(item))
    : deduped;
  const fallbackMinCount = Math.min(5, deduped.length);
  const selected = boardReadyItems.length >= fallbackMinCount ? boardReadyItems : deduped;

  if (typeof limit === "number") {
    return selected.slice(0, limit);
  }

  return selected;
}

export function getYoutubeNewsPostHref(itemId: string) {
  return `/youtube-news/post?item=${encodeURIComponent(itemId)}`;
}
