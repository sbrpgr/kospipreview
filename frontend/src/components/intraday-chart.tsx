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

  const data = useMemo(() => {
    const points = [];
    const steps = 30;
    let currentVal = closePrice;
    
    for (let i = 0; i <= steps; i++) {
        const hour = 18 + (i * 15) / steps;
        const displayHour = hour >= 24 ? Math.floor(hour - 24) : Math.floor(hour);
        const displayMin = Math.floor((hour % 1) * 60);
        const timeStr = `${displayHour.toString().padStart(2,"0")}:${displayMin.toString().padStart(2,"0")}`;

        const remainingSteps = steps - i;
        if (remainingSteps === 0) {
            currentVal = expectedPoint;
        } else {
            const pull = (expectedPoint - currentVal) / remainingSteps;
            const noise = (Math.random() - 0.5) * ((expectedHigh - expectedLow) * 0.2);
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

  if (!mounted) return <div style={{ height: "220px" }} />;

  return (
    <div className="intradayChartWrap">
      <div className="intradayChartHeader">
        <div>
          <div className="intradayChartTitle">시초가 수렴 궤적 시뮬레이션</div>
          <div className="intradayChartSubtitle">야간선물 변동성 기반 모델링 (18:00 → 09:00)</div>
        </div>
        <span className="intradayChartLive">
          <span className="intradayChartLiveDot" />
          Calibrating
        </span>
      </div>
      <div style={{ height: "200px", width: "100%" }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 0, left: -25, bottom: 0 }}>
            <defs>
              <linearGradient id="colorExpected" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818CF8" stopOpacity={0.5}/>
                <stop offset="95%" stopColor="#818CF8" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" stroke="#5B6B8D" fontSize={10} minTickGap={30} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
            <YAxis domain={['dataMin - 5', 'dataMax + 5']} stroke="#5B6B8D" fontSize={10} fontFamily="var(--font-mono)" tickLine={false} axisLine={false} />
            <Tooltip 
              contentStyle={{ backgroundColor: "rgba(10,15,25,0.95)", borderColor: "rgba(108,140,255,0.2)", borderRadius: "8px", fontSize: "0.8rem", fontFamily: "var(--font-mono)" }}
              itemStyle={{ color: "#F0F4F8", fontWeight: 600 }}
              labelStyle={{ color: "#5B6B8D" }}
            />
            <ReferenceLine y={expectedHigh} stroke="rgba(255,71,87,0.3)" strokeDasharray="3 3" />
            <ReferenceLine y={expectedLow} stroke="rgba(34,214,122,0.3)" strokeDasharray="3 3" />
            <ReferenceLine y={closePrice} stroke="rgba(91,107,141,0.3)" strokeDasharray="3 3" />
            <Area type="monotone" name="예상 수렴가" dataKey="expected" stroke="#818CF8" strokeWidth={2} fillOpacity={1} fill="url(#colorExpected)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
