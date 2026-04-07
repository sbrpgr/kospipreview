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
  ReferenceArea
} from "recharts";
import type { HistoryData } from "@/lib/data";

type ChartSectionProps = {
  history: HistoryData;
};

export function ChartSection({ history }: ChartSectionProps) {
  // 최신 데이터가 인덱스 0에 있으므로, 차트는 과거->현재 순서로 보여주기 위해 뒤집습니다.
  const chartData = useMemo(() => {
    return [...history.records].reverse().map((record) => ({
      date: record.date.slice(5), // YYYY-MM-DD -> MM-DD
      fullDate: record.date,
      실제시가: record.actualOpen,
      예측하단: record.low,
      예측상단: record.high,
    }));
  }, [history]);

  // 차트 최소/최대값 계산으로 Y축 스케일을 넉넉하게 잡습니다.
  const domainY = useMemo(() => {
    if (!chartData.length) return ["dataMin", "dataMax"];
    const minVal = Math.min(
      ...chartData.map((d) => Math.min(d.실제시가, d.예측하단))
    );
    const maxVal = Math.max(
      ...chartData.map((d) => Math.max(d.실제시가, d.예측상단))
    );
    return [Math.floor(minVal * 0.98), Math.ceil(maxVal * 1.02)];
  }, [chartData]);

  return (
    <section className="sectionCard">
      <div className="sectionHeader">
        <div>
          <p className="sectionEyebrow">추세 분석</p>
          <h2>코스피 시초가 예측 vs 실제 추세</h2>
        </div>
      </div>
      
      <div style={{ width: "100%", height: 350, marginTop: "20px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis 
              dataKey="date" 
              stroke="#94A3B8" 
              fontSize={12} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis 
              domain={domainY} 
              stroke="#94A3B8" 
              fontSize={12} 
              tickMargin={10}
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => val.toLocaleString()}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "rgba(15, 23, 42, 0.9)", 
                borderColor: "rgba(56, 189, 248, 0.3)",
                color: "#fff",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
              }}
              itemStyle={{ color: "#E2E8F0" }}
              labelStyle={{ color: "#38BDF8", fontWeight: "bold", marginBottom: "8px" }}
            />
            {/* 오차 밴드를 어둡게 시각화 */}
            {chartData.map((d, index) => (
              <ReferenceArea
                key={index}
                x1={d.date}
                x2={d.date}
                y1={d.예측하단}
                y2={d.예측상단}
                fill="rgba(56, 189, 248, 0.1)"
                fillOpacity={1}
              />
            ))}
            <Line 
              type="monotone" 
              name="실제 시초가"
              dataKey="실제시가" 
              stroke="#00E676" 
              strokeWidth={3} 
              dot={{ r: 4, fill: "#00E676", strokeWidth: 2, stroke: "#0A0F1A" }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Line 
              type="monotone" 
              name="예측 하단"
              dataKey="예측하단" 
              stroke="#38BDF8" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={false}
            />
            <Line 
              type="monotone" 
              name="예측 상단"
              dataKey="예측상단" 
              stroke="#38BDF8" 
              strokeWidth={1.5} 
              strokeDasharray="4 4"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
