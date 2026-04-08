"use client";

import type { IndicatorData } from "@/lib/data";

function formatIndicatorValue(key: string, value: string) {
  if (key !== "krw") {
    return value;
  }

  return value
    .replace(/ì/g, "원")
    .replace(/\?\?/g, "원")
    .replace(/원원/g, "원");
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

function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));
}

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div className="indicatorGrid">
      {allIndicators.map((indicator) => {
        const isPositive = indicator.changePct >= 0;
        const displayValue = formatIndicatorValue(indicator.key, indicator.value);

        return (
          <a
            href={indicator.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="indCard"
            key={indicator.key}
            data-indicator-key={indicator.key}
            data-indicator-updated-at={indicator.updatedAt}
          >
            <div className="indLabel">{indicator.label}</div>
            <div className="indValue">{displayValue}</div>
            <div className={`indChange ${isPositive ? "isPos" : "isNeg"}`}>
              {changeLabel(indicator.changePct)} {Math.abs(indicator.changePct).toFixed(2)}%
            </div>
            <div className="indSource">기준 시각 {formatUpdatedAt(indicator.updatedAt)} KST</div>
          </a>
        );
      })}
    </div>
  );
}
