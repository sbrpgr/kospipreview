import { getClientDataUrl, getStaticDataUrl, isLiveDataFile, type DataFileName } from "@/lib/data-paths";

async function fetchJson<T>(fileName: DataFileName): Promise<T> {
  const isServer = typeof window === "undefined";

  if (isServer) {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "public", "data", fileName);
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  }

  const preferredUrl = getClientDataUrl(fileName);
  let res = await fetch(preferredUrl, { cache: "no-store" });

  if (!res.ok && isLiveDataFile(fileName)) {
    const fallbackUrl = getStaticDataUrl(fileName);
    res = await fetch(fallbackUrl, { cache: "no-store" });
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch ${preferredUrl}`);
  }
  return res.json() as Promise<T>;
}

export type PredictionData = Awaited<ReturnType<typeof getPredictionData>>;
export type IndicatorData = Awaited<ReturnType<typeof getIndicatorData>>;
export type HistoryData = Awaited<ReturnType<typeof getHistoryData>>;
export type LivePredictionSeriesData = Awaited<ReturnType<typeof getLivePredictionSeriesData>>;
export type BacktestDiagnosticsData = Awaited<ReturnType<typeof getBacktestDiagnosticsData>>;

export async function getPredictionData() {
  return fetchJson<{
    generatedAt?: string;
    predictionDate: string;
    predictionDateIso?: string;
    rangeLow: number | null;
    rangeHigh: number | null;
    pointPrediction: number | null;
    nightFuturesSimplePoint?: number | null;
    nightFuturesSimpleChangePct?: number | null;
    futuresDayClose?: number | null;
    futuresDayCloseDate?: string | null;
    predictedChangePct: number | null;
    prevClose: number;
    signalSummary: string;
    lastCalculatedAt: string | null;
    latestRecordDate?: string;
    mae30d: number;
    yesterday: {
      predictionLow: number;
      predictionHigh: number;
      actualOpen: number;
      hit: boolean;
    };
    model: {
      engine: string;
      vix: number;
      lgbmRmse: number;
    };
  }>("prediction.json");
}

export async function getIndicatorData() {
  return fetchJson<{
    primary: Array<{
      key: string;
      label: string;
      value: string;
      changePct: number;
      updatedAt: string;
      sourceUrl?: string;
      dataSource?: string;
      displayTag?: string;
      isPremarket?: boolean;
      referenceLabel?: string;
      referenceValue?: string;
      referenceDate?: string;
    }>;
    secondary: Array<{
      key: string;
      label: string;
      value: string;
      changePct: number;
      updatedAt: string;
      sourceUrl?: string;
      dataSource?: string;
      displayTag?: string;
      isPremarket?: boolean;
      referenceLabel?: string;
      referenceValue?: string;
      referenceDate?: string;
    }>;
    generatedAt?: string;
    isUsPremarketNow?: boolean;
  }>("indicators.json");
}

export async function getHistoryData() {
  return fetchJson<{
    summary: {
      mae30d: number;
    };
    generatedAt?: string;
    records: Array<{
      date: string;
      modelPrediction?: number | null;
      nightFuturesSimpleOpen?: number | null;
      low: number;
      high: number;
      actualOpen: number;
      hit: boolean;
    }>;
  }>("history.json");
}

export async function getLivePredictionSeriesData() {
  return fetchJson<{
    generatedAt?: string;
    predictionDateIso?: string;
    predictionDate?: string;
    records: Array<{
      predictionDateIso: string;
      predictionDate?: string;
      observedAt: string;
      kstTime?: string;
      pointPrediction?: number | null;
      nightFuturesSimplePoint?: number | null;
      predictedChangePct?: number | null;
      nightFuturesSimpleChangePct?: number | null;
    }>;
  }>("live_prediction_series.json");
}

export async function getBacktestDiagnosticsData() {
  return fetchJson<{
    selectedFeatures: string[];
    rmse: number;
    mae: number;
    featureImportance: Record<string, number>;
    generatedAt: string;
  }>("backtest_diagnostics.json");
}

function latestIndicatorTimestamp(indicators: Awaited<ReturnType<typeof getIndicatorData>>) {
  return [...indicators.primary, ...indicators.secondary]
    .map((item) => item.updatedAt)
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

export async function getDataFreshness() {
  const [prediction, indicators, history] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
  ]);

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

  const newestModifiedAt = timestamps.length ? Math.max(...timestamps) : Date.now();
  const ageHours = (Date.now() - newestModifiedAt) / (1000 * 60 * 60);

  const latestRecordDate = pickLatestRecordDate(history.records[0]?.date, prediction.latestRecordDate);
  const latestRecordAgeDays = latestRecordDate
    ? (Date.now() - new Date(`${latestRecordDate}T00:00:00+09:00`).getTime()) / (1000 * 60 * 60 * 24)
    : Number.POSITIVE_INFINITY;

  let status: "fresh" | "aging" | "stale" = "fresh";
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
