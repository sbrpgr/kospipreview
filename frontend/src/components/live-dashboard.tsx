"use client";

import { useEffect, useRef, useState } from "react";
import { AccuracyTable } from "@/components/accuracy-table";
import { ChartSection } from "@/components/chart-section";
import { IndicatorList } from "@/components/indicator-list";
import { NoticeContent } from "@/components/notice-content";
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

const POLL_INTERVAL_MS = 30_000;
const OPERATION_STATUS_INTERVAL_MS = 30_000;
const NIGHT_OPERATION_HOURS_LABEL = "18:00~09:00";
const NIGHT_OPERATION_START_MINUTES = 18 * 60;
const NIGHT_OPERATION_END_MINUTES = 9 * 60;

type MarketOperationInfo = {
  hoursLabel: string;
  statusLabel: string;
};

function getMarketOperationInfo(now: Date = new Date()): MarketOperationInfo {
  const parts = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).formatToParts(now);

  const weekday = parts.find((part) => part.type === "weekday")?.value ?? "";
  const hour = Number(parts.find((part) => part.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((part) => part.type === "minute")?.value ?? "0");
  const minutesSinceMidnight = hour * 60 + minute;

  if (weekday === "Sat" || weekday === "Sun") {
    return {
      hoursLabel: NIGHT_OPERATION_HOURS_LABEL,
      statusLabel: "휴장",
    };
  }

  const isNightOperationWindow =
    minutesSinceMidnight >= NIGHT_OPERATION_START_MINUTES || minutesSinceMidnight < NIGHT_OPERATION_END_MINUTES;

  return {
    hoursLabel: NIGHT_OPERATION_HOURS_LABEL,
    statusLabel: isNightOperationWindow ? "운영 중" : "운영 대기",
  };
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

function pickLatestRecordDate(historyDate: string | null | undefined, predictionDate: string | null | undefined) {
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
      ? `최근 반영 일자는 ${latestRecordDate} 기준입니다. 지표마다 갱신 주기가 다르므로 최신 값은 출처에서 확인해 주세요.`
      : "최근 반영 일자를 확인하지 못했습니다. 지표마다 갱신 주기가 다르므로 최신 값은 출처에서 확인해 주세요.";
  }

  if (status === "aging") {
    return "해외 지표 마감 시각과 배포 주기에 따라 반영 지연이 있을 수 있습니다. 최신 값은 출처에서 확인해 주세요.";
  }

  return "지표별 갱신 주기가 다르므로 최신 데이터는 각 지표의 데이터 출처에서 직접 확인해 주세요.";
}

function getDashboardVersion(
  prediction: PredictionData,
  indicators: IndicatorData,
  history: HistoryData,
  freshness: FreshnessData,
) {
  const historyFingerprint = history.records
    .map((record) =>
      [
        record.date,
        record.modelPrediction ?? "",
        record.nightFuturesSimpleOpen ?? "",
        record.low,
        record.high,
        record.actualOpen,
        record.hit ? "1" : "0",
      ].join("~"),
    )
    .join(";");

  return [
    prediction.generatedAt ?? "",
    prediction.lastCalculatedAt ?? "",
    prediction.predictionDateIso ?? "",
    prediction.pointPrediction,
    prediction.nightFuturesSimplePoint ?? "",
    prediction.nightFuturesSimpleChangePct ?? "",
    prediction.futuresDayClose ?? "",
    prediction.futuresDayCloseDate ?? "",
    getIndicatorsVersion(indicators),
    history.generatedAt ?? "",
    historyFingerprint,
    freshness.newestModifiedAt,
  ].join("|");
}

