const DATA_FILES = [
  "prediction.json",
  "indicators.json",
  "history.json",
  "backtest_diagnostics.json",
] as const;

type DataFileName = (typeof DATA_FILES)[number];

async function fetchJson<T>(fileName: DataFileName): Promise<T> {
  const isServer = typeof window === "undefined";

  if (isServer) {
    const { promises: fs } = await import("node:fs");
    const path = await import("node:path");
    const filePath = path.join(process.cwd(), "public", "data", fileName);
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content) as T;
  }

  const url = `/data/${fileName}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }
  return res.json() as Promise<T>;
}

export type PredictionData = Awaited<ReturnType<typeof getPredictionData>>;
export type IndicatorData = Awaited<ReturnType<typeof getIndicatorData>>;
export type HistoryData = Awaited<ReturnType<typeof getHistoryData>>;
export type BacktestDiagnosticsData = Awaited<ReturnType<typeof getBacktestDiagnosticsData>>;

export async function getPredictionData() {
  return fetchJson<{
    generatedAt?: string;
    predictionDate: string;
    rangeLow: number;
    rangeHigh: number;
    pointPrediction: number;
    predictedChangePct: number;
    prevClose: number;
    signalSummary: string;
    lastCalculatedAt: string;
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
      low: number;
      high: number;
      actualOpen: number;
      hit: boolean;
    }>;
  }>("history.json");
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

  const latestRecordDate = history.records[0]?.date ?? prediction.latestRecordDate ?? null;
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
