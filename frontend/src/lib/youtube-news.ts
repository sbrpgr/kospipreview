import { promises as fs } from "node:fs";
import path from "node:path";

export type YoutubeNewsItem = {
  id: string;
  reportId: string;
  reportDate: string;
  reportDateDisplay: string;
  reportGeneratedAt: string;
  reportHref: string;
  youtuber: string;
  headline: string;
  videoPublishedAt: string;
  videoPublishedDisplay: string;
  sourceUrl: string;
  originalTitle: string;
  summaryLead: string;
};

export type YoutubeNewsReport = {
  id: string;
  date: string;
  dateDisplay: string;
  generatedAt: string;
  period: string;
  count: number;
  href: string;
  title: string;
  items: YoutubeNewsItem[];
};

export type YoutubeNewsIndex = {
  generatedAt: string;
  latestItems: YoutubeNewsItem[];
  reports: YoutubeNewsReport[];
};

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
