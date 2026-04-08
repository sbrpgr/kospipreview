"use client";

import type { IndicatorData } from "@/lib/data";

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div className="indicatorGrid">
      {allIndicators.map((indicator) => {
        const isPositive = indicator.changePct >= 0;
        return (
          <a
            href={indicator.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="indCard"
            key={indicator.key}
          >
            <div className="indLabel">{indicator.label}</div>
            <div className="indValue">{indicator.value}</div>
            <div className={`indChange ${isPositive ? "isPos" : "isNeg"}`}>
              {isPositive ? "▲" : "▼"} {Math.abs(indicator.changePct).toFixed(2)}%
            </div>
          </a>
        );
      })}
    </div>
  );
}
