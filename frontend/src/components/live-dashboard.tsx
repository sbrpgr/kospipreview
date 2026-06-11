"use client";

import { useEffect, useRef, useState } from "react";
import { AccuracyTable } from "@/components/accuracy-table";
import { ChartSection } from "@/components/chart-section";
import { IndicatorList } from "@/components/indicator-list";
import { NoticeContent } from "@/components/notice-content";
import { PredictionTrendChart } from "@/components/prediction-trend-chart";
import { SiteHeader } from "@/components/site-header";
import { HomeTopAdBanner } from "@/components/home-top-ad-banner";
import { getClientDataUrl, getLiveDashboardClientUrl, getStaticDataUrl } from "@/lib/data-paths";
import {
  type HistoryData,
  type HolidayHistoryData,
  type HolidayPredictionData,
  type HolidayPredictionSeriesData,
  type IndicatorData,
  type LivePredictionSeriesData,
  type PredictionData,
} from "@/lib/data";

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
  initialLivePredictionSeries: LivePredictionSeriesData;
  initialFreshness: FreshnessData;
};

type LiveDashboardApiPayload = {
  prediction: PredictionData;
  indicators: IndicatorData;
  history: HistoryData;
  livePredictionSeries: LivePredictionSeriesData;
  sources?: Record<string, string>;
};

