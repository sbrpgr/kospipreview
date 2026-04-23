import type { YoutubeNewsItem } from "@/lib/youtube-news-types";

const NOISY_SUMMARY_PATTERNS = [
  "고품질 요약이 아니라",
  "전사 기반 자동 발췌",
  "광고가 재생되는 동안",
  "클립을 만들 수 없습니다",
  "아래 내용은 생성형 요약이 아니라",
  "주요 발췌",
];

const SECTION_HEADING_PATTERN = /^\[([^\]]+)\]$/;
const BULLET_PATTERN = /^[-*]\s+/;
const HEADLINE_SECTION_CUT_PATTERN = /\s+\[(?:리드|핵심 뉴스|시장 시사점|유의점|키워드|주요 발췌|전문)\].*$/u;

export type YoutubeNewsSummarySection = {
  title: string;
  paragraphs: string[];
  bullets: string[];
};

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).getTime();
  return Number.isNaN(parsed) ? 0 : parsed;
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function isNoiseLine(value: string) {
  return NOISY_SUMMARY_PATTERNS.some((pattern) => value.includes(pattern));
}

function splitSummaryToSections(summary: string) {
  const rows = summary.replace(/\r/g, "").split("\n");
  const sections: Array<{ title: string; lines: string[] }> = [];
  let current: { title: string; lines: string[] } | null = null;

  for (const rawRow of rows) {
    const row = rawRow.trim();
    if (!row) {
      if (current) {
        current.lines.push("");
      }
      continue;
    }

    const headingMatch = row.match(SECTION_HEADING_PATTERN);
    if (headingMatch) {
      current = { title: headingMatch[1], lines: [] };
      sections.push(current);
      continue;
    }

    if (!current) {
      current = { title: "요약", lines: [] };
      sections.push(current);
    }

    current.lines.push(row);
  }

  return sections;
}

function normalizeSection(section: { title: string; lines: string[] }): YoutubeNewsSummarySection | null {
  const paragraphs: string[] = [];
  const bullets: string[] = [];
  let paragraphBuffer: string[] = [];

  const flushParagraphBuffer = () => {
    if (paragraphBuffer.length) {
      const paragraph = cleanLine(paragraphBuffer.join(" "));
      if (paragraph) {
        paragraphs.push(paragraph);
      }
      paragraphBuffer = [];
    }
  };

  for (const line of section.lines) {
    if (!line) {
      flushParagraphBuffer();
      continue;
    }

    if (isNoiseLine(line)) {
      continue;
    }

    if (BULLET_PATTERN.test(line)) {
      flushParagraphBuffer();
      const bullet = cleanLine(line.replace(BULLET_PATTERN, ""));
      if (bullet) {
        bullets.push(bullet);
      }
      continue;
    }

    paragraphBuffer.push(line);
  }

  flushParagraphBuffer();

  if (!paragraphs.length && !bullets.length) {
    return null;
  }

  return {
    title: section.title.trim() || "요약",
    paragraphs,
    bullets,
  };
}

export function getYoutubeNewsCleanHeadline(item: YoutubeNewsItem) {
  const base = (item.headline || item.originalTitle || "제목 없음").replace(/\s+/g, " ").trim();
  const stripped = base.replace(HEADLINE_SECTION_CUT_PATTERN, "");
  if (stripped.length <= 110) {
    return stripped;
  }
  return `${stripped.slice(0, 107).trimEnd()}...`;
}

export function parseYoutubeNewsSummarySections(item: YoutubeNewsItem): YoutubeNewsSummarySection[] {
  const rawSummary = item.summary?.trim() || item.summaryLead?.trim() || "";
  if (!rawSummary) {
    return [];
  }

  const parsed = splitSummaryToSections(rawSummary)
    .map(normalizeSection)
    .filter((section): section is YoutubeNewsSummarySection => Boolean(section));

  if (!parsed.length) {
    return [];
  }

  return parsed;
}

export function getYoutubeNewsLead(item: YoutubeNewsItem) {
  const existingLead = item.summaryLead?.trim() ?? "";
  if (existingLead && !isNoiseLine(existingLead)) {
    return cleanLine(existingLead);
  }

  const sections = parseYoutubeNewsSummarySections(item);
  const leadSection =
    sections.find((section) => section.title === "리드") ?? sections.find((section) => section.title === "요약");

  if (!leadSection) {
    return "";
  }

  const candidate = leadSection.paragraphs[0] || leadSection.bullets[0] || "";
  if (!candidate) {
    return "";
  }

  const compact = cleanLine(candidate);
  if (compact.length <= 160) {
    return compact;
  }

  return `${compact.slice(0, 157).trimEnd()}...`;
}

export function scoreYoutubeNewsItem(item: YoutubeNewsItem) {
  const headline = getYoutubeNewsCleanHeadline(item);
  const summary = item.summary?.trim() ?? "";
  const lead = getYoutubeNewsLead(item);

  let score = 0;
  if (headline.length >= 14 && headline.length <= 100) {
    score += 2;
  } else if (headline.length > 120) {
    score -= 2;
  }

  if (lead.length >= 20) {
    score += 2;
  }

  if (summary.length >= 260) {
    score += 2;
  }

  if (summary.includes("[핵심 뉴스]")) {
    score += 2;
  }

  if (summary.includes("[시장 시사점]")) {
    score += 1;
  }

  if (summary.includes("[유의점]")) {
    score += 1;
  }

  if (NOISY_SUMMARY_PATTERNS.some((pattern) => summary.includes(pattern) || headline.includes(pattern))) {
    score -= 6;
  }

  if (item.headline.includes("[리드]")) {
    score -= 3;
  }

  return score;
}

export function isBoardReadyYoutubeNewsItem(item: YoutubeNewsItem) {
  return scoreYoutubeNewsItem(item) >= 1;
}

export function compareYoutubeNewsByRecency(a: YoutubeNewsItem, b: YoutubeNewsItem) {
  const videoPublishedDiff = parseTimestamp(b.videoPublishedAt) - parseTimestamp(a.videoPublishedAt);
  if (videoPublishedDiff !== 0) {
    return videoPublishedDiff;
  }

  const generatedDiff = parseTimestamp(b.reportGeneratedAt) - parseTimestamp(a.reportGeneratedAt);
  if (generatedDiff !== 0) {
    return generatedDiff;
  }

  return b.id.localeCompare(a.id);
}

export function compareYoutubeNewsByQuality(a: YoutubeNewsItem, b: YoutubeNewsItem) {
  const qualityDiff = scoreYoutubeNewsItem(b) - scoreYoutubeNewsItem(a);
  if (qualityDiff !== 0) {
    return qualityDiff;
  }

  return compareYoutubeNewsByRecency(a, b);
}

export function getYoutubeNewsDisplayDate(item: YoutubeNewsItem) {
  return item.videoPublishedDisplay || item.reportDateDisplay;
}
