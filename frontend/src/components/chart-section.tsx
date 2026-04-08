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
      예측중심: Math.round((record.low + record.high) / 2),
    }));
  }, [history]);

  const domainY = useMemo(() => {
    if (!chartData.length) return ["dataMin", "dataMax"];
    const minVal = Math.min(
      ...chartData.map((d) => Math.min(d.실제시가, d.예측하단))
    );
    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.실제시가, d.예측상단))
    );
    const padding = (maxVal - minVal) * 0.05;
    return [Math.floor(minVal - padding), Math.ceil(maxVal + padding)];
  }, [chartData]);

  return (
    <div className="mainChartWrap">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.15} />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--positive)" stopOpacity={0.1} />
              <stop offset="100%" stopColor="var(--positive)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={true} horizontal={true} />
          <XAxis 
            dataKey="date" 
            stroke="var(--text-dim)" 
            fontSize={10} 
            tickMargin={8}
            tickLine={false}
            axisLine={{ stroke: 'var(--border)' }}
            fontFamily="var(--font-mono)"
            minTickGap={20}
          />
          <YAxis 
            domain={domainY} 
            stroke="var(--text-dim)" 
            fontSize={10} 
            tickMargin={8}
            tickLine={false}
            axisLine={false}
            tickFormatter={(val: number) => val.toLocaleString()}
            fontFamily="var(--font-mono)"
            orientation="right"
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "var(--bg-app)", 
              borderColor: "var(--border)",
              color: "var(--text)",
              borderRadius: "4px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.5)",
              fontSize: "0.75rem",
              fontFamily: "var(--font-mono)",
              padding: "8px 12px"
            }}
            itemStyle={{ color: "var(--text-secondary)", fontSize: "0.8rem", paddingBottom: "4px" }}
            labelStyle={{ color: "var(--accent-bright)", fontWeight: "bold", marginBottom: "4px" }}
          />
          
          <Area 
            type="monotone" 
            name="예측 상단" 
            dataKey="예측상단" 
            stroke="rgba(41, 98, 255, 0.4)"
            strokeWidth={1}
            strokeDasharray="4 4"
            fillOpacity={0}
            fill="none"
          />
          <Area 
            type="monotone" 
            name="예측 하단" 
            dataKey="예측하단" 
            stroke="rgba(41, 98, 255, 0.4)"
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
            strokeWidth={2} 
            dot={{ r: 2, fill: "var(--bg-app)", strokeWidth: 1.5, stroke: "var(--positive)" }}
            activeDot={{ r: 4, strokeWidth: 0, fill: "var(--positive)" }}
            fillOpacity={1}
            fill="url(#actualGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