const PAPERS_HOME = [
  {
    num: "No. 23",
    href: "/papers/ewy-signal-reversal-error-pattern",
    title: "예측 오차의 연속 방향 역전 패턴과 EWY 신호 진동 메커니즘",
    abstract: "4/23~24 이틀 연속 방향 역전(−155pt → +178pt) 사례를 중심으로 EWY 신호가 이틀 연속 반대 방향으로 크게 벗어나는 구조적 메커니즘을 규명하고, 5/11~12 연속 정밀 적중과의 대비를 통해 사전 탐지 가능성을 제시한다.",
    date: "2026-06-04",
  },
  {
    num: "No. 22",
    href: "/papers/holiday-ewy-direct-prediction-model",
    title: "공휴일 시나리오 코스피 시초가 예측 모델의 설계 원리와 성능 경계",
    abstract: "국내 공휴일 KRX 휴장 + 미국 시장 운영 시나리오에서 야간선물 브릿지 없이 마지막 KRX 거래일 EWY 종가를 기준점으로 삼는 공휴일 전용 예측 모델(모델2)의 설계와 성능 경계를 분석한다.",
    date: "2026-06-04",
  },
  {
    num: "No. 21",
    href: "/papers/kospi-predictability-ceiling-information-entropy",
    title: "코스피 시초가 예측 가능성의 이론적 상한 — Shannon 상호 정보량과 불가예측 엔트로피",
    abstract: "Shannon 상호 정보량으로 EWY 신호의 이론적 최대 예측력과 불가예측 엔트로피 하한(정상 MAE ≥ 4.8pt)을 도출하고, 강한 신호에서 예측력이 역전되는 '정보 과부하 역설'을 실증한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 20",
    href: "/papers/kospi-gap-event-taxonomy",
    title: "코스피 시초가 갭 유발 이벤트의 다각적 분류와 예측 가능성 평가",
    abstract: "대형 갭 138건을 7개 범주로 분류하고 범주별 방향 예측 정확도(38~67%)와 최적 대응 전략을 제시한다. 무역·관세 갭이 평균 187pt로 가장 크고 예측 정확도가 가장 낮다.",
    date: "2026-05-16",
  },
  {
    num: "No. 19",
    href: "/papers/prediction-accuracy-extreme-regime-analysis",
    title: "코스피프리뷰 예측 정확도 극단 구간 분석 — 최고·최저 정확도 레짐의 공통 조건",
    abstract: "고정확도(MAE<8pt, 방향 일치 79.4%)와 저정확도(MAE>30pt, 방향 일치 41.2%) 구간의 공통 선행 조건을 실증하고 정확도 신호등 3색 시스템을 제안한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 17",
    href: "/papers/additional-indices-for-kospi-prediction",
    title: "추가 획득 가능 지수와 신호 체계 — SOX·ADR·DXY 편입 효과 분석",
    abstract: "SOX, 삼성전자 ADR, DXY를 기존 모델에 추가하면 R²가 0.274→0.341로 개선됨을 증분 R² 분석으로 실증하고, 최적 편입 조합을 도출한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 15",
    href: "/papers/dynamic-band-width-mae30d-adjustment",
    title: "MAE30d 연동 동적 예측 밴드 너비 조정 체계",
    abstract: "MAE30d에 연동한 하이브리드 동적 밴드를 설계하고, 충격 레짐에서 적중률을 0%→30.77%로 개선하는 시뮬레이션 결과를 제시한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 14",
    href: "/papers/us10y-nonlinear-impact-on-kospi",
    title: "미국 10년물 금리가 코스피 시초가에 미치는 영향의 비선형성",
    abstract: "US10Y 4.5%를 임계값으로 추정하여, 그 이하에서는 금리 상승이 코스피 호재, 초과 시 악재로 전환되는 비선형 구조를 실증 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 13",
    href: "/papers/simultaneous-quote-information-asymmetry",
    title: "동시호가 8분이 만드는 정보 비대칭",
    abstract: "동시호가 구간에서 기관·외국인 수급이 EWY 신호를 역방향으로 상쇄하는 메커니즘을 실측 케이스로 분석하고 수급 프록시 편입 방향을 논한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 12",
    href: "/papers/krw-regime-ewy-coefficient-shift",
    title: "달러-원 환율 1,400원대 진입 이후 EWY 전달 계수의 구조 변화",
    abstract: "고환율 레짐에서 EWY 계수가 저환율 레짐 대비 14% 압축되는 현상과 메커니즘을 Rolling Ridge 추정으로 규명한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 11",
    href: "/papers/opening-gap-mean-reversion",
    title: "코스피 시초가 갭의 평균 회귀 경향",
    abstract: "100포인트 초과 상방 갭 발생 익일 하방 회귀 확률이 68%임을 실증하고, 대형 갭 익일은 정상 레짐 대비 예측 오차가 2~8배 높은 고난이도 구간임을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 10",
    href: "/papers/prediction-alert-score-design",
    title: "예측 신뢰도 붕괴 사전 감지와 동적 경보 점수 설계",
    abstract: "R², MAE30d, CSI, VIX를 결합한 복합 예측 경보 점수(PAS)를 설계하고 2026년 4월 충격 구간 소급 시뮬레이션으로 경보 성능을 검증한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 9",
    href: "/papers/kospi-24h-tracking-indicators",
    title: "코스피 24시간 추적을 위한 다중 실시간 프록시 지표 체계",
    abstract: "폐장 후 익일 개장까지 17.5시간의 정보 공백을 분해하고 EWY·SOX·금리·원자재 지표별 정보 기여도를 실증 평가하여 복합 24시간 추적 지수를 설계한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 8",
    href: "/papers/night-futures-signal-limitations",
    title: "야간 K200 선물 신호의 구조적 공백과 EWY 대체 신호의 한계",
    abstract: "27거래일 전 기간 야간선물이 null로 기록된 구조적 원인을 규명하고 EWY 대체 신호의 오차 분포와 고변동 구간 과대반응 메커니즘을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 7",
    href: "/papers/multilayer-prediction-architecture",
    title: "코스피 시초가 예측 모델의 계층적 설계 체계",
    abstract: "EWY 코어 레이어, 잔차 Ridge, K200 매핑, 트렌드팔로우 플로어의 4계층 구조와 각 레이어의 설계 철학 및 실증적 기여도를 현재 파라미터와 함께 기술한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 6",
    href: "/papers/total-signal-failure-days",
    title: "전신호 동시 이탈日의 구조적 조건",
    abstract: "모델·EWY·야간선물이 동시에 같은 방향으로 크게 이탈하는 날의 공통 선행 조건을 실측 6건으로 규명하고 상방 편향 비대칭성을 분석한다.",
    date: "2026-05-16",
  },
  {
    num: "No. 5",
    href: "/papers/ewy-time-varying-coefficient",
    title: "EWY-코스피 가격 전달 계수의 시변성과 투자 의사결정 함의",
    abstract: "Rolling Ridge 추정을 통해 EWY-코스피 전달 계수(β)의 시변성을 분석하고 R² 및 MAE30d를 실시간 모델 신뢰도 지표로 활용하는 동적 체계를 제안한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 4",
    href: "/papers/opening-gap-asymmetry",
    title: "코스피 개장 갭 형성의 비대칭성과 통계 모델의 하방 리스크 과소추정 문제",
    abstract: "코스피 시초가 갭의 상·하방 비대칭성을 실측 데이터로 확인하고 이산적 정치 충격에 의한 극단 갭 과소추정 메커니즘과 투자적 함의를 분석한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 3",
    href: "/papers/signal-convergence-index",
    title: "다중 예측 신호 수렴도 지수(CSI)의 시초가 예측 불확실성 대용변수 활용 연구",
    abstract: "세 예측 신호의 발산 폭을 정량화한 수렴도 지수(CSI)가 당일 예측 오차의 유효한 선행지표인지를 실증적으로 검증한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 2",
    href: "/papers/regime-dependent-accuracy",
    title: "시장 레짐 전환이 코스피 시초가 예측 정확도에 미치는 구조적 영향",
    abstract: "2026년 4월 관세 충격 전후 실측 데이터를 이용해 VIX 임계값 기반 레짐 분류가 예측 정확도에 미치는 구조적 영향을 분석한다.",
    date: "2026-05-15",
  },
  {
    num: "No. 1",
    href: "/papers/oil-fx-ewy-kospi-model",
    title: "유가·환율·EWY 복합 신호를 활용한 코스피 시초가 예측모델 개발 연구",
    abstract: "WTI 유가, 달러-원 환율, EWY ETF 세 신호의 독립 설명력과 최적 조합을 실증 분석하고 Ridge 회귀 기반 복합 예측모델의 구조와 한계를 규명한다.",
    date: "2026-05-15",
  },
] as const;

