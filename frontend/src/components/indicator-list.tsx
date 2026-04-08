"use client";

import { useState, useEffect } from "react";
import type { IndicatorData } from "@/lib/data";
import { formatSignedPercent } from "@/lib/format";

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div className="indicatorGrid">
      {allIndicators.map((ind) => {
        const isPos = ind.changePct >= 0;
        return (
          <a
            href={ind.sourceUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="indCard"
            key={ind.key}
          >
            <div className="indLabel">{ind.label}</div>
            <div className="indValue">{ind.value}</div>
            <div className={`indChange ${isPos ? 'isPos' : 'isNeg'}`}>
              {isPos ? "▲" : "▼"} {Math.abs(ind.changePct).toFixed(2)}%
            </div>
          </a>
        );
      })}
    </div>
  );
}
