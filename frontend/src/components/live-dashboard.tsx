"use client";

import { useEffect, useRef, useState } from "react";
import { AccuracyTable } from "@/components/accuracy-table";
import { ChartSection } from "@/components/chart-section";
import { IndicatorList } from "@/components/indicator-list";
import { SiteHeader } from "@/components/site-header";
import type { HistoryData, IndicatorData, PredictionData } from "@/lib/data";

type FreshnessData = {
  status: "fresh" | "aging" | "stale";
  ageHours: number;
  newestModifiedAt: string;
  latestRecordDate: string | null;
};

type LiveDashboardProps = {
  initialPrediction: PredictionData;
  initialIndicators: IndicatorData;
  initialHistory: HistoryData;
  initialFreshness: FreshnessData;
};

const POLL_INTERVAL_MS = 60_000;

function formatCompactTimestamp(value: string) {
  const date = new Date(value);
  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value ?? "0000";
  const month = parts.find((part) => part.type === "month")?.value ?? "00";
  const day = parts.find((part) => part.type === "day")?.value ?? "00";
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";

  return `${year}:${month}:${day}:${hour}:${minute}`;
}

function getLatestIndicatorUpdate(indicators: IndicatorData) {
  return (
    [...indicators.primary, ...indicators.secondary]
      .map((indicator) => indicator.updatedAt)
      .filter(Boolean)
      .sort()
      .at(-1) ?? indicators.generatedAt ?? new Date().toISOString()
  );
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

function getStatusMeta(status: FreshnessData["status"], latestRecordDate: string | null) {
  if (status === "stale") {
    return latestRecordDate
      ? `최근 반영 일자는 ${latestRecordDate} 기준입니다. 자동 갱신 파이프라인 점검이 필요합니다.`
      : "최근 반영 일자를 확인하지 못했습니다. 자동 갱신 상태를 점검해 주세요.";
  }

  if (status === "aging") {
    return "데이터를 계속 확인 중입니다. 해외 지표 마감 시각과 배포 주기에 따라 반영이 조금 늦어질 수 있습니다.";
  }

  return "브라우저가 1분마다 최신 배포 데이터를 다시 확인합니다. 페이지를 새로고침하지 않아도 지표 값이 자동으로 바뀝니다.";
}

function getDashboardVersion(
  prediction: PredictionData,
  indicators: IndicatorData,
  history: HistoryData,
  freshness: FreshnessData,
) {
  const firstPrimary = indicators.primary[0]?.value ?? "";
  const firstSecondary = indicators.secondary[0]?.value ?? "";
  const latestRecord = history.records[0]?.date ?? "";

  return [
    prediction.generatedAt ?? "",
    prediction.lastCalculatedAt ?? "",
    prediction.pointPrediction,
    prediction.nightFuturesSimplePoint ?? "",
    prediction.nightFuturesSimpleChangePct ?? "",
    indicators.generatedAt ?? "",
    getLatestIndicatorUpdate(indicators),
    firstPrimary,
    firstSecondary,
    history.generatedAt ?? "",
    latestRecord,
    freshness.newestModifiedAt,
  ].join("|");
}

async function fetchJson<T>(path: string) {
  const response = await fetch(`${path}?t=${Date.now()}`, {
    cache: "no-store",
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json() as Promise<T>;
}

async function fetchDashboardPayload() {
  const [prediction, indicators, history] = await Promise.all([
    fetchJson<PredictionData>("/data/prediction.json"),
    fetchJson<IndicatorData>("/data/indicators.json"),
    fetchJson<HistoryData>("/data/history.json"),
  ]);

  const timestamps = [
    prediction.lastCalculatedAt,
    prediction.generatedAt,
    history.generatedAt,
    indicators.generatedAt,
    getLatestIndicatorUpdate(indicators),
  ]
    .filter(Boolean)
    .map((value) => new Date(value as string).getTime())
    .filter((value) => !Number.isNaN(value));

  const newestModifiedAt = timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : new Date().toISOString();
  const latestRecordDate = pickLatestRecordDate(history.records[0]?.date, prediction.latestRecordDate);
  const ageHours = (Date.now() - new Date(newestModifiedAt).getTime()) / (1000 * 60 * 60);
  const latestRecordAgeDays = latestRecordDate
    ? (Date.now() - new Date(`${latestRecordDate}T00:00:00+09:00`).getTime()) / (1000 * 60 * 60 * 24)
    : Number.POSITIVE_INFINITY;

  let status: FreshnessData["status"] = "fresh";
  if (ageHours > 12 || latestRecordAgeDays > 2.2) {
    status = "aging";
  }
  if (ageHours > 24 || latestRecordAgeDays > 4) {
    status = "stale";
  }

  const freshness = {
    status,
    ageHours: Number(ageHours.toFixed(1)),
    newestModifiedAt,
    latestRecordDate,
  } satisfies FreshnessData;

  return {
    prediction,
    indicators,
    history,
    freshness,
    version: getDashboardVersion(prediction, indicators, history, freshness),
  };
}

export function LiveDashboard({
  initialPrediction,
  initialIndicators,
  initialHistory,
  initialFreshness,
}: LiveDashboardProps) {
  const [prediction, setPrediction] = useState(initialPrediction);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [history, setHistory] = useState(initialHistory);
  const [freshness, setFreshness] = useState(initialFreshness);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(initialFreshness.newestModifiedAt);
  const [isSyncing, setIsSyncing] = useState(false);
  const versionRef = useRef(getDashboardVersion(initialPrediction, initialIndicators, initialHistory, initialFreshness));

  useEffect(() => {
    let cancelled = false;
    let pollTimer: number | null = null;

    const syncDashboard = async () => {
      if (cancelled) {
        return;
      }

      setIsSyncing(true);

      try {
        const next = await fetchDashboardPayload();
        if (cancelled) {
          return;
        }

        if (next.version !== versionRef.current) {
          versionRef.current = next.version;
          setPrediction(next.prediction);
          setIndicators(next.indicators);
          setHistory(next.history);
          setFreshness(next.freshness);
          setLastChangedAt(next.freshness.newestModifiedAt);
        }

        setLastCheckedAt(new Date().toISOString());
      } catch {
        if (!cancelled) {
          setLastCheckedAt(new Date().toISOString());
        }
      } finally {
        if (!cancelled) {
          setIsSyncing(false);
        }
      }
    };

    const scheduleNextPoll = () => {
      if (!cancelled) {
        pollTimer = window.setTimeout(async () => {
          await syncDashboard();
          scheduleNextPoll();
        }, POLL_INTERVAL_MS);
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void syncDashboard();
      }
    };

    void syncDashboard();
    scheduleNextPoll();

    window.addEventListener("focus", handleVisibilityChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      if (pollTimer !== null) {
        window.clearTimeout(pollTimer);
      }
      window.removeEventListener("focus", handleVisibilityChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  const latestIndicatorUpdate = getLatestIndicatorUpdate(indicators);
  const marketTimestampLabel = formatCompactTimestamp(latestIndicatorUpdate);
  const deployTimestampLabel = formatCompactTimestamp(
    indicators.generatedAt ?? prediction.generatedAt ?? freshness.newestModifiedAt,
  );
  const checkedTimestampLabel = lastCheckedAt ? formatCompactTimestamp(lastCheckedAt) : "-";
  const changedTimestampLabel = lastChangedAt ? formatCompactTimestamp(lastChangedAt) : "-";
  const statusMessage = getStatusMeta(freshness.status, freshness.latestRecordDate);
  const nightSimplePoint = typeof prediction.nightFuturesSimplePoint === "number" ? prediction.nightFuturesSimplePoint : null;
  const nightSimpleChangePct =
    typeof prediction.nightFuturesSimpleChangePct === "number" ? prediction.nightFuturesSimpleChangePct : null;

  return (
    <div className="pageContainer">
      <SiteHeader status={freshness.status} isSyncing={isSyncing} />

      <main>
        <section className="card heroSection">
          <div className="heroTopLine">
            <div className="heroDate">{prediction.predictionDate} 코스피 시초가 전망</div>
            <div className="heroMeta">
              <div className="heroMetaChip">30일 평균 오차: {prediction.mae30d.toFixed(2)}pt</div>
            </div>
          </div>

          <div className="heroDualForecast">
            <div className="heroForecastCard">
              <div className="heroForecastLabel">야간선물 단순환산</div>
              <div className="heroForecastValue">{nightSimplePoint?.toLocaleString("ko-KR") ?? "-"}</div>
              <div
                className={`heroForecastChange ${
                  nightSimpleChangePct === null ? "isNeu" : nightSimpleChangePct >= 0 ? "isPos" : "isNeg"
                }`}
              >
                {nightSimpleChangePct === null
                  ? "데이터 미연결"
                  : `${nightSimpleChangePct >= 0 ? "상방" : "하방"} ${Math.abs(nightSimpleChangePct).toFixed(2)}%`}
              </div>
            </div>
            <div className="heroForecastCard isModel">
              <div className="heroForecastLabel">모델 예측</div>
              <div className="heroForecastValue">{prediction.pointPrediction.toLocaleString("ko-KR")}</div>
              <div className={`heroForecastChange ${prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"}`}>
                {prediction.predictedChangePct >= 0 ? "상방" : "하방"} {Math.abs(prediction.predictedChangePct).toFixed(2)}%
              </div>
            </div>
          </div>

          <div className="heroBand">
            모델 예상 밴드 {prediction.rangeLow.toLocaleString("ko-KR")} ~ {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>

          <div className="heroMessage">{prediction.signalSummary}</div>
          <div className="heroFootnote">{statusMessage}</div>
        </section>

        <div className="sectionTitleRow">
          <h2 className="sectionTitle">시장 지표 (야후 파이낸스)</h2>
          <div className="liveMetaBadge">
            <span className="liveMetaDot" />
            1분 단위 자동 확인
          </div>
        </div>
        <div className="sectionSubtext">
          시장지표 (1분 단위 확인 · 최종시장시각 {marketTimestampLabel} KST · 사이트반영시각 {deployTimestampLabel} KST
          {" · "}마지막확인 {checkedTimestampLabel} KST · 마지막변경 {changedTimestampLabel} KST)
          {" · "}장전 시간(미국 ET 04:00~09:30)에 추적 불가 항목은 카드에 (장전)으로 표기됩니다.
        </div>
        <IndicatorList indicators={indicators} />

        <ChartSection history={history} />

        <h2 className="sectionTitle" style={{ marginTop: "60px" }}>
          최근 실측 기록
        </h2>
        <AccuracyTable history={history} />
      </main>

      <footer className="footer">
        <div>© 2026 KOSPI Dawn. Forecast dashboard for KOSPI opening range.</div>
        <div className="footerLinks">
          <a href="/about">모델 설명</a>
          <a href="/privacy">개인정보처리방침</a>
        </div>
      </footer>
    </div>
  );
}
