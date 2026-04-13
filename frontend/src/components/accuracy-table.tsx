"use client";

import { useEffect, useMemo, useState } from "react";
import type { HistoryData, PredictionData } from "@/lib/data";

const PAGE_SIZE = 10;

type AccuracyTableProps = {
  history: HistoryData;
  prediction?: PredictionData;
};

type DisplayRecord = {
  date: string;
  modelPrediction: number | null;
  nightFuturesSimpleOpen: number | null;
  actualOpen: number | null;
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

function buildDisplayRecords(history: HistoryData, prediction?: PredictionData): DisplayRecord[] {
  const predictionDateIso = parsePredictionDateIso(prediction);

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
      actualOpen: isFiniteNumber(record.actualOpen) ? record.actualOpen : null,
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
      isPredictionTarget: true,
    };
  } else {
    baseRecords.unshift({
      date: predictionDateIso,
      modelPrediction: isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null,
      nightFuturesSimpleOpen: isFiniteNumber(prediction.nightFuturesSimplePoint) ? prediction.nightFuturesSimplePoint : null,
      actualOpen: null,
      isPredictionTarget: true,
    });
  }

  return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
}

function computeModelMatchRatePct(actualOpen: number | null, predictedOpen: number | null): number | null {
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

function getMatchRateColor(matchRatePct: number | null) {
  if (matchRatePct === null) {
    return "var(--text-secondary)";
  }

  if (matchRatePct >= 99.7) {
    return "var(--positive)";
  }
  if (matchRatePct >= 99.2) {
    return "var(--accent)";
  }
  return "var(--negative)";
}

export function AccuracyTable({ history, prediction }: AccuracyTableProps) {
  const records = useMemo(() => buildDisplayRecords(history, prediction), [history, prediction]);
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
            <th>야간선물 환산치</th>
            <th>모델 예측치</th>
            <th>야간선물 오차</th>
            <th>모델 오차</th>
            <th style={{ textAlign: "center" }}>
              모델 일치율(%){" "}
              <span
                className="tableHintIcon"
                title="모델 예측치가 실제 시초가와 얼마나 가깝게 맞았는지 보여줍니다. 실제 시초가 대비 절대 오차율을 100에서 뺀 값입니다."
                aria-label="모델 일치율 설명"
              >
                ?
              </span>
            </th>
          </tr>
        </thead>
        <tbody>
          {pagedRecords.map((record) => {
            const actualOpenValue = isFiniteNumber(record.actualOpen) ? record.actualOpen : null;
            const modelPrediction = isFiniteNumber(record.modelPrediction) ? record.modelPrediction : null;
            const nightSimple = isFiniteNumber(record.nightFuturesSimpleOpen) ? record.nightFuturesSimpleOpen : null;
            const nightError = actualOpenValue !== null && nightSimple !== null ? actualOpenValue - nightSimple : null;
            const modelError = actualOpenValue !== null && modelPrediction !== null ? actualOpenValue - modelPrediction : null;
            const modelMatchRatePct = computeModelMatchRatePct(actualOpenValue, modelPrediction);

            return (
              <tr key={record.date} className={record.isPredictionTarget ? "isPredictionTarget" : undefined}>
                <td style={{ color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>{record.date}</td>
                <td style={{ color: "var(--text)", fontWeight: 800 }}>
                  {actualOpenValue !== null ? actualOpenValue.toLocaleString("ko-KR") : "-"}
                </td>
                <td>{nightSimple === null ? "-" : nightSimple.toLocaleString("ko-KR")}</td>
                <td style={{ color: "var(--text)", fontWeight: 700 }}>
                  {modelPrediction === null ? "-" : modelPrediction.toLocaleString("ko-KR")}
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
                    color: getErrorColor(modelError),
                    fontWeight: 700,
                  }}
                >
                  {modelError === null ? "-" : `${modelError >= 0 ? "+" : ""}${modelError.toFixed(1)}`}
                </td>
                <td
                  style={{
                    textAlign: "center",
                    fontWeight: 800,
                    color: getMatchRateColor(modelMatchRatePct),
                  }}
                >
                  {modelMatchRatePct === null ? "-" : `${modelMatchRatePct.toFixed(2)}%`}
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
