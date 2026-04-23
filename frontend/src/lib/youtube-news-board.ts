import type { YoutubeNewsItem } from "@/lib/youtube-news-types";

function dedupeKey(item: YoutubeNewsItem) {
  if (item.sourceUrl) {
    return `source:${item.sourceUrl}`;
  }

  const title = item.originalTitle || item.headline;
  return `title:${item.youtuber}|${title}`;
}

export function dedupeYoutubeNewsItems(items: YoutubeNewsItem[]) {
  const seen = new Set<string>();
  const deduped: YoutubeNewsItem[] = [];

  for (const item of items) {
    const key = dedupeKey(item);
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(item);
  }

  return deduped;
}

export function getYoutubeNewsPostHref(itemId: string) {
  return `/youtube-news/post?item=${encodeURIComponent(itemId)}`;
}
