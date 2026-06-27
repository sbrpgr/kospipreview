const LIVE_DATA_FILES = new Set([
  "prediction.json",
  "indicators.json",
  "history.json",
  "live_prediction_series.json",
  "holiday_prediction.json",
  "holiday_prediction_series.json",
  "holiday_history.json",
]);

export const DATA_FILES = [
  "prediction.json",
  "indicators.json",
  "history.json",
  "live_prediction_series.json",
  "backtest_diagnostics.json",
  "holiday_prediction.json",
  "holiday_prediction_series.json",
  "holiday_history.json",
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

const LIVE_DATA_CACHE_BUCKET_MS = 60_000;
const STATIC_DATA_CACHE_BUCKET_MS = 300_000;
const NEWS_DATA_CACHE_BUCKET_MS = 300_000;

function cacheBucket(intervalMs: number) {
  return Math.floor(Date.now() / intervalMs);
}

export function getStaticDataUrl(fileName: DataFileName) {
  return `/data/${fileName}?t=${cacheBucket(STATIC_DATA_CACHE_BUCKET_MS)}`;
}

export function getClientDataUrl(fileName: DataFileName) {
  const basePath = LIVE_DATA_FILES.has(fileName) ? `/api/live/${fileName}` : `/data/${fileName}`;
  const intervalMs = LIVE_DATA_FILES.has(fileName) ? LIVE_DATA_CACHE_BUCKET_MS : STATIC_DATA_CACHE_BUCKET_MS;
  return `${basePath}?t=${cacheBucket(intervalMs)}`;
}

export function getLiveDashboardClientUrl() {
  return `/api/live/dashboard.json?t=${cacheBucket(LIVE_DATA_CACHE_BUCKET_MS)}`;
}

export function getLiveHolidayDashboardClientUrl() {
  return `/api/live/holiday-dashboard.json?t=${cacheBucket(LIVE_DATA_CACHE_BUCKET_MS)}`;
}

export function isLiveDataFile(fileName: DataFileName) {
  return LIVE_DATA_FILES.has(fileName);
}

export function getYoutubeNewsClientUrl() {
  return `/api/news/youtube-news.json?t=${cacheBucket(NEWS_DATA_CACHE_BUCKET_MS)}`;
}

export function getYoutubeNewsStaticUrl() {
  return `/data/youtube-news.json?t=${cacheBucket(NEWS_DATA_CACHE_BUCKET_MS)}`;
}
