"use client";

export function LiveStatus({ lastUpdated, status }: { lastUpdated: string; status: string }) {
  const statusLabel = {
    fresh: "정상 갱신",
    aging: "갱신 지연",
    stale: "점검 필요",
  }[status] ?? "확인 중";

  const statusColor = {
    fresh: "var(--positive)",
    aging: "var(--gold)",
    stale: "var(--negative)",
  }[status] ?? "var(--text-dim)";

  return (
    <div className="liveStatusBar">
      <div className="liveStatusDot">
        {status === "fresh" && <div className="liveStatusPing" />}
        <div className="liveStatusDotInner" style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }} />
      </div>
      <span className="liveStatusText" style={{ color: statusColor }}>
        {statusLabel}
      </span>
      <span className="liveStatusTime">최종 갱신 {lastUpdated}</span>
    </div>
  );
}
