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
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    setIsNew(true);
    const timer = setTimeout(() => setIsNew(false), 2000);
    return () => clearTimeout(timer);
  }, [value, updatedAt]);

  return (
    <article className={`indicatorCard ${emphasized ? "isPrimary" : ""} ${isNew ? "isUpdating" : ""}`}>
      <div className="indicatorLabel">{label}</div>
      <div className="indicatorValue">{value}</div>
      <div className={`indicatorChange ${directionClass}`}>
        {changePct >= 0 ? "▲" : "▼"} {formatSignedPercent(changePct)}
      </div>
      <div className="indicatorUpdated">
        {formatDateTime(updatedAt)}
      </div>
      
      {sourceUrl && (
        <a
          href={sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          title={dataSource ?? "Yahoo Finance에서 확인"}
          className="sourceLink"
        >
          출처
        </a>
      )}
    </article>
  );
}
