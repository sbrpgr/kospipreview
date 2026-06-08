"use client";

import { useEffect, useMemo, useState } from "react";
import type { HistoryData, HolidayHistoryData, PredictionData } from "@/lib/data";

const PAGE_SIZE = 10;

type AccuracyTableProps = {
  history: HistoryData;
  prediction?: PredictionData;
  holidayHistory?: HolidayHistoryData | null;
  currentModel2Prediction?: number | null;
};

type DisplayRecord = {
  date: string;
  modelPrediction: number | null;
  nightFuturesSimpleOpen: number | null;
  ewyFxSimpleOpen: number | null;
  model2Prediction: number | null;
  actualOpen: number | null;
  actualClose: number | null;
  dayFuturesClose: number | null;
  nightFuturesClose: number | null;
  isPredictionTarget: boolean;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function parsePredictionDateIso(prediction?: PredictionData): string | null {
  if (!prediction) {
    return null;
  }

  if (typeof prediction.predictionDateIso === "string" && /^\d{4}-\d{2}-\d{2}$/.test(prediction.predictionDateIso)) {
    return prediction.predictionDateIso;
  }

  const dateText = prediction.predictionDate ?? "";
  const match = dateText.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function compareDateDesc(left: string, right: string) {
  const leftTs = new Date(`${left}T00:00:00+09:00`).getTime();
  const rightTs = new Date(`${right}T00:00:00+09:00`).getTime();

  if (!Number.isNaN(leftTs) && !Number.isNaN(rightTs)) {
    return rightTs - leftTs;
  }
  if (!Number.isNaN(leftTs)) {
    return -1;
  }
  if (!Number.isNaN(rightTs)) {
    return 1;
  }
  return right.localeCompare(left);
}

function buildDisplayRecords(
  history: HistoryData,
  prediction?: PredictionData,
  holidayHistory?: HolidayHistoryData | null,
  currentModel2Prediction?: number | null,
): DisplayRecord[] {
  const predictionDateIso = parsePredictionDateIso(prediction);
  const currentModel2Point = isFiniteNumber(currentModel2Prediction) ? currentModel2Prediction : null;

  // Build model2 lookup from holiday history
  const model2ByDate = new Map<string, number>();
  for (const r of holidayHistory?.records ?? []) {
    if (isFiniteNumber(r.model2Prediction)) {
      model2ByDate.set(r.date, r.model2Prediction!);
    }
  }

  const baseRecords: DisplayRecord[] = history.records.map((record) => {
    const modelPrediction =
      isFiniteNumber(record.modelPrediction)
        ? record.modelPrediction
        : isFiniteNumber(record.low) && isFiniteNumber(record.high)
          ? (record.low + record.high) / 2
          : null;

    return {
      date: record.date,
      modelPrediction,
      nightFuturesSimpleOpen: isFiniteNumber(record.nightFuturesSimpleOpen) ? record.nightFuturesSimpleOpen : null,
      ewyFxSimpleOpen: isFiniteNumber(record.ewyFxSimpleOpen) ? record.ewyFxSimpleOpen : null,
      model2Prediction: model2ByDate.get(record.date) ?? null,
      actualOpen: isFiniteNumber(record.actualOpen) ? record.actualOpen : null,
      actualClose: isFiniteNumber(record.actualClose) ? record.actualClose : null,
      dayFuturesClose: isFiniteNumber(record.dayFuturesClose) ? record.dayFuturesClose : null,
      nightFuturesClose: isFiniteNumber(record.nightFuturesClose) ? record.nightFuturesClose : null,
      isPredictionTarget: predictionDateIso !== null && record.date === predictionDateIso,
    };
  });

  if (!predictionDateIso || !prediction) {
    return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
  }

  const targetIndex = baseRecords.findIndex((record) => record.date === predictionDateIso);

  if (targetIndex >= 0) {
    const existing = baseRecords[targetIndex];
    if (isFiniteNumber(existing.actualOpen)) {
      return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
    }

    baseRecords[targetIndex] = {
      ...existing,
      modelPrediction: isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : existing.modelPrediction,
      nightFuturesSimpleOpen:
        isFiniteNumber(prediction.nightFuturesSimplePoint)
          ? prediction.nightFuturesSimplePoint
          : existing.nightFuturesSimpleOpen,
      ewyFxSimpleOpen: isFiniteNumber(prediction.ewyFxSimplePoint)
        ? prediction.ewyFxSimplePoint
        : existing.ewyFxSimpleOpen,
      model2Prediction: currentModel2Point ?? model2ByDate.get(predictionDateIso) ?? existing.model2Prediction,
      dayFuturesClose: existing.dayFuturesClose,
      nightFuturesClose: existing.nightFuturesClose,
      isPredictionTarget: true,
    };
  } else {
    baseRecords.unshift({
      date: predictionDateIso,
      modelPrediction: isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null,
      nightFuturesSimpleOpen: isFiniteNumber(prediction.nightFuturesSimplePoint) ? prediction.nightFuturesSimplePoint : null,
      ewyFxSimpleOpen: isFiniteNumber(prediction.ewyFxSimplePoint) ? prediction.ewyFxSimplePoint : null,
      model2Prediction: currentModel2Point ?? model2ByDate.get(predictionDateIso) ?? null,
      actualOpen: null,
      actualClose: null,
      dayFuturesClose: null,
      nightFuturesClose: null,
      isPredictionTarget: true,
    });
  }

  return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
}

function computeModelAccuracyPct(actualOpen: number | null, predictedOpen: number | null): number | null {
  if (actualOpen === null || predictedOpen === null) {
    return null;
  }

  if (Math.abs(actualOpen) < 1e-8) {
    return null;
  }

  const errorRatePct = (Math.abs(predictedOpen - actualOpen) / Math.abs(actualOpen)) * 100;
  return Math.max(0, 100 - errorRatePct);
}

function getErrorColor(error: number | null) {
  if (error === null) {
    return "var(--text-secondary)";
  }

  return error >= 0 ? "var(--negative)" : "var(--positive)";
}

function getAccuracyColor(accuracyPct: number | null) {
  if (accuracyPct === null) {
    return "var(--text-secondary)";
  }

  if (accuracyPct >= 99.7) {
    return "var(--positive)";
  }
  if (accuracyPct >= 99.2) {
    return "var(--accent)";
  }
  return "var(--negative)";
}

export function AccuracyTable({ history, prediction, holidayHistory, currentModel2Prediction }: AccuracyTableProps) {
  const records = useMemo(
    () => buildDisplayRecords(history, prediction, holidayHistory, currentModel2Prediction),
    [history, prediction, holidayHistory, currentModel2Prediction],
  );
  const totalPages = Math.max(1, Math.ceil(records.length / PAGE_SIZE));
  const [page, setPage] = useState(1);

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  const pageStart = (page - 1) * PAGE_SIZE;
  const pagedRecords = records.slice(pageStart, pageStart + PAGE_SIZE);

  return (
    <div className="cleanTableWrap">
      <table className="cleanTable">
        <thead>
          <tr>
            <th>날짜</th>
            <th>실제 시초가</th>
            <th>당일 종가</th>
            <th>주간선물 종가</th>
            <th>야간선물 종가</th>
            <th>야간선물 환산치</th>
            <th>EWY+환율 환산치</th>
            <th>모델 예측치</th>
            <th>모델2 예측치</th>
            <th>야간선물 오차</th>
            <th>EWY+환율 오차</th>
            <th>모델 오차</th>
            <th>모델2 오차</th>
            <th style={{ textAlign: "center" }}>
              모델 정확도{" "}
              <span
                className="tableHintIcon"
                title="모델 예측치가 실제 시초가와 얼마나 가깝게 맞았는지 보여줍니다. 실제 시초가 대비 절대 오차율을 100에서 뺀 값입니다."
                aria-label="모델 정확도 설명"
              >
                ?
              </span>
            </th>
            <th style={{ textAlign: "center" }}>
              모델2 정확도{" "}
              <span
                className="tableHintIcon"
                title="모델2 예측치가 실제 시초가와 얼마나 가깝게 맞았는지 보여줍니다. 실제 시초가 대비 절대 오차율을 100에서 뺀 값입니다."
                aria-label="모델2 정확도 설명"
              >
                ?
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pagedRecords.map((record) => {
            const actualOpenValue = isFiniteNumber(record.actualOpen) ? record.actualOpen : null;
            const actualCloseValue = isFiniteNumber(record.actualClose) ? record.actualClose : null;
            const dayFuturesCloseValue = isFiniteNumber(record.dayFuturesClose) ? record.dayFuturesClose : null;
            const nightFuturesCloseValue = isFiniteNumber(record.nightFuturesClose) ? record.nightFuturesClose : null;
            const modelPrediction = isFiniteNumber(record.modelPrediction) ? record.modelPrediction : null;
            const model2Prediction = isFiniteNumber(record.model2Prediction) ? record.model2Prediction : null;
            const nightSimple = isFiniteNumber(record.nightFuturesSimpleOpen) ? record.nightFuturesSimpleOpen : null;
            const ewyFxSimple = isFiniteNumber(record.ewyFxSimpleOpen) ? record.ewyFxSimpleOpen : null;
            const nightError = actualOpenValue !== null && nightSimple !== null ? actualOpenValue - nightSimple : null;
            const ewyFxError = actualOpenValue !== null && ewyFxSimple !== null ? actualOpenValue - ewyFxSimple : null;
            const modelError = actualOpenValue !== null && modelPrediction !== null ? actualOpenValue - modelPrediction : null;
            const model2Error = actualOpenValue !== null && model2Prediction !== null ? actualOpenValue - model2Prediction : null;
            const modelAccuracyPct = computeModelAccuracyPct(actualOpenValue, modelPrediction);
            const model2AccuracyPct = computeModelAccuracyPct(actualOpenValue, model2Prediction);

            return (
              <tr key={record.date} className={record.isPredictionTarget ? "isPredictionTarget" : undefined}>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{record.date}</td>
                <td style={{ color: "var(--text)", fontWeight: 800 }}>
                  {actualOpenValue !== null ? actualOpenValue.toLocaleString("ko-KR") : "-"}
                </td>
                <td style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                  {actualCloseValue !== null ? actualCloseValue.toLocaleString("ko-KR") : "-"}
                </td>
                <td style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                  {dayFuturesCloseValue !== null ? dayFuturesCloseValue.toLocaleString("ko-KR") : "-"}
                </td>
                <td style={{ color: "var(--text-secondary)", fontWeight: 700 }}>
                  {nightFuturesCloseValue !== null ? nightFuturesCloseValue.toLocaleString("ko-KR") : "-"}
                </td>
                <td>{nightSimple === null ? "-" : nightSimple.toLocaleString("ko-KR")}</td>
                <td>{ewyFxSimple === null ? "-" : ewyFxSimple.toLocaleString("ko-KR")}</td>
                <td style={{ color: "var(--text)", fontWeight: 700 }}>
                  {modelPrediction === null ? "-" : modelPrediction.toLocaleString("ko-KR")}
                </td>
                <td style={{ color: "var(--accent)", fontWeight: 700 }}>
                  {model2Prediction === null ? "-" : model2Prediction.toLocaleString("ko-KR")}
                </td>
                <td
                  style={{
                    color: getErrorColor(nightError),
                    fontWeight: 700,
                  }}
                >
                  {nightError === null ? "-" : `${nightError >= 0 ? "+" : ""}${nightError.toFixed(1)}`}
                </td>
                <td
                  style={{
                    color: getErrorColor(ewyFxError),
                    fontWeight: 700,
                  }}
                >
                  {ewyFxError === null ? "-" : `${ewyFxError >= 0 ? "+" : ""}${ewyFxError.toFixed(1)}`}
                </td>
                <td
                  style={{
                    color: getErrorColor(modelError),
                    fontWeight: 700,
                  }}
                >
                  {modelError === null ? "-" : `${modelError >= 0 ? "+" : ""}${modelError.toFixed(1)}`}
                </td>
                <td
                  style={{
                    color: getErrorColor(model2Error),
                    fontWeight: 700,
                  }}
                >
                  {model2Error === null ? "-" : `${model2Error >= 0 ? "+" : ""}${model2Error.toFixed(1)}`}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontWeight: 800,
                    color: getAccuracyColor(modelAccuracyPct),
                  }}
                >
                  {modelAccuracyPct === null ? "-" : `${modelAccuracyPct.toFixed(2)}%`}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontWeight: 800,
                    color: getAccuracyColor(model2AccuracyPct),
                  }}
                >
                  {model2AccuracyPct === null ? "-" : `${model2AccuracyPct.toFixed(2)}%`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="tablePagination">
        <button
          type="button"
          className="tablePageButton"
          onClick={() => setPage((current) => Math.max(1, current - 1))}
          disabled={page <= 1}
        >
          이전
        </button>
        <div className="tablePageInfo">
          {page} / {totalPages}
        </div>
        <button
          type="button"
          className="tablePageButton"
          onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>
    </div>
  );
}
