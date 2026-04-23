import { promises as fs } from "node:fs";
import path from "node:path";
import type { YoutubeNewsIndex } from "@/lib/youtube-news-types";

const EMPTY_NEWS_INDEX: YoutubeNewsIndex = {
  generatedAt: "",
  latestItems: [],
  reports: [],
};

export async function getYoutubeNewsIndex(): Promise<YoutubeNewsIndex> {
  const filePath = path.join(process.cwd(), "public", "data", "youtube-news.json");

  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as YoutubeNewsIndex;
  } catch {
    return EMPTY_NEWS_INDEX;
  }
}
