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
  summary?: string;
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
