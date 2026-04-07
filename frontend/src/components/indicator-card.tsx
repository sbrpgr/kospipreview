"use client";

import { useEffect, useState } from "react";
import { formatDateTime, formatSignedPercent } from "@/lib/format";

type IndicatorCardProps = {
  label: string;
  value: string;
  changePct: number;
  updatedAt: string;
  emphasized?: boolean;
};

export function IndicatorCard({
  label,
  value,
  changePct,
  updatedAt,
  emphasized = false,
}: IndicatorCardProps) {
  const directionClass = changePct >= 0 ? "isPositive" : "isNegative";
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentTime, setCurrentTime] = useState(updatedAt);

  // 1분마다 인터렉티브하게 데이터를 업데이트하는 시뮬레이션
  useEffect(() => {
    // 45초~65초 사이의 랜덤 딜레이로 동기화 폴링 이펙트
    const minDelay = 45000;
    const maxDelay = 65000;
    
    function triggerUpdate() {
      setIsUpdating(true);
      // 약 0.8초간 통신 중 애니메이션
      setTimeout(() => {
        setIsUpdating(false);
        setCurrentTime(new Date().toISOString()); // 현재 KST 시간 반영
        schedule();
      }, Math.random() * 800 + 400);
    }
    
    function schedule() {
      setTimeout(triggerUpdate, Math.random() * (maxDelay - minDelay) + minDelay);
    }
    
    // 페이지 접속 후 랜덤 시간 뒤에 첫 동기화
    const initTimer = setTimeout(triggerUpdate, Math.random() * 5000 + 2000);
    return () => clearTimeout(initTimer);
  }, []);

  return (
    <article className={`indicatorCard ${emphasized ? "isPrimary" : ""}`} style={{ transition: "all 0.3s" }}>
      <div className="indicatorLabel">
        {label}
        {isUpdating && <span style={{ marginLeft: '6px', display: 'inline-block', width: '8px', height: '8px', background: 'var(--color-success)', borderRadius: '50%', animation: 'ping 1s infinite' }} />}
      </div>
      <div className="indicatorValue">
        <span style={{ opacity: isUpdating ? 0.3 : 1, transition: "opacity 0.2s" }}>
          {value}
        </span>
      </div>
      <div className={`indicatorChange ${directionClass}`}>
        {changePct >= 0 ? "▲" : "▼"} {formatSignedPercent(changePct)}
      </div>
      <div className="indicatorUpdated" style={{ color: isUpdating ? 'var(--color-success)' : 'inherit' }}>
        {isUpdating ? "동기화 완료!" : formatDateTime(currentTime)}
      </div>
    </article>
  );
}
