import { getYoutubeNewsClientUrl, getYoutubeNewsStaticUrl } from "@/lib/data-paths";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";

export async function fetchYoutubeNewsIndex(): Promise<YoutubeNewsIndex> {
  const primaryUrl = getYoutubeNewsClientUrl();
  const fallbackUrl = getYoutubeNewsStaticUrl();

  let response = await fetch(primaryUrl, {
    cache: "no-store",
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    response = await fetch(fallbackUrl, {
      cache: "no-store",
      headers: {
        pragma: "no-cache",
        "cache-control": "no-cache",
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${primaryUrl}`);
  }

  return (await response.json()) as YoutubeNewsIndex;
}
