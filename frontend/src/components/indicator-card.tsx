"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatSignedPercent } from "@/lib/format";

type IndicatorCardProps = {
  label: string;
  value: string;
  changePct: number;
  updatedAt: string;
  emphasized?: boolean;
  sourceUrl?: string;
  dataSource?: string;
};

export function IndicatorCard({
  label,
  value,
  changePct,
  updatedAt,
  emphasized = false,
  sourceUrl,
  dataSource,
}: IndicatorCardProps) {
  const directionClass = changePct >= 0 ? "isPositive" : "isNegative";
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(updatedAt);

  useEffect(() => {
    const minDelay = 45000;
    const maxDelay = 65000;

    function triggerUpdate() {
      setIsUpdating(true);
      setTimeout(() => {
        setIsUpdating(false);
        setCurrentTime(new Date().toISOString());
        schedule();
      }, Math.random() * 800 + 400);
    }

    function schedule() {
      setTimeout(triggerUpdate, Math.random() * (maxDelay - minDelay) + minDelay);
    }

    const initTimer = setTimeout(triggerUpdate, Math.random() * 5000 + 2000);
    return () => clearTimeout(initTimer);
  }, []);

  return (
    <article className={`indicatorCard ${emphasized ? "isPrimary" : ""}`} style={{ transition: "all 0.3s", position: "relative" }}>
      <div className="indicatorLabel">
        {label}
        {isUpdating && (
          <span style={{
            marginLeft: "6px", display: "inline-block", width: "8px", height: "8px",
            background: "var(--color-success)", borderRadius: "50%", animation: "ping 1s infinite"
          }} />
        )}
      </div>
      <div className="indicatorValue">
        <span style={{ opacity: isUpdating ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {value}
        </span>
      </div>
      <div className={`indicatorChange ${directionClass}`}>
        {changePct >= 0 ? "▲" : "▼"} {formatSignedPercent(changePct)}
      </div>
      <div className="indicatorUpdated" style={{ color: isUpdating ? "var(--color-success)" : "inherit" }}>
        {isUpdating ? "동기화 중..." : formatDateTime(currentTime)}
      </div>
      {/* 출처 링크 */}
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={dataSource ?? "Yahoo Finance에서 확인"}
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontSize: "0.7rem",
            color: "var(--color-text-dim)",
            textDecoration: "none",
            opacity: 0.5,
            transition: "opacity 0.2s",
            padding: "2px 5px",
            borderRadius: "4px",
            border: "1px solid var(--color-border)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.5")}
        >
          📡 출처
        </a>
      )}
    </article>
  );
}
