import { getClientDataUrl, getStaticDataUrl, isLiveDataFile, type DataFileName } from "@/lib/data-paths";
import { calculateDataFreshness } from "@/lib/data-freshness";

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
  let res = await fetch(preferredUrl);

  if (!res.ok && isLiveDataFile(fileName)) {
    const fallbackUrl = getStaticDataUrl(fileName);
    res = await fetch(fallbackUrl);
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
    ewyFxSimplePoint?: number | null;
    ewyFxSimpleChangePct?: number | null;
    nightFuturesClose?: number | null;
    nightFuturesCloseUpdatedAt?: string | null;
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
      checkedAt?: string;
      sourceUrl?: string;
      dataSource?: string;
      displayTag?: string;
      isPremarket?: boolean;
      marketSession?: string;
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
      checkedAt?: string;
      sourceUrl?: string;
      dataSource?: string;
      displayTag?: string;
      isPremarket?: boolean;
      marketSession?: string;
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
      ewyFxSimpleOpen?: number | null;
      low: number;
      high: number;
      actualOpen: number;
      actualClose?: number | null;
      dayFuturesClose?: number | null;
      nightFuturesClose?: number | null;
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
      ewyFxSimplePoint?: number | null;
      nightFuturesClose?: number | null;
      predictedChangePct?: number | null;
      nightFuturesSimpleChangePct?: number | null;
      ewyFxSimpleChangePct?: number | null;
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

export type HolidayPredictionData = Awaited<ReturnType<typeof getHolidayPredictionData>>;
export type HolidayPredictionSeriesData = Awaited<ReturnType<typeof getHolidayPredictionSeriesData>>;
export type HolidayHistoryData = Awaited<ReturnType<typeof getHolidayHistoryData>>;

export async function getHolidayPredictionData() {
  return fetchJson<{
    calculationMode?: string;
    isHolidayMode?: boolean;
    predictionDateIso?: string;
    predictionDate?: string;
    prevClose?: number | null;
    prevCloseDate?: string;
    pointPrediction?: number | null;
    predictedChangePct?: number | null;
    clockSyncUsed?: boolean;
    clockSyncPoint?: number | null;
    clockSyncSource?: string | null;
    clockSyncAnchorKind?: string | null;
    clockSyncEwyFxReferencePoint?: number | null;
    ewyFxReferencePoint?: number | null;
    ewyFxReferenceGeneratedAt?: string | null;
    rangeLow?: number | null;
    rangeHigh?: number | null;
    ewyBaselineDate?: string;
    ewyBaselineClose?: number | null;
    ewyCurrentPrice?: number | null;
    ewyLogReturnPct?: number | null;
    krwBaselineClose?: number | null;
    krwCurrentRate?: number | null;
    krwLogReturnPct?: number | null;
    model?: { engine?: string; fitR2?: number | null };
    generatedAt?: string;
  }>("holiday_prediction.json");
}

export async function getHolidayPredictionSeriesData() {
  return fetchJson<{
    generatedAt?: string;
    predictionDateIso?: string;
    records: Array<{
      predictionDateIso: string;
      observedAt: string;
      kstTime?: string;
      pointPrediction?: number | null;
      predictedChangePct?: number | null;
      ewyLogReturnPct?: number | null;
      krwLogReturnPct?: number | null;
      clockSyncUsed?: boolean;
      clockSyncAnchorKind?: string | null;
    }>;
  }>("holiday_prediction_series.json");
}

export async function getHolidayHistoryData() {
  return fetchJson<{
    generatedAt?: string;
    records: Array<{
      date: string;
      model2Prediction?: number | null;
      rangeLow?: number | null;
      rangeHigh?: number | null;
      prevClose?: number | null;
      actualOpen?: number | null;
      predictionGeneratedAt?: string;
    }>;
  }>("holiday_history.json");
}

export async function getDataFreshness() {
  const [prediction, indicators, history] = await Promise.all([
    getPredictionData(),
    getIndicatorData(),
    getHistoryData(),
  ]);

  return calculateDataFreshness(prediction, indicators, history);
}