const POLL_INTERVAL_MS = 60_000;
const OPERATION_STATUS_INTERVAL_MS = 30_000;
const NIGHT_OPERATION_HOURS_LABEL = "17:00~09:00(변동 가능)";
const NIGHT_OPERATION_REOPEN_LABEL = "15:30~";
const NIGHT_OPERATION_START_MINUTES = 15 * 60 + 30;
const NIGHT_OPERATION_END_MINUTES = 9 * 60;

type MarketOperationInfo = {
  hoursLabel: string;
  headerLabel: string;
  state: "operating" | "closed" | "holiday";
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
      headerLabel: "휴장",
      state: "holiday",
      statusLabel: "휴장",
    };
  }

  const isNightOperationWindow =
    minutesSinceMidnight >= NIGHT_OPERATION_START_MINUTES || minutesSinceMidnight < NIGHT_OPERATION_END_MINUTES;

  return {
    hoursLabel: NIGHT_OPERATION_HOURS_LABEL,
    headerLabel: isNightOperationWindow ? "플랫폼 운영중" : `플랫폼 운영 대기 중 (${NIGHT_OPERATION_REOPEN_LABEL})`,
    state: isNightOperationWindow ? "operating" : "closed",
    statusLabel: isNightOperationWindow ? "플랫폼 운영중" : "플랫폼 운영 대기 중",
  };
}

