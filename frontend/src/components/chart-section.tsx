"use client";

import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine,
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
    const padding = (maxVal - minVal) * 0.08;
    return [Math.floor(minVal - padding), Math.ceil(maxVal + padding)];
  }, [chartData]);

  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">추세 분석</p>
          <h2>예측 vs 실제 시초가 추이</h2>
        </div>
        <div className="statsInline">
          <span>{chartData.length}일</span>
        </div>
      </div>
      
      <div className="chartContainer">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6C8CFF" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#6C8CFF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22D67A" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#22D67A" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#5B6B8D" 
              fontSize={11} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
              fontFamily="var(--font-mono)"
            />
            <YAxis 
              domain={domainY} 
              stroke="#5B6B8D" 
              fontSize={11} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val: number) => val.toLocaleString()}
              fontFamily="var(--font-mono)"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(10, 15, 25, 0.95)", 
                borderColor: "rgba(108, 140, 255, 0.2)",
                color: "#F0F4F8",
                borderRadius: "12px",
                boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
                fontSize: "0.85rem",
                fontFamily: "var(--font-mono)",
              }}
              itemStyle={{ color: "#8B9CC0" }}
              labelStyle={{ color: "#6C8CFF", fontWeight: "bold", marginBottom: "6px" }}
            />
            {/* 예측 밴드 영역 */}
            <Area 
              type="monotone" 
              name="예측 상단" 
              dataKey="예측상단" 
              stroke="rgba(108, 140, 255, 0.4)"
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={0}
              fill="none"
            />
            <Area 
              type="monotone" 
              name="예측 하단" 
              dataKey="예측하단" 
              stroke="rgba(108, 140, 255, 0.4)"
              strokeWidth={1}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#bandGradient)"
            />
            {/* 실제 시초가 */}
            <Area 
              type="monotone" 
              name="실제 시초가"
              dataKey="실제시가" 
              stroke="#22D67A" 
              strokeWidth={2.5} 
              dot={{ r: 3, fill: "#22D67A", strokeWidth: 2, stroke: "rgba(10,15,25,0.8)" }}
              activeDot={{ r: 5, strokeWidth: 0 }}
              fillOpacity={1}
              fill="url(#actualGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
