const LIVE_DATA_FILES = new Set(["prediction.json", "indicators.json", "history.json", "live_prediction_series.json"]);

export const DATA_FILES = [
  "prediction.json",
  "indicators.json",
  "history.json",
  "live_prediction_series.json",
  "backtest_diagnostics.json",
] as const;

export type DataFileName = (typeof DATA_FILES)[number];

export function getStaticDataUrl(fileName: DataFileName) {
  return `/data/${fileName}?t=${Date.now()}`;
}

export function getClientDataUrl(fileName: DataFileName) {
  const basePath = LIVE_DATA_FILES.has(fileName) ? `/api/live/${fileName}` : `/data/${fileName}`;
  return `${basePath}?t=${Date.now()}`;
}

export function isLiveDataFile(fileName: DataFileName) {
  return LIVE_DATA_FILES.has(fileName);
}

export function getYoutubeNewsClientUrl() {
  return `/api/news/youtube-news.json?t=${Date.now()}`;
}

export function getYoutubeNewsStaticUrl() {
  return `/data/youtube-news.json?t=${Date.now()}`;
}
