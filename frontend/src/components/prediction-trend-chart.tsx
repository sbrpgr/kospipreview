"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { LivePredictionSeriesData, PredictionData } from "@/lib/data";

type PredictionTrendChartProps = {
  prediction: PredictionData;
  series: LivePredictionSeriesData;
};

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPoint(value: number | null | undefined) {
  return isFiniteNumber(value) ? value.toLocaleString("ko-KR", { maximumFractionDigits: 2 }) : "-";
}

function formatKstTime(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(parsed);
}

export function PredictionTrendChart({ prediction, series }: PredictionTrendChartProps) {
  const targetDate = prediction.predictionDateIso;
  const chartData = useMemo(
    () =>
      series.records
        .filter((record) => !targetDate || record.predictionDateIso === targetDate)
        .map((record) => ({
          observedAt: record.observedAt,
          time: record.kstTime ?? formatKstTime(record.observedAt),
          modelPrediction: isFiniteNumber(record.pointPrediction) ? record.pointPrediction : null,
          nightFuturesSimplePoint: isFiniteNumber(record.nightFuturesSimplePoint)
            ? record.nightFuturesSimplePoint
            : null,
          modelChangePct: record.predictedChangePct,
          nightChangePct: record.nightFuturesSimpleChangePct,
        }))
        .sort((a, b) => new Date(a.observedAt).getTime() - new Date(b.observedAt).getTime()),
    [series, targetDate],
  );

  const domainY = useMemo(() => {
    const values = chartData.flatMap((item) =>
      [item.modelPrediction, item.nightFuturesSimplePoint].filter(isFiniteNumber),
    );

    if (!values.length) {
      return ["dataMin", "dataMax"] as const;
    }

    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const padding = Math.max((maxVal - minVal) * 0.18, 8);
    return [Math.floor(minVal - padding), Math.ceil(maxVal + padding)] as const;
  }, [chartData]);

  return (
    <div className="card predictionTrendCard">
      <div className="predictionTrendHeader">
        <div>
          <h2 className="predictionTrendTitle">예측 추이</h2>
          <p className="predictionTrendSubtext">
            {prediction.predictionDate} 기준 야간선물 단순환산과 모델 예측값의 시간별 변화를 비교합니다.
          </p>
        </div>
        <div className="predictionTrendBadge">{chartData.length.toLocaleString("ko-KR")}개 관측</div>
      </div>

      {chartData.length ? (
        <div className="predictionTrendChart">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="var(--text-dim)"
                fontSize={12}
                tickMargin={12}
                tickLine={false}
                axisLine={false}
                fontFamily="var(--font-mono)"
                minTickGap={22}
              />
              <YAxis
                domain={domainY}
                stroke="var(--text-dim)"
                fontSize={12}
                tickMargin={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value: number) => value.toLocaleString("ko-KR")}
                fontFamily="var(--font-mono)"
                orientation="right"
              />
              <Tooltip
                formatter={(value, name) => [
                  typeof value === "number" ? formatPoint(value) : String(value ?? "-"),
                  String(name),
                ]}
                labelFormatter={(label) => `${label} KST`}
                contentStyle={{
                  backgroundColor: "rgba(255,255,255,0.97)",
                  borderColor: "var(--border)",
                  color: "var(--text)",
                  borderRadius: "18px",
                  boxShadow: "var(--shadow-md)",
                  fontSize: "0.84rem",
                  fontFamily: "var(--font-mono)",
                }}
                itemStyle={{ color: "var(--text-secondary)", fontSize: "0.88rem", paddingBottom: "4px" }}
                labelStyle={{ color: "var(--text)", fontWeight: "bold", marginBottom: "8px" }}
              />
              <Legend verticalAlign="top" height={32} iconType="circle" wrapperStyle={{ fontSize: "0.82rem" }} />
              <Line
                type="monotone"
                name="모델 예측"
                dataKey="modelPrediction"
                stroke="var(--brand-strong)"
                strokeWidth={3}
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "var(--brand-strong)" }}
                connectNulls
              />
              <Line
                type="monotone"
                name="야간선물 단순환산"
                dataKey="nightFuturesSimplePoint"
                stroke="var(--gold)"
                strokeWidth={2.4}
                strokeDasharray="6 5"
                dot={false}
                activeDot={{ r: 5, strokeWidth: 0, fill: "var(--gold)" }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="predictionTrendEmpty">
          예측 추이 데이터가 쌓이는 중입니다. 다음 갱신부터 시간별 변화가 표시됩니다.
        </div>
      )}
    </div>
  );
}
