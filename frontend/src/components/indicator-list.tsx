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
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(date);
}

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div className="indicatorGrid">
      {allIndicators.map((indicator) => {
        const isPositive = indicator.changePct >= 0;
        const displayValue = formatIndicatorValue(indicator.key, indicator.value);
        const displayTag = indicator.displayTag?.trim() || "";
        const referenceLabel = indicator.referenceLabel?.trim() || "";
        const referenceValue = indicator.referenceValue?.trim() || "";
        const referenceDate = indicator.referenceDate?.trim() || "";
        const hasSourceUrl = Boolean(indicator.sourceUrl?.trim());
        const isSourceHidden = indicator.key === "k200f";
        const isClickable = hasSourceUrl && !isSourceHidden;
        const checkedAt = indicator.checkedAt?.trim() || indicators.generatedAt || "";
        const checkedText =
          checkedAt && checkedAt !== indicator.updatedAt ? ` · 조회 ${formatUpdatedAt(checkedAt)} KST` : "";
        const sourceText =
          indicator.key === "k200f"
            ? "지연 데이터 표시 (실시간 아님 · 투자 참고용)"
            : `기준 시각 ${formatUpdatedAt(indicator.updatedAt)} KST${checkedText} · ${
                indicator.dataSource ?? "Yahoo Finance"
              }`;
        const cardClassName = `indCard${isClickable ? "" : " isStatic"}`;
        const cardContent = (
          <>
            <div className="indLabelRow">
              <div className="indLabel">{indicator.label}</div>
              {displayTag ? <span className="indPhase">{displayTag}</span> : null}
            </div>
            <div className="indValue">{displayValue}</div>
            <div className={`indChange ${isPositive ? "isPos" : "isNeg"}`}>
              {changeLabel(indicator.changePct)} {Math.abs(indicator.changePct).toFixed(2)}%
            </div>
            <div className="indSource">{sourceText}</div>
            {referenceValue ? (
              <div className="indReference">
                {referenceLabel || "기준 종가"} {referenceValue}
                {referenceDate ? ` · ${referenceDate}` : ""}
              </div>
            ) : null}
          </>
        );

        if (!isClickable) {
          return (
            <div className={cardClassName} key={indicator.key} data-indicator-key={indicator.key} data-indicator-updated-at={indicator.updatedAt}>
              {cardContent}
            </div>
          );
        }

        return (
          <a
            href={indicator.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cardClassName}
            key={indicator.key}
            data-indicator-key={indicator.key}
            data-indicator-updated-at={indicator.updatedAt}
          >
            {cardContent}
          </a>
        );
      })}
    </div>
  );
}