function getLatestIndicatorUpdate(indicators: IndicatorData) {
  return (
    [...indicators.primary, ...indicators.secondary]
      .map((indicator) => indicator.checkedAt || indicator.updatedAt)
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

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function getDisplayModel2Point(model2Point: number | null) {
  return model2Point;
}

function getDashboardVersion(
  prediction: PredictionData,
  indicators: IndicatorData,
  history: HistoryData,
  livePredictionSeries: LivePredictionSeriesData,
  freshness: FreshnessData,
) {
  const historyFingerprint = history.records
    .map((record) =>
      [
        record.date,
        record.modelPrediction ?? "",
        record.nightFuturesSimpleOpen ?? "",
        record.ewyFxSimpleOpen ?? "",
        record.low,
        record.high,
        record.actualOpen,
        record.actualClose ?? "",
        record.dayFuturesClose ?? "",
        record.nightFuturesClose ?? "",
        record.hit ? "1" : "0",
      ].join("~"),
    )
    .join(";");
  const trendFingerprint = livePredictionSeries.records
    .map((record) =>
      [
        record.predictionDateIso,
        record.observedAt,
        record.pointPrediction ?? "",
        record.nightFuturesSimplePoint ?? "",
        record.ewyFxSimplePoint ?? "",
        record.nightFuturesClose ?? "",
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
    prediction.ewyFxSimplePoint ?? "",
    prediction.ewyFxSimpleChangePct ?? "",
    prediction.nightFuturesClose ?? "",
    prediction.futuresDayClose ?? "",
    prediction.futuresDayCloseDate ?? "",
    getIndicatorsVersion(indicators),
    history.generatedAt ?? "",
    historyFingerprint,
    livePredictionSeries.generatedAt ?? "",
    trendFingerprint,
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

async function fetchJson<T>(path: string, fallbackPath?: string) {
  let response = await fetch(path, {
    cache: "no-store",
    headers: {
      pragma: "no-cache",
      "cache-control": "no-cache",
    },
  });

  if (!response.ok && fallbackPath) {
    response = await fetch(fallbackPath, {
      cache: "no-store",
      headers: {
        pragma: "no-cache",
        "cache-control": "no-cache",
      },
    });
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch ${path}`);
  }

  return response.json() as Promise<T>;
}

function buildDashboardPayload(
  prediction: PredictionData,
  indicators: IndicatorData,
  history: HistoryData,
  livePredictionSeries: LivePredictionSeriesData,
) {
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
    livePredictionSeries,
    freshness,
    version: getDashboardVersion(prediction, indicators, history, livePredictionSeries, freshness),
  };
}

async function fetchDashboardPayloadFromBundle() {
  const payload = await fetchJson<LiveDashboardApiPayload>(getLiveDashboardClientUrl());

  if (!payload.prediction || !payload.indicators || !payload.history || !payload.livePredictionSeries) {
    throw new Error("Incomplete live dashboard payload");
  }

  return buildDashboardPayload(payload.prediction, payload.indicators, payload.history, payload.livePredictionSeries);
}

async function fetchDashboardPayloadFromFiles() {
  const [prediction, indicators, history, livePredictionSeries] = await Promise.all([
    fetchJson<PredictionData>(getClientDataUrl("prediction.json"), getStaticDataUrl("prediction.json")),
    fetchJson<IndicatorData>(getClientDataUrl("indicators.json"), getStaticDataUrl("indicators.json")),
    fetchJson<HistoryData>(getClientDataUrl("history.json"), getStaticDataUrl("history.json")),
    fetchJson<LivePredictionSeriesData>(
      getClientDataUrl("live_prediction_series.json"),
      getStaticDataUrl("live_prediction_series.json"),
    ),
  ]);

  return buildDashboardPayload(prediction, indicators, history, livePredictionSeries);
}

async function fetchDashboardPayload() {
  try {
    return await fetchDashboardPayloadFromBundle();
  } catch {
    return fetchDashboardPayloadFromFiles();
  }
}

async function fetchHolidayPayload(): Promise<{
  prediction: HolidayPredictionData;
  series: HolidayPredictionSeriesData;
  history: HolidayHistoryData;
} | null> {
  try {
    const [prediction, series, history] = await Promise.all([
      fetchJson<HolidayPredictionData>(
        getClientDataUrl("holiday_prediction.json"),
        getStaticDataUrl("holiday_prediction.json"),
      ),
      fetchJson<HolidayPredictionSeriesData>(
        getClientDataUrl("holiday_prediction_series.json"),
        getStaticDataUrl("holiday_prediction_series.json"),
      ),
      fetchJson<HolidayHistoryData>(
        getClientDataUrl("holiday_history.json"),
        getStaticDataUrl("holiday_history.json"),
      ),
    ]);
    return { prediction, series, history };
  } catch {
    return null;
  }
}

export function LiveDashboard({
  initialPrediction,
  initialIndicators,
  initialHistory,
  initialLivePredictionSeries,
  initialFreshness,
}: LiveDashboardProps) {
  const [prediction, setPrediction] = useState(initialPrediction);
  const [indicators, setIndicators] = useState(initialIndicators);
  const [history, setHistory] = useState(initialHistory);
  const [livePredictionSeries, setLivePredictionSeries] = useState(initialLivePredictionSeries);
  const [freshness, setFreshness] = useState(initialFreshness);
  const [holidayPrediction, setHolidayPrediction] = useState<HolidayPredictionData | null>(null);
  const [holidaySeries, setHolidaySeries] = useState<HolidayPredictionSeriesData | null>(null);
  const [holidayHistory, setHolidayHistory] = useState<HolidayHistoryData | null>(null);
  const [hasSyncedOnce, setHasSyncedOnce] = useState(
    () => initialIndicators.primary.length > 0
  );
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null);
  const [lastChangedAt, setLastChangedAt] = useState<string | null>(initialFreshness.newestModifiedAt);
  const [isSyncing, setIsSyncing] = useState(false);
  const [marketOperation, setMarketOperation] = useState<MarketOperationInfo>(() => getMarketOperationInfo());
  const versionRef = useRef(
    getDashboardVersion(initialPrediction, initialIndicators, initialHistory, initialLivePredictionSeries, initialFreshness),
  );

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
          setLivePredictionSeries(next.livePredictionSeries);
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
    let cancelled = false;
    let timer: number | null = null;

    const syncHoliday = async () => {
      const payload = await fetchHolidayPayload();
      if (!cancelled && payload) {
        setHolidayPrediction(payload.prediction);
        setHolidaySeries(payload.series);
        setHolidayHistory(payload.history);
      }
    };

    const schedule = () => {
      if (!cancelled) {
        timer = window.setTimeout(async () => {
          await syncHoliday();
          schedule();
        }, POLL_INTERVAL_MS);
      }
    };

    void syncHoliday();
    schedule();

    return () => {
      cancelled = true;
      if (timer !== null) window.clearTimeout(timer);
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
  const ewyFxSimplePoint =
    hasLiveSnapshot && typeof prediction.ewyFxSimplePoint === "number" ? prediction.ewyFxSimplePoint : null;
  const ewyFxSimpleChangePct =
    hasLiveSnapshot && typeof prediction.ewyFxSimpleChangePct === "number" ? prediction.ewyFxSimpleChangePct : null;
  const modelPoint = isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null;
  const modelChangePct = isFiniteNumber(prediction.predictedChangePct) ? prediction.predictedChangePct : null;
  const modelRangeLow = isFiniteNumber(prediction.rangeLow) ? prediction.rangeLow : null;
  const modelRangeHigh = isFiniteNumber(prediction.rangeHigh) ? prediction.rangeHigh : null;
  const isModelForecastReady =
    hasLiveSnapshot &&
    modelPoint !== null &&
    modelChangePct !== null &&
    modelRangeLow !== null &&
    modelRangeHigh !== null;

  const isActiveModel2Target =
    hasLiveSnapshot &&
    isModelForecastReady &&
    typeof holidayPrediction?.predictionDateIso === "string" &&
    holidayPrediction.predictionDateIso === prediction.predictionDateIso;
  const rawModel2Point =
    isActiveModel2Target && isFiniteNumber(holidayPrediction?.pointPrediction) ? holidayPrediction!.pointPrediction! : null;
  const model2Point = getDisplayModel2Point(rawModel2Point);
  const model2ChangePct =
    isActiveModel2Target && model2Point !== null && isFiniteNumber(prediction.prevClose) && prediction.prevClose > 0
      ? (model2Point / prediction.prevClose - 1) * 100
      : isActiveModel2Target && isFiniteNumber(holidayPrediction?.predictedChangePct)
        ? holidayPrediction!.predictedChangePct!
      : null;
  const isModel2Ready = model2Point !== null && model2ChangePct !== null;
  const activeHolidaySeries = (() => {
    if (!isActiveModel2Target) {
      return null;
    }

    const matchingHolidaySeries = holidaySeries?.predictionDateIso === prediction.predictionDateIso ? holidaySeries : null;
    const records = matchingHolidaySeries?.records ?? [];
    if (model2Point === null || typeof prediction.generatedAt !== "string") {
      return matchingHolidaySeries;
    }

    const minuteKey = prediction.generatedAt.slice(0, 16);
    const syncedRecord = {
      predictionDateIso: prediction.predictionDateIso ?? "",
      predictionDate: prediction.predictionDate,
      observedAt: prediction.generatedAt,
      pointPrediction: model2Point,
      predictedChangePct: model2ChangePct,
    };

    return {
      generatedAt: matchingHolidaySeries?.generatedAt ?? holidayPrediction?.generatedAt,
      predictionDateIso: prediction.predictionDateIso,
      records: [
        ...records.filter((record) => record.observedAt.slice(0, 16) !== minuteKey),
        syncedRecord,
      ],
    };
  })();

  return (
    <div className="pageContainer">
      <SiteHeader status={freshness.status} isSyncing={isSyncing} />

      <main>
        <HomeTopAdBanner />

        <section className="card heroSection">
          <h1 className="pageSeoTitle">{prediction.predictionDate} 코스피 시초가 예측 및 시장 지표 대시보드</h1>
          <div className="heroTopLine">
            <div className="heroDate">{prediction.predictionDate} 코스피 시초가 전망</div>
            <div className="heroMeta">
              <div className="heroMetaChip">
                운영시간 {marketOperation.hoursLabel}
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
                  ? "(본 장 시작전)"
                  : `${nightSimpleChangePct >= 0 ? "상방" : "하방"} ${Math.abs(nightSimpleChangePct).toFixed(2)}%`}
              </div>
              <div className="heroForecastMeta">
                {futuresDayClose === null
                  ? "주간선물 종가 (본 장 시작전)"
                  : `주간선물 종가 ${futuresDayClose.toLocaleString("ko-KR")}${futuresDayCloseDate ? ` (${futuresDayCloseDate})` : ""}`}
              </div>
            </div>
            <div className="heroForecastCard isEwyFx">
              <div className="heroForecastLabel">EWY + 환율환산</div>
              <div className="heroForecastValue">{ewyFxSimplePoint?.toLocaleString("ko-KR") ?? "-"}</div>
              <div
                className={`heroForecastChange ${
                  ewyFxSimpleChangePct === null ? "isNeu" : ewyFxSimpleChangePct >= 0 ? "isPos" : "isNeg"
                }`}
              >
                {ewyFxSimpleChangePct === null
                  ? "-"
                  : `${ewyFxSimpleChangePct >= 0 ? "상방" : "하방"} ${Math.abs(ewyFxSimpleChangePct).toFixed(2)}%`}
              </div>
              <div className="heroForecastMeta">EWY와 USD/KRW 기준</div>
            </div>
            <div className="heroForecastCard isModel">
              <div className="heroForecastLabel">모델 예측</div>
              <div className="heroForecastValue">
                {isModelForecastReady ? modelPoint.toLocaleString("ko-KR") : "-"}
              </div>
              <div
                className={`heroForecastChange ${
                  !isModelForecastReady ? "isNeu" : modelChangePct >= 0 ? "isPos" : "isNeg"
                }`}
              >
                {isModelForecastReady
                  ? `${modelChangePct >= 0 ? "상방" : "하방"} ${Math.abs(modelChangePct).toFixed(2)}%`
                  : "-"}
              </div>
            </div>
            <div className="heroForecastCard isModel2">
              <div className="heroForecastLabel">모델2 예측(test)</div>
              <div className="heroForecastValue">
                {isModel2Ready ? model2Point!.toLocaleString("ko-KR") : "-"}
              </div>
              <div
                className={`heroForecastChange ${
                  !isModel2Ready ? "isNeu" : model2ChangePct! >= 0 ? "isPos" : "isNeg"
                }`}
              >
                {isModel2Ready
                  ? `${model2ChangePct! >= 0 ? "상방" : "하방"} ${Math.abs(model2ChangePct!).toFixed(2)}%`
                  : "-"}
              </div>
            </div>
          </div>

          <div className="heroBand">
            {isModelForecastReady
              ? `모델 예상 밴드 ${modelRangeLow.toLocaleString("ko-KR")} ~ ${modelRangeHigh.toLocaleString("ko-KR")}`
              : "모델 예상 밴드 -"}
          </div>

          <div className="heroMessage">
              {!hasLiveSnapshot
                ? "최신 데이터 확인 중입니다."
                : isModelForecastReady
                  ? prediction.signalSummary
                  : prediction.signalSummary || "모델 예측값은 EWY·환율 기반 데이터가 준비되면 표시됩니다."}
          </div>
          <div className="heroFootnote">{statusMessage}</div>
        </section>

        <PredictionTrendChart prediction={prediction} series={livePredictionSeries} holidaySeries={activeHolidaySeries} />

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

        <div className="sectionTitleRow" style={{ marginTop: "48px" }}>
          <h2 className="sectionTitle">연구논문</h2>
          <a href="/papers" style={{ fontSize: "0.85rem", color: "var(--brand)", textDecoration: "none", fontFamily: "var(--font-mono)" }}>전체 보기 →</a>
        </div>
        <div className="sectionSubtext" style={{ marginBottom: "20px" }}>
          실측 데이터와 백테스트 결과를 바탕으로 작성된 Working Paper 시리즈입니다. 투자 조언이 아닌 연구 목적의 자료입니다.
        </div>
        <div className="paperList">
          {PAPERS_HOME.slice(0, 3).map((paper) => (
            <a key={paper.href} href={paper.href} className="paperCard">
              <div className="paperCardNum">{paper.num} · {paper.date}</div>
              <h3 className="paperCardTitle">{paper.title}</h3>
              <p className="paperCardAbstract">{paper.abstract}</p>
              <div className="paperCardMeta">전문 읽기 →</div>
            </a>
          ))}
        </div>

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
          <AccuracyTable
            history={history}
            prediction={prediction}
            holidayHistory={holidayHistory}
            currentModel2Prediction={model2Point}
          />
        ) : (
          <div className="card sectionLoadingCard">
            <div className="sectionLoadingText">최근 실측 기록을 동기화하는 중입니다.</div>
          </div>
        )}

        <NoticeContent />
      </main>

      <footer className="footer">
        <div>© 2026 코스피프리뷰. Forecast dashboard for KOSPI opening range.</div>
        <div className="footerAdNotice">본 사이트에는 서비스 운영을 위한 광고가 포함될 수 있습니다.</div>
        <div className="footerContactNotice">
          문의 이메일: <a href="mailto:ytbtheguy@gmail.com">ytbtheguy@gmail.com</a>
        </div>
        <div className="footerLinks">
          <a href="/history">최근 예측 기록</a>
          <a href="/about">모델 설명</a>
          <a href="/terms">이용약관</a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/disclaimer">면책 및 광고 고지</a>
          <a href="/contact">문의</a>
          <a href="/operations-policy">운영정책</a>
        </div>
      </footer>
    </div>
  );
}
