/**
 * data.ts
 *
 * 데이터 소스 전략:
 *  - 환경변수 DATA_BASE_URL이 있으면 그 URL을 base로 사용
 *  - 없으면 로컬 개발용으로 /api/* 라우트를 통해 파일 시스템에서 읽음
 *    (로컬 개발 전용: lib/data-local.ts 에서 fs.readFile 사용)
 *
 * 배포 환경(Vercel):
 *  DATA_BASE_URL=https://raw.githubusercontent.com/{owner}/{repo}/{branch}/data
 */

const DATA_BASE_URL = process.env.DATA_BASE_URL ?? "";

const DATA_FILES = [
  "prediction.json",
  "indicators.json",
  "history.json",
  "backtest_diagnostics.json",
] as const;

type DataFileName = (typeof DATA_FILES)[number];

async function fetchJson<T>(fileName: DataFileName): Promise<T> {
  // 배포 환경: GitHub Raw URL 등 외부 소스에서 fetch
  if (DATA_BASE_URL) {
    const url = `${DATA_BASE_URL}/${fileName}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${fileName} from ${url}: ${res.status}`);
    }
    return res.json() as Promise<T>;
  }

  // 로컬 개발 환경: 파일 시스템 직접 접근
  const { promises: fs } = await import("node:fs");
  const path = await import("node:path");
  const filePath = path.join(process.cwd(), "..", "data", fileName);
  const content = await fs.readFile(filePath, "utf8");
  return JSON.parse(content) as T;
}

export type PredictionData = Awaited<ReturnType<typeof getPredictionData>>;
export type IndicatorData = Awaited<ReturnType<typeof getIndicatorData>>;
export type HistoryData = Awaited<ReturnType<typeof getHistoryData>>;
export type BacktestDiagnosticsData = Awaited<
  ReturnType<typeof getBacktestDiagnosticsData>
>;
export type DataFreshness = Awaited<ReturnType<typeof getDataFreshness>>;

export async function getPredictionData() {
  return fetchJson<{
    marketStatus: string;
    currentTimeKst: string;
    predictionDate: string;
    rangeLow: number;
    rangeHigh: number;
    pointPrediction: number;
    predictedChangePct: number;
    confidence: number;
    confidenceLabel: string;
    signalSummary: string;
    lastCalculatedAt: string;
    bandHitRate30d: number;
    directionHitRate30d: number;
    mae30d: number;
    yesterday: {
      predictionLow: number;
      predictionHigh: number;
      actualOpen: number;
      hit: boolean;
    };
    model: {
      modelA: number;
      modelB: number;
      divergencePct: number;
      bandMultiplier: number;
      vix: number;
      selectedFeatures?: string[];
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
    }>;
    secondary: Array<{
      key: string;
      label: string;
      value: string;
      changePct: number;
      updatedAt: string;
    }>;
  }>("indicators.json");
}

export async function getHistoryData() {
  return fetchJson<{
    summary: {
      bandHitRate30d: number;
      directionHitRate30d: number;
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
    selectedModel: {
      features: string[];
      coefficients: Record<string, number>;
      rmse: number;
      mae: number;
      bandHitRate: number;
      directionHitRate: number;
    };
    candidateRanking: Array<{
      rank: number;
      features: string[];
      rmse: number;
      mae: number;
      bandHitRate: number;
      directionHitRate: number;
      avgPValue: number;
      avgVif: number;
    }>;
    recent30Diagnostics: Array<{
      date: string;
      predOpen: number;
      actualOpen: number;
      error: number;
      absError: number;
      bandLow: number;
      bandHigh: number;
      hit: boolean;
      directionHit: boolean;
    }>;
  }>("backtest_diagnostics.json");
}

/**
 * 데이터 신선도 계산
 * Vercel 환경에서는 파일 mtime을 알 수 없으므로,
 * prediction.json의 lastCalculatedAt 필드를 기준으로 판단합니다.
 */
export async function getDataFreshness(): Promise<{
  status: "fresh" | "aging" | "stale";
  ageHours: number;
  newestModifiedAt: string;
  oldestModifiedAt: string;
  files: { fileName: string; modifiedAt: string }[];
}> {
  const prediction = await getPredictionData();
  const updatedAt = prediction.lastCalculatedAt;
  const ageHours =
    (Date.now() - new Date(updatedAt).getTime()) / (1000 * 60 * 60);

  let status: "fresh" | "aging" | "stale" = "fresh";
  if (ageHours >= 36) {
    status = "stale";
  } else if (ageHours >= 18) {
    status = "aging";
  }

  const fileEntry = { fileName: "prediction.json", modifiedAt: updatedAt };

  return {
    status,
    ageHours: Number(ageHours.toFixed(1)),
    newestModifiedAt: updatedAt,
    oldestModifiedAt: updatedAt,
    files: DATA_FILES.map((f) => ({
      fileName: f,
      modifiedAt: updatedAt,
    })),
  };
}
