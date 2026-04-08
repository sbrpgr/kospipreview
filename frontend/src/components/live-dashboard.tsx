"use client";

import { useEffect, useState } from "react";
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

function formatKoreanDateTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

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

function formatKoreanDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${value}T00:00:00+09:00`));
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

function getStatusMeta(status: FreshnessData["status"], latestRecordDate: string | null) {
  if (status === "stale") {
    return latestRecordDate
      ? `최근 반영 일자는 ${latestRecordDate} 기준입니다. 자동 수집이 멈췄을 가능성이 있습니다.`
      : "최근 반영 일자를 확인하지 못했습니다. 자동 수집 상태를 점검해 주세요.";
  }

  if (status === "aging") {
    return "새 데이터를 확인 중입니다. 해외 지표 장마감과 배포 주기에 따라 반영이 조금 늦을 수 있습니다.";
  }

  return "브라우저는 1분마다 최신 배포 데이터를 다시 확인합니다. 실제 데이터 생성과 배포는 평일 5분 주기로 진행됩니다.";
}

async function fetchJson<T>(path: string) {
  const response = await fetch(`${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }
  return response.json() as Promise<T>;
}

async function fetchLatestJson<T>(fileName: string) {
  const githubUrl = `https://raw.githubusercontent.com/sbrpgr/kospipreview/main/frontend/public/data/${fileName}?t=${Date.now()}`;

  try {
    const response = await fetch(githubUrl, { cache: "no-store" });
    if (response.ok) {
      return (await response.json()) as T;
    }
  } catch {
    // Fall back to the currently deployed JSON when GitHub is temporarily unavailable.
  }

  return fetchJson<T>(`/data/${fileName}`);
}

async function fetchDashboardPayload() {
  const [prediction, indicators, history] = await Promise.all([
    fetchLatestJson<PredictionData>("prediction.json"),
    fetchLatestJson<IndicatorData>("indicators.json"),
    fetchLatestJson<HistoryData>("history.json"),
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
  const latestRecordDate = history.records[0]?.date ?? prediction.latestRecordDate ?? null;
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

  return {
    prediction,
    indicators,
    history,
    freshness: {
      status,
      ageHours: Number(ageHours.toFixed(1)),
      newestModifiedAt,
      latestRecordDate,
    } satisfies FreshnessData,
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
  const [currentAt, setCurrentAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const updateCurrentTime = () => {
      if (!cancelled) {
        setCurrentAt(new Date().toISOString());
      }
    };

    const refreshData = async () => {
      setIsSyncing(true);
      try {
        const next = await fetchDashboardPayload();
        if (cancelled) {
          return;
        }

        setPrediction(next.prediction);
        setIndicators(next.indicators);
        setHistory(next.history);
        setFreshness(next.freshness);
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

    updateCurrentTime();
    setLastCheckedAt(new Date().toISOString());
    const initialTimer = window.setTimeout(refreshData, 1000);
    const interval = window.setInterval(refreshData, 60000);
    const clock = window.setInterval(updateCurrentTime, 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
      window.clearInterval(clock);
    };
  }, []);

  const latestRecordDate = freshness.latestRecordDate ? formatKoreanDate(freshness.latestRecordDate) : "데이터 없음";
  const latestIndicatorUpdate = getLatestIndicatorUpdate(indicators);
  const marketTimestampLabel = formatCompactTimestamp(latestIndicatorUpdate);
  const deployTimestampLabel = formatCompactTimestamp(
    indicators.generatedAt ?? prediction.generatedAt ?? freshness.newestModifiedAt,
  );
  const checkedTimestampLabel = lastCheckedAt ? formatCompactTimestamp(lastCheckedAt) : "-";
  const currentTimestampLabel = currentAt ? formatCompactTimestamp(currentAt) : "-";
  const statusMessage = getStatusMeta(freshness.status, freshness.latestRecordDate);

  return (
    <div className="pageContainer">
      <SiteHeader
        dataUpdatedAt={formatKoreanDateTime(freshness.newestModifiedAt)}
        marketUpdatedAt={marketTimestampLabel}
        deployUpdatedAt={deployTimestampLabel}
        currentAt={currentTimestampLabel}
        checkedAt={checkedTimestampLabel}
        status={freshness.status}
        isSyncing={isSyncing}
      />

      <main>
        <section className="card heroSection">
          <div className="heroTopLine">
            <div className="heroDate">{prediction.predictionDate} 코스피 시초가 전망</div>
            <div className="heroMeta">
              <div className="heroMetaChip">최근 실측 반영: {latestRecordDate}</div>
              <div className="heroMetaChip">30일 평균 오차: {prediction.mae30d.toFixed(2)}pt</div>
            </div>
          </div>

          <div className="heroPrice">{prediction.pointPrediction.toLocaleString("ko-KR")}</div>

          <div className="heroChangeLabel">
            <span className={prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"}>
              {prediction.predictedChangePct >= 0 ? "상방" : "하방"} {Math.abs(prediction.predictedChangePct).toFixed(2)}%
            </span>
          </div>

          <div className="heroBand">
            예상 밴드 {prediction.rangeLow.toLocaleString("ko-KR")} ~ {prediction.rangeHigh.toLocaleString("ko-KR")}
          </div>

          <div className="heroMessage">{prediction.signalSummary}</div>
          <div className="heroFootnote">{statusMessage}</div>
        </section>

        <ChartSection history={history} />

        <div className="sectionTitleRow">
          <h2 className="sectionTitle">시장 지표</h2>
          <div className="liveMetaBadge">
            <span className="liveMetaDot" />
            1분마다 새 배포 확인
          </div>
        </div>
        <div className="sectionSubtext">
          시장지표 (최신 시장 기준시각 {marketTimestampLabel} KST · 사이트 반영시각 {deployTimestampLabel} KST · 마지막 확인 {checkedTimestampLabel} KST)
        </div>
        <IndicatorList indicators={indicators} />

        <h2 className="sectionTitle" style={{ marginTop: "60px" }}>
          최근 예측 기록
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
