import type { HistoryData, IndicatorData, PredictionData } from "@/lib/data";

export type DataFreshness = {
  status: "fresh" | "aging" | "stale";
  ageHours: number;
  newestModifiedAt: string;
  latestRecordDate: string | null;
};

function latestIndicatorTimestamp(indicators: IndicatorData) {
  return [...indicators.primary, ...indicators.secondary]
    .map((item) => item.checkedAt || item.updatedAt)
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter((value) => !Number.isNaN(value))
    .sort((a, b) => b - a)[0];
}

function toKstDateTimestamp(dateText: string | null | undefined) {
  if (!dateText) {
    return Number.NaN;
  }

  const ts = new Date(`${dateText}T00:00:00+09:00`).getTime();
  return Number.isNaN(ts) ? Number.NaN : ts;
}

function pickLatestRecordDate(
  historyDate: string | null | undefined,
  predictionDate: string | null | undefined,
) {
  const historyTs = toKstDateTimestamp(historyDate);
  const predictionTs = toKstDateTimestamp(predictionDate);

  if (!Number.isNaN(historyTs) && !Number.isNaN(predictionTs)) {
    return historyTs >= predictionTs ? historyDate ?? null : predictionDate ?? null;
  }
  if (!Number.isNaN(predictionTs)) {
    return predictionDate ?? null;
  }
  if (!Number.isNaN(historyTs)) {
    return historyDate ?? null;
  }
  return predictionDate ?? historyDate ?? null;
}

export function calculateDataFreshness(
  prediction: PredictionData,
  indicators: IndicatorData,
  history: HistoryData,
  nowMs = Date.now(),
): DataFreshness {
  const timestamps = [
    prediction.lastCalculatedAt,
    prediction.generatedAt,
    history.generatedAt,
    indicators.generatedAt,
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => !Number.isNaN(value));

  const indicatorUpdatedAt = latestIndicatorTimestamp(indicators);
  if (indicatorUpdatedAt) {
    timestamps.push(indicatorUpdatedAt);
  }

  const newestModifiedAt = timestamps.length ? Math.max(...timestamps) : nowMs;
  const ageHours = (nowMs - newestModifiedAt) / (1000 * 60 * 60);
  const latestRecordDate = pickLatestRecordDate(history.records[0]?.date, prediction.latestRecordDate);
  const latestRecordAgeDays = latestRecordDate
    ? (nowMs - new Date(`${latestRecordDate}T00:00:00+09:00`).getTime()) / (1000 * 60 * 60 * 24)
    : Number.POSITIVE_INFINITY;

  let status: DataFreshness["status"] = "fresh";
  if (ageHours > 12 || latestRecordAgeDays > 2.2) {
    status = "aging";
  }
  if (ageHours > 24 || latestRecordAgeDays > 4) {
    status = "stale";
  }

  return {
    status,
    ageHours: Number(ageHours.toFixed(1)),
    newestModifiedAt: new Date(newestModifiedAt).toISOString(),
    latestRecordDate,
  };
}
