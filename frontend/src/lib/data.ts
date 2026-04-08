/**
 * data.ts
 * 
 * 통합 데이터 페칭 로직
 */

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
    try {
      const { promises: fs } = await import("node:fs");
      const path = await import("node:path");
      const filePath = path.join(process.cwd(), "public", "data", fileName);
      const content = await fs.readFile(filePath, "utf8");
      return JSON.parse(content) as T;
    } catch (err) {
      console.error(`서버 로컬 파일 읽기 실패 (${fileName}):`, err);
      throw err;
    }
  }

  const url = `/data/${fileName}?t=${Date.now()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`클라이언트 데이터 페치 실패: ${url}`);
  return res.json() as Promise<T>;
}

export type PredictionData = Awaited<ReturnType<typeof getPredictionData>>;
export type IndicatorData = Awaited<ReturnType<typeof getIndicatorData>>;
export type HistoryData = Awaited<ReturnType<typeof getHistoryData>>;
export type BacktestDiagnosticsData = Awaited<ReturnType<typeof getBacktestDiagnosticsData>>;

export async function getPredictionData() {
  return fetchJson<{
    predictionDate: string;
    rangeLow: number;
    rangeHigh: number;
    pointPrediction: number;
    predictedChangePct: number;
    prevClose: number;
    signalSummary: string;
    lastCalculatedAt: string;
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
    }>;
    secondary: Array<{
      key: string;
      label: string;
      value: string;
      changePct: number;
      updatedAt: string;
      sourceUrl?: string;
      dataSource?: string;
    }>;
    generatedAt?: string;
  }>("indicators.json");
}

export async function getHistoryData() {
  return fetchJson<{
    summary: {
      mae30d: number;
    };
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

export async function getDataFreshness() {
  const prediction = await getPredictionData();
  const updatedAt = prediction.lastCalculatedAt;
  const ageHours = (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);

  return {
    status: ageHours < 12 ? "fresh" : ageHours < 36 ? "aging" : "stale",
    ageHours: Number(ageHours.toFixed(1)),
    newestModifiedAt: updatedAt,
  };
}
