"use client";

import { useMemo, useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";

type IntradayChartProps = {
  closePrice: number;
  expectedHigh: number;
  expectedLow: number;
  expectedPoint: number;
};

export function IntradayChart({ closePrice, expectedHigh, expectedLow, expectedPoint }: IntradayChartProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // 시뮬레이션 데이터 생성 (저녁 6시부터 아침 9시까지의 거시지표 변동성 난수 경로)
  const data = useMemo(() => {
    const points = [];
    const steps = 30; // 30 플롯 포인트
    let currentVal = closePrice;
    
    for (let i = 0; i <= steps; i++) {
        // 시간: 18:00 ~ 다음날 09:00 (총 15시간)
        const hour = 18 + (i * 15) / steps;
        const displayHour = hour >= 24 ? Math.floor(hour - 24) : Math.floor(hour);
        const displayMin = Math.floor((hour % 1) * 60);
        const timeStr = `${displayHour.toString().padStart(2,"0")}:${displayMin.toString().padStart(2,"0")}`;

        const remainingSteps = steps - i;
        if (remainingSteps === 0) {
            currentVal = expectedPoint;
        } else {
            const pull = (expectedPoint - currentVal) / remainingSteps;
            const noise = (Math.random() - 0.5) * ((expectedHigh - expectedLow) * 0.25);
            currentVal = currentVal + pull + noise;
        }

        points.push({
            time: timeStr,
            expected: parseFloat(currentVal.toFixed(2)),
            bandHigh: expectedHigh,
            bandLow: expectedLow,
        });
    }
    return points;
  }, [closePrice, expectedHigh, expectedLow, expectedPoint]);

  if (!mounted) return <div style={{ height: "250px" }} />; // SSR 하이드레이션 방지

  return (
    <div style={{ marginTop: "1.5rem", background: "var(--color-background)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
      <div style={{ marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
            <h3 style={{ fontSize: "1rem", margin: 0, color: "var(--color-text)" }}>시간대별 시초가 궤적 시뮬레이션</h3>
            <p style={{ fontSize: "0.8rem", color: "var(--color-text-dim)", margin: 0, marginTop: "4px" }}>야간선물 변동성(ΔUS) 및 거시지표(ΔFX) 수렴 모델링</p>
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--color-success)", display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-success)", animation: "ping 1.5s infinite" }}></span>
            Real-time Calibrating
        </span>
      </div>
      <div style={{ height: "200px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="var(--color-text-dim)" fontSize={11} minTickGap={20} />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="var(--color-text-dim)" fontSize={11} />
            <Tooltip 
              contentStyle={{ backgroundColor: "var(--color-surface)", borderColor: "var(--color-border)", borderRadius: "8px", fontSize: "0.85rem" }}
              itemStyle={{ color: "var(--color-text)", fontWeight: "600" }}
              labelStyle={{ color: "var(--color-text-dim)" }}
            />
            {/* 예상 범위 상단 라인 */}
            <ReferenceLine y={expectedHigh} stroke="rgba(255, 59, 48, 0.5)" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: '상단 밴드', fill: 'rgba(255, 59, 48, 0.8)', fontSize: 10 }} />
            <ReferenceLine y={expectedLow} stroke="rgba(52, 199, 89, 0.5)" strokeDasharray="3 3" label={{ position: 'insideBottomLeft', value: '하단 밴드', fill: 'rgba(52, 199, 89, 0.8)', fontSize: 10 }} />

            {/* 예상 가격 궤적 */}
            <Area type="monotone" name="예상 수렴가" dataKey="expected" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExpected)" />
            
            <ReferenceLine y={closePrice} stroke="var(--color-text-dim)" label={{ position: 'insideTopLeft', value: '전일 종가', fill: 'var(--color-text-dim)', fontSize: 11 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
