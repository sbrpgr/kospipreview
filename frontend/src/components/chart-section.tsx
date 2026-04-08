"use client";

import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { HistoryData } from "@/lib/data";

type ChartSectionProps = {
  history: HistoryData;
};

export function ChartSection({ history }: ChartSectionProps) {
  const chartData = useMemo(() => {
    return [...history.records].reverse().map((record) => ({
      date: record.date.slice(5),
      fullDate: record.date,
      실제시가: record.actualOpen,
      예측하단: record.low,
      예측상단: record.high,
    }));
  }, [history]);

  const domainY = useMemo(() => {
    if (!chartData.length) return ["dataMin", "dataMax"];
    const minVal = Math.min(...chartData.map((d) => Math.min(d.실제시가, d.예측하단)));
    const maxVal = Math.max(...chartData.map((d) => Math.max(d.실제시가, d.예측상단)));
    const padding = (maxVal - minVal) * 0.05;
    return [Math.floor(minVal - padding), Math.ceil(maxVal + padding)];
  }, [chartData]);

  return (
    <div className="chartContainer">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.1} />
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
            tickFormatter={(val: number) => val.toLocaleString()}
            fontFamily="var(--font-mono)"
            orientation="right"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--surface-strong)", 
              borderColor: "var(--border)",
              color: "var(--text)",
              borderRadius: "var(--radius-sm)",
              boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
              fontSize: "0.85rem",
              fontFamily: "var(--font-mono)",
            }}
            itemStyle={{ color: "var(--text-secondary)", fontSize: "0.9rem", paddingBottom: "4px" }}
            labelStyle={{ color: "var(--text)", fontWeight: "bold", marginBottom: "8px" }}
          />
          
          <Area 
            type="monotone" 
            name="예측 상단" 
            dataKey="예측상단" 
            stroke="var(--accent-bright)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fillOpacity={0}
            fill="none"
          />
          <Area 
            type="monotone" 
            name="예측 하단" 
            dataKey="예측하단" 
            stroke="var(--accent-bright)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fillOpacity={1}
            fill="url(#bandGradient)"
          />
          <Area 
            type="monotone" 
            name="실제 시초가"
            dataKey="실제시가" 
            stroke="var(--positive)" 
            strokeWidth={2.5} 
            dot={{ r: 3, fill: "var(--surface)", strokeWidth: 2, stroke: "var(--positive)" }}
            activeDot={{ r: 6, strokeWidth: 0, fill: "var(--positive)" }}
            fillOpacity={1}
            fill="url(#actualGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
