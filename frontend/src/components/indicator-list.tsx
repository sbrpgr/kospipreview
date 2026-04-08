"use client";

import type { IndicatorData } from "@/lib/data";

function normalizeIndicatorValue(key: string, value: string) {
  if (key === "krw") {
    return value.replace(/\?\?/g, "원");
  }
  return value;
}

function changeLabel(value: number) {
  if (value > 0) {
    return "상승";
  }
  if (value < 0) {
    return "하락";
  }
  return "보합";
}

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div className="indicatorGrid">
      {allIndicators.map((indicator) => {
        const isPositive = indicator.changePct >= 0;
        const displayValue = normalizeIndicatorValue(indicator.key, indicator.value);

        return (
          <a
            href={indicator.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="indCard"
            key={indicator.key}
          >
            <div className="indLabel">{indicator.label}</div>
            <div className="indValue">{displayValue}</div>
            <div className={`indChange ${isPositive ? "isPos" : "isNeg"}`}>
              {changeLabel(indicator.changePct)} {Math.abs(indicator.changePct).toFixed(2)}%
            </div>
          </a>
        );
      })}
    </div>
  );
}
