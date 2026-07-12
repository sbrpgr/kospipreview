"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AccuracyTable } from "@/components/accuracy-table";
import { ModelDiagnostics } from "@/components/model-diagnostics";
import { SiteHeader } from "@/components/site-header";
import {
  type BacktestDiagnosticsData,
  type HistoryData,
  type HolidayHistoryData,
  type HolidayPredictionData,
  type IndicatorData,
  type PredictionData,
} from "@/lib/data";
import { calculateDataFreshness, type DataFreshness } from "@/lib/data-freshness";
import {
  getClientDataUrl,
  getLiveDashboardClientUrl,
  getLiveHolidayDashboardClientUrl,
  getStaticDataUrl,
} from "@/lib/data-paths";

type HistoryLivePageProps = {
  initialHistory: HistoryData;
  initialPrediction: PredictionData;
  initialDiagnostics: BacktestDiagnosticsData;
  initialFreshness: DataFreshness;
  initialHolidayHistory: HolidayHistoryData;
  initialHolidayPrediction: HolidayPredictionData;
};

type DashboardPayload = {
  prediction?: PredictionData;
  indicators?: IndicatorData;
  history?: HistoryData;
};

type HolidayDashboardPayload = {
  holidayPrediction?: HolidayPredictionData;
  holidayHistory?: HolidayHistoryData;
};

const POLL_INTERVAL_MS = 60_000;
const FETCH_TIMEOUT_MS = 15_000;

async function fetchJson<T>(url: string, fallbackUrl?: string): Promise<T> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    let response = await fetch(url, { signal: controller.signal });
    if (!response.ok && fallbackUrl) {
      response = await fetch(fallbackUrl, { signal: controller.signal });
    }
    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }
    return response.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function fetchDashboardPayload() {
  try {
    const payload = await fetchJson<DashboardPayload>(getLiveDashboardClientUrl());
    if (payload.prediction && payload.indicators && payload.history) {
      return {
        prediction: payload.prediction,
        indicators: payload.indicators,
        history: payload.history,
      };
    }
  } catch {
    // Keep the legacy per-file fallback available during API incidents.
  }

  const [prediction, indicators, history] = await Promise.all([
    fetchJson<PredictionData>(getClientDataUrl("prediction.json"), getStaticDataUrl("prediction.json")),
    fetchJson<IndicatorData>(getClientDataUrl("indicators.json"), getStaticDataUrl("indicators.json")),
    fetchJson<HistoryData>(getClientDataUrl("history.json"), getStaticDataUrl("history.json")),
  ]);
  return { prediction, indicators, history };
}

async function fetchHolidayPayload() {
  try {
    const payload = await fetchJson<HolidayDashboardPayload>(getLiveHolidayDashboardClientUrl());
    if (payload.holidayPrediction && payload.holidayHistory) {
      return {
        prediction: payload.holidayPrediction,
        history: payload.holidayHistory,
      };
    }
  } catch {
    // Keep the legacy per-file fallback available during API incidents.
  }

  const [prediction, history] = await Promise.all([
    fetchJson<HolidayPredictionData>(
      getClientDataUrl("holiday_prediction.json"),
      getStaticDataUrl("holiday_prediction.json"),
    ),
    fetchJson<HolidayHistoryData>(getClientDataUrl("holiday_history.json"), getStaticDataUrl("holiday_history.json")),
  ]);
  return { prediction, history };
}

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function HistoryLivePage({
  initialHistory,
  initialPrediction,
  initialDiagnostics,
  initialFreshness,
  initialHolidayHistory,
  initialHolidayPrediction,
}: HistoryLivePageProps) {
  const [history, setHistory] = useState(initialHistory);
  const [prediction, setPrediction] = useState(initialPrediction);
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const [freshness, setFreshness] = useState(initialFreshness);
  const [holidayHistory, setHolidayHistory] = useState(initialHolidayHistory);
  const [holidayPrediction, setHolidayPrediction] = useState(initialHolidayPrediction);
  const [isSyncing, setIsSyncing] = useState(false);
  const inFlightRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | null = null;

    const sync = async () => {
      if (cancelled || inFlightRef.current) {
        return;
      }

      inFlightRef.current = true;
      setIsSyncing(true);
      try {
        const [dashboardResult, holidayResult, diagnosticsResult] = await Promise.allSettled([
          fetchDashboardPayload(),
          fetchHolidayPayload(),
          fetchJson<BacktestDiagnosticsData>(
            getClientDataUrl("backtest_diagnostics.json"),
            getStaticDataUrl("backtest_diagnostics.json"),
          ),
        ]);

        if (cancelled) {
          return;
        }

        if (dashboardResult.status === "fulfilled") {
          const next = dashboardResult.value;
          setPrediction(next.prediction);
          setHistory(next.history);
          setFreshness(calculateDataFreshness(next.prediction, next.indicators, next.history));
        }
        if (holidayResult.status === "fulfilled") {
          setHolidayPrediction(holidayResult.value.prediction);
          setHolidayHistory(holidayResult.value.history);
        }
        if (diagnosticsResult.status === "fulfilled") {
          setDiagnostics(diagnosticsResult.value);
        }
      } finally {
        inFlightRef.current = false;
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    const schedule = () => {
      if (!cancelled) {
        timer = window.setTimeout(async () => {
          if (document.visibilityState === "visible") {
            await sync();
          }
          schedule();
        }, POLL_INTERVAL_MS);
      }
    };

    const handleVisible = () => {
      if (document.visibilityState !== "visible") {
        return;
      }
      if (timer !== null) {
        window.clearTimeout(timer);
        timer = null;
      }
      void sync();
      schedule();
    };

    void sync();
    schedule();
    window.addEventListener("focus", handleVisible);
    document.addEventListener("visibilitychange", handleVisible);

    return () => {
      cancelled = true;
      if (timer !== null) {
        window.clearTimeout(timer);
      }
      window.removeEventListener("focus", handleVisible);
      document.removeEventListener("visibilitychange", handleVisible);
    };
  }, []);

  const currentModel2Prediction = useMemo(() => {
    if (holidayPrediction.predictionDateIso !== prediction.predictionDateIso) {
      return null;
    }
    return typeof holidayPrediction.pointPrediction === "number" ? holidayPrediction.pointPrediction : null;
  }, [holidayPrediction, prediction.predictionDateIso]);

  return (
    <div className="pageContainer">
      <SiteHeader
        lastUpdated={formatUpdatedAt(freshness.newestModifiedAt)}
        status={freshness.status}
        isSyncing={isSyncing}
      />
      <main>
        <h2 className="sectionTitle">예측 기록 상세</h2>
        <div style={{ marginBottom: "60px" }}>
          <AccuracyTable
            history={history}
            prediction={prediction}
            holidayHistory={holidayHistory}
            currentModel2Prediction={currentModel2Prediction}
          />
        </div>
        <h2 className="sectionTitle">모델 백테스트 검증 데이터</h2>
        <div className="prose">
          <ModelDiagnostics diagnostics={diagnostics} />
        </div>
      </main>
    </div>
  );
}
