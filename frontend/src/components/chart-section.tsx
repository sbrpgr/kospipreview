"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { HistoryData } from "@/lib/data";

type ChartSectionProps = {
  history: HistoryData;
};

export function ChartSection({ history }: ChartSectionProps) {
  const chartData = useMemo(
    () =>
      [...history.records].reverse().map((record) => ({
        date: record.date.slice(5),
        fullDate: record.date,
        actualOpen: record.actualOpen,
        rangeLow: record.low,
        rangeHigh: record.high,
      })),
    [history],
  );

  const domainY = useMemo(() => {
    if (!chartData.length) {
      return ["dataMin", "dataMax"] as const;
    }

    const minVal = Math.min(...chartData.map((d) => Math.min(d.actualOpen, d.rangeLow)));
    const maxVal = Math.max(...chartData.map((d) => Math.max(d.actualOpen, d.rangeHigh)));
    const padding = Math.max((maxVal - minVal) * 0.06, 10);
    return [Math.floor(minVal - padding), Math.ceil(maxVal + padding)] as const;
  }, [chartData]);

  return (
    <div className="card">
      <div className="chartContainer">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="rangeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--brand-strong)" stopOpacity={0.18} />
                <stop offset="100%" stopColor="var(--brand-strong)" stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.16} />
                <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="var(--text-dim)"
              fontSize={12}
              tickMargin={12}
              tickLine={false}
              axisLine={false}
              fontFamily="var(--font-mono)"
              minTickGap={20}
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
              contentStyle={{
                backgroundColor: "rgba(255,255,255,0.96)",
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

            <Area
              type="monotone"
              name="예측 상단"
              dataKey="rangeHigh"
              stroke="var(--brand-strong)"
              strokeWidth={1.6}
              strokeDasharray="5 5"
              fillOpacity={0}
            />
            <Area
              type="monotone"
              name="예측 하단"
              dataKey="rangeLow"
              stroke="var(--brand-strong)"
              strokeWidth={1.6}
              strokeDasharray="5 5"
              fillOpacity={1}
              fill="url(#rangeGradient)"
            />
            <Area
              type="monotone"
              name="실제 시초가"
              dataKey="actualOpen"
              stroke="var(--positive)"
              strokeWidth={3}
              dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2, stroke: "var(--positive)" }}
              activeDot={{ r: 6, strokeWidth: 0, fill: "var(--positive)" }}
              fillOpacity={1}
              fill="url(#actualGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