function getIndicatorsVersion(indicators: IndicatorData) {
  const indicatorFingerprint = [...indicators.primary, ...indicators.secondary]
    .map((indicator) =>
      [
        indicator.key,
        indicator.value,
        indicator.changePct,
        indicator.updatedAt,
        indicator.referenceValue ?? "",
        indicator.referenceDate ?? "",
        indicator.displayTag ?? "",
        indicator.isPremarket ? "1" : "0",
      ].join("~"),
    )
    .join(";");

  return [indicators.generatedAt ?? "", getLatestIndicatorUpdate(indicators), indicatorFingerprint].join("|");
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

async function fetchIndicatorsPayload() {
  const indicators = await fetchJson<IndicatorData>("/data/indicators.json");
  return {
    indicators,
    indicatorsVersion: getIndicatorsVersion(indicators),
  };
}

async function fetchDashboardPayload(indicators: IndicatorData) {
  const [prediction, history] = await Promise.all([
    fetchJson<PredictionData>("/data/prediction.json"),
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
  const [hasSyncedOnce, setHasSyncedOnce] = useState(false);
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(initialFreshness.newestModifiedAt);
  const [isSyncing, setIsSyncing] = useState(false);
  const [marketOperation, setMarketOperation] = useState<MarketOperationInfo>(() => getMarketOperationInfo());
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
        const indicatorSnapshot = await fetchIndicatorsPayload();
        if (cancelled) {
          return;
        }

        const next = await fetchDashboardPayload(indicatorSnapshot.indicators);
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

        setHasSyncedOnce(true);
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

  useEffect(() => {
    const updateOperationStatus = () => {
      setMarketOperation(getMarketOperationInfo());
    };

    updateOperationStatus();
    const timer = window.setInterval(updateOperationStatus, OPERATION_STATUS_INTERVAL_MS);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  const statusMessage = getStatusMeta(freshness.status, freshness.latestRecordDate);
  const hasLiveSnapshot = hasSyncedOnce;
  const nightSimplePoint =
    hasLiveSnapshot && typeof prediction.nightFuturesSimplePoint === "number" ? prediction.nightFuturesSimplePoint : null;
  const nightSimpleChangePct =
    hasLiveSnapshot && typeof prediction.nightFuturesSimpleChangePct === "number"
      ? prediction.nightFuturesSimpleChangePct
      : null;
  const futuresDayClose =
    hasLiveSnapshot && typeof prediction.futuresDayClose === "number" ? prediction.futuresDayClose : null;
  const futuresDayCloseDate = prediction.futuresDayCloseDate ?? "";
  const isModelForecastReady =
    hasLiveSnapshot && Number.isFinite(prediction.pointPrediction) && Number.isFinite(prediction.predictedChangePct);

  return (
    <div className="pageContainer">
      <SiteHeader status={freshness.status} isSyncing={isSyncing} />

      <main>
        <section className="card heroSection">
          <h1 className="pageSeoTitle">{prediction.predictionDate} 코스피 시초가 예측 및 시장 지표 대시보드</h1>
          <div className="heroTopLine">
            <div className="heroDate">{prediction.predictionDate} 코스피 시초가 전망</div>
            <div className="heroMeta">
              <div className="heroMetaChip">
                운영시간 {marketOperation.hoursLabel} · 운영상태 {marketOperation.statusLabel}
              </div>
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
                  ? "(장 시작전)"
                  : `${nightSimpleChangePct >= 0 ? "상방" : "하방"} ${Math.abs(nightSimpleChangePct).toFixed(2)}%`}
              </div>
              <div className="heroForecastMeta">
                {futuresDayClose === null
                  ? "주간선물 종가 (장 시작전)"
                  : `주간선물 종가 ${futuresDayClose.toLocaleString("ko-KR")}${futuresDayCloseDate ? ` (${futuresDayCloseDate})` : ""}`}
              </div>
            </div>
            <div className="heroForecastCard isModel">
              <div className="heroForecastLabel">모델 예측 (야간 선물 지표 완전 미사용)</div>
              <div className="heroForecastValue">
                {isModelForecastReady ? prediction.pointPrediction.toLocaleString("ko-KR") : "-"}
              </div>
              <div
                className={`heroForecastChange ${
                  !isModelForecastReady ? "isNeu" : prediction.predictedChangePct >= 0 ? "isPos" : "isNeg"
                }`}
              >
                {isModelForecastReady
                  ? `${prediction.predictedChangePct >= 0 ? "상방" : "하방"} ${Math.abs(prediction.predictedChangePct).toFixed(2)}%`
                  : "-"}
              </div>
            </div>
          </div>

          <div className="heroBand">
            {isModelForecastReady
              ? `모델 예상 밴드 ${prediction.rangeLow.toLocaleString("ko-KR")} ~ ${prediction.rangeHigh.toLocaleString("ko-KR")}`
              : "모델 예상 밴드 -"}
          </div>

          <div className="heroMessage">
              {!hasLiveSnapshot
                ? "최신 데이터 확인 중입니다."
                : isModelForecastReady
                  ? prediction.signalSummary
                  : "모델 예측값은 EWY·환율 기반 데이터가 준비되면 표시됩니다."}
          </div>
          <div className="heroFootnote">{statusMessage}</div>
        </section>

        <div className="sectionTitleRow">
          <h2 className="sectionTitle">시장 지표 (야후 파이낸스)</h2>
          <div className="liveMetaBadge">
            <span className="liveMetaDot" />
            지표별 갱신 주기 상이
          </div>
        </div>
        <div className="sectionSubtext">
          지표별 갱신 주기가 다르므로 최신 데이터는 각 지표의 데이터 출처에서 직접 확인해 주시기 바랍니다. 야간선물 데이터는 지연될 수
          있으며 실시간 정보가 아닐 수 있으므로 투자 참고용으로만 활용해 주시기 바랍니다.
        </div>
        {hasLiveSnapshot ? (
          <IndicatorList indicators={indicators} />
        ) : (
          <div className="card sectionLoadingCard">
            <div className="sectionLoadingText">시장 지표를 동기화하는 중입니다.</div>
          </div>
        )}

        {hasLiveSnapshot ? (
          <ChartSection history={history} />
        ) : (
          <div className="card sectionLoadingCard chartLoadingCard">
            <div className="sectionLoadingText">최근 예측 차트를 준비하는 중입니다.</div>
          </div>
        )}

        <h2 className="sectionTitle" style={{ marginTop: "60px" }}>
          최근 실측 기록
        </h2>
        {hasLiveSnapshot ? (
          <AccuracyTable history={history} prediction={prediction} />
        ) : (
          <div className="card sectionLoadingCard">
            <div className="sectionLoadingText">최근 실측 기록을 동기화하는 중입니다.</div>
          </div>
        )}

        <NoticeContent />
      </main>

      <footer className="footer">
        <div>© 2026 KOSPI Dawn. Forecast dashboard for KOSPI opening range.</div>
        <div className="footerAdNotice">본 사이트에는 서비스 운영을 위한 광고가 포함될 수 있습니다.</div>
        <div className="footerContactNotice">
          문의 이메일: <a href="mailto:ytbtheguy@gmail.com">ytbtheguy@gmail.com</a>
        </div>
        <div className="footerLinks">
          <a href="/history">최근 예측 기록</a>
          <a href="/about">모델 설명</a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/disclaimer">면책 및 광고 고지</a>
          <a href="/contact">문의</a>
          <a href="/operations-policy">운영정책</a>
        </div>
      </footer>
    </div>
  );
}
