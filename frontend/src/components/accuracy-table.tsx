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
  hit: boolean | null;
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
      hit: typeof record.hit === "boolean" ? record.hit : null,
      isPredictionTarget: predictionDateIso !== null && record.date === predictionDateIso,
    };
  });

  if (!predictionDateIso || !prediction) {
    return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
  }

  const targetIndex = baseRecords.findIndex((record) => record.date === predictionDateIso);

  if (targetIndex >= 0) {
    const existing = baseRecords[targetIndex];
    baseRecords[targetIndex] = {
      ...existing,
      modelPrediction: existing.modelPrediction ?? (isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null),
      nightFuturesSimpleOpen:
        existing.nightFuturesSimpleOpen ??
        (isFiniteNumber(prediction.nightFuturesSimplePoint) ? prediction.nightFuturesSimplePoint : null),
      isPredictionTarget: true,
    };
  } else {
    baseRecords.unshift({
      date: predictionDateIso,
      modelPrediction: isFiniteNumber(prediction.pointPrediction) ? prediction.pointPrediction : null,
      nightFuturesSimpleOpen: isFiniteNumber(prediction.nightFuturesSimplePoint) ? prediction.nightFuturesSimplePoint : null,
      actualOpen: null,
      hit: null,
      isPredictionTarget: true,
    });
  }

  return baseRecords.sort((a, b) => compareDateDesc(a.date, b.date));
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
            <th style={{ textAlign: "center" }}>결과</th>
          </tr>
        </thead>
        <tbody>
          {pagedRecords.map((record) => {
            const hasActualOpen = isFiniteNumber(record.actualOpen);
            const actualOpenValue = hasActualOpen ? record.actualOpen : null;
            const modelPrediction = isFiniteNumber(record.modelPrediction) ? record.modelPrediction : null;
            const nightSimple = isFiniteNumber(record.nightFuturesSimpleOpen) ? record.nightFuturesSimpleOpen : null;
            const nightError = actualOpenValue !== null && nightSimple !== null ? actualOpenValue - nightSimple : null;
            const modelError = actualOpenValue !== null && modelPrediction !== null ? actualOpenValue - modelPrediction : null;
            const modelWins = nightError !== null && modelError !== null && Math.abs(modelError) < Math.abs(nightError);

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
                    color: nightError === null ? "var(--text-secondary)" : nightError >= 0 ? "var(--negative)" : "var(--positive)",
                    fontWeight: 700,
                  }}
                >
                  {nightError === null ? "-" : `${nightError >= 0 ? "+" : ""}${nightError.toFixed(1)}`}
                </td>
                <td
                  style={{
                    color:
                      modelError === null ? "var(--text-secondary)" : modelError >= 0 ? "var(--negative)" : "var(--positive)",
                    fontWeight: 700,
                  }}
                >
                  {modelError === null ? "-" : `${modelError >= 0 ? "+" : ""}${modelError.toFixed(1)}`}
                </td>
                <td style={{ textAlign: "center" }}>
                  <span className={`badge ${hasActualOpen ? (record.hit ? "hit" : "miss") : "pending"}`}>
                    {!hasActualOpen ? "예측 중" : nightError === null ? (record.hit ? "적중" : "미적중") : modelWins ? "모델 우세" : "야간선물 우세"}
                  </span>
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
