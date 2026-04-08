"use client";

import { useState, useEffect } from "react";
import type { IndicatorData } from "@/lib/data";
import { formatSignedPercent } from "@/lib/format";

export function IndicatorList({ indicators }: { indicators: IndicatorData }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const allIndicators = [...indicators.primary, ...indicators.secondary];

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="panelHeader" style={{ borderTop: "1px solid var(--border)"}}>
        <div className="panelTitle">Market Indicators</div>
      </div>
      
      <div className="scrollable">
        {allIndicators.map((ind) => {
          const isPos = ind.changePct >= 0;
          return (
            <a 
              href={ind.sourceUrl || "#"} 
              target="_blank" 
              rel="noopener noreferrer"
              className="dataRow" 
              key={ind.key}
              style={{ display: "flex" }}
            >
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span className="dataRowLabel">{ind.label}</span>
                <span style={{ fontSize: "0.65rem", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                  {ind.key.toUpperCase()}
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                <span className={`dataRowValue ${isPos ? 'isPos' : 'isNeg'}`}>
                  {ind.value}
                </span>
                <span className={`dataRowChange ${isPos ? 'isPos' : 'isNeg'}`}>
                  {isPos ? "+" : ""}{formatSignedPercent(ind.changePct)}
                </span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
