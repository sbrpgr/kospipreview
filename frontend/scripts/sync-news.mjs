import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const frontendDir = path.resolve(path.dirname(scriptPath), "..");
const repoDir = path.resolve(frontendDir, "..");
const sourceNewsDir = path.join(repoDir, "news");
const publicDir = path.join(frontendDir, "public");
const publicNewsDir = path.join(publicDir, "news");
const publicDataDir = path.join(publicDir, "data");
const publicIndexPath = path.join(publicDataDir, "youtube-news.json");

function assertInside(parent, child) {
  const relative = path.relative(parent, child);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to write outside ${parent}: ${child}`);
  }
}

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

function parseTime(value) {
  if (!value) {
    return 0;
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function toDisplayDate(dateText) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateText);
  if (!match) {
    return dateText;
  }

  return `${match[1]}년 ${match[2]}월 ${match[3]}일`;
}

function toSummaryLead(summary) {
  if (!summary) {
    return "";
  }

  return summary
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("[") && !line.startsWith("- "))
    .at(0) ?? "";
}

async function readJson(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content);
}

async function readDirectoryNames(dirPath) {
  if (!(await exists(dirPath))) {
    return [];
  }

  const entries = await fs.readdir(dirPath, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

async function buildNewsIndex() {
  const reports = [];
  const dateDirs = await readDirectoryNames(sourceNewsDir);

  for (const dateDir of dateDirs) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDir)) {
      continue;
    }

    const runDirs = await readDirectoryNames(path.join(sourceNewsDir, dateDir));
    for (const runDir of runDirs) {
      const digestPath = path.join(sourceNewsDir, dateDir, runDir, "digest_db.json");
      if (!(await exists(digestPath))) {
        continue;
      }

      const digest = await readJson(digestPath);
      const reportId = `${dateDir}-${runDir}`;
      const reportHref = `/news/${dateDir}/${runDir}/index.html`;
      const reportGeneratedAt = digest.generated_at ?? "";

      const items = (digest.items ?? []).map((item, index) => ({
        id: `${reportId}-${item.id ?? index + 1}`,
        reportId,
        reportDate: digest.report_date ?? dateDir,
        reportDateDisplay: toDisplayDate(digest.report_date ?? dateDir),
        reportGeneratedAt,
        reportHref,
        youtuber: item.youtuber ?? "유튜브",
        headline: item.headline ?? item.original_title ?? "제목 없음",
        videoPublishedAt: item.video_published_at ?? "",
        videoPublishedDisplay: item.video_published_display ?? "",
        sourceUrl: item.source_url ?? "",
        originalTitle: item.original_title ?? "",
        summaryLead: toSummaryLead(item.summary ?? ""),
      }));

      reports.push({
        id: reportId,
        date: digest.report_date ?? dateDir,
        dateDisplay: toDisplayDate(digest.report_date ?? dateDir),
        generatedAt: reportGeneratedAt,
        period: digest.period ?? "",
        count: Number.isFinite(digest.count) ? digest.count : items.length,
        href: reportHref,
        title: `경제 유튜버 일일 요약 - ${toDisplayDate(digest.report_date ?? dateDir)}`,
        items,
      });
    }
  }

  reports.sort((a, b) => {
    const generatedDiff = parseTime(b.generatedAt) - parseTime(a.generatedAt);
    if (generatedDiff !== 0) {
      return generatedDiff;
    }
    return b.id.localeCompare(a.id);
  });

  const latestItems = reports
    .flatMap((report) => report.items)
    .sort((a, b) => {
      const publishedDiff = parseTime(b.videoPublishedAt) - parseTime(a.videoPublishedAt);
      if (publishedDiff !== 0) {
        return publishedDiff;
      }
      return parseTime(b.reportGeneratedAt) - parseTime(a.reportGeneratedAt);
    });

  return {
    generatedAt: new Date().toISOString(),
    latestItems,
    reports,
  };
}

async function syncNewsFiles() {
  assertInside(publicDir, publicNewsDir);
  assertInside(publicDir, publicIndexPath);

  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(publicDataDir, { recursive: true });

  if (await exists(publicNewsDir)) {
    await fs.rm(publicNewsDir, { recursive: true, force: true });
  }

  if (await exists(sourceNewsDir)) {
    await fs.cp(sourceNewsDir, publicNewsDir, { recursive: true });
  }

  const index = await buildNewsIndex();
  await fs.writeFile(publicIndexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");

  console.log(`Synced ${index.reports.length} YouTube news report(s), ${index.latestItems.length} item(s).`);
}

syncNewsFiles().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
