"use client";

import { useEffect, useState } from "react";

export function LiveStatus({ lastUpdated }: { lastUpdated: string }) {
  const [pulse, setPulse] = useState(false);
  const [dots, setDots] = useState("");

  // Simulate a live update ping every 3-7 seconds
  useEffect(() => {
    const minDelay = 3000;
    const maxDelay = 7000;

    function triggerPulse() {
      setPulse(true);
      setTimeout(() => setPulse(false), 800);
      
      const nextDelay = Math.random() * (maxDelay - minDelay) + minDelay;
      setTimeout(triggerPulse, nextDelay);
    }
    
    // Start interval
    const initialDelay = Math.random() * 2000 + 1000;
    const timer = setTimeout(triggerPulse, initialDelay);
    return () => clearTimeout(timer);
  }, []);

  // Animate dots ...
  useEffect(() => {
    const timer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? "" : prev + ".");
    }, 500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "center", background: "var(--color-surface)", padding: "12px 16px", borderRadius: "12px", border: "1px solid var(--color-border)", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ position: "relative", width: "12px", height: "12px" }}>
          {pulse && (
            <div 
              style={{
                position: "absolute",
                top: 0, left: 0, width: "100%", height: "100%",
                background: "var(--color-success)",
                borderRadius: "50%",
                animation: "ping 0.8s cubic-bezier(0, 0, 0.2, 1) forwards"
              }}
            />
          )}
          <div style={{ width: "100%", height: "100%", background: "var(--color-success)", borderRadius: "50%" }} />
        </div>
        <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "var(--color-success)" }}>
          {pulse ? "데이터 수집 패킷 수신 중" : "백그라운드 파이프라인 연결됨"}
          <span style={{ display: "inline-block", width: "20px" }}>{pulse ? dots : ""}</span>
        </span>
      </div>
      
      <div style={{ width: "1px", height: "20px", background: "var(--color-border)" }} />
      
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-dim)", fontFamily: "monospace" }}>
        최종 레지스트리 갱신: {lastUpdated}
      </span>
      <span style={{ fontSize: "0.85rem", color: "var(--color-text-dim)", fontFamily: "monospace", marginLeft: "auto" }}>
        자동 갱신 활성화
      </span>
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.5);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
