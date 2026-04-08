type SiteHeaderProps = {
  lastUpdated?: string;
  dataUpdatedAt?: string;
  marketUpdatedAt?: string;
  deployUpdatedAt?: string;
  currentAt?: string;
  checkedAt?: string;
  changedAt?: string;
  status: "fresh" | "aging" | "stale" | string;
  isSyncing?: boolean;
};

const STATUS_META = {
  fresh: { label: "LIVE", className: "" },
  aging: { label: "CHECKING", className: "isAging" },
  stale: { label: "STALE", className: "isStale" },
} as const;

export function SiteHeader({
  lastUpdated,
  dataUpdatedAt,
  marketUpdatedAt,
  deployUpdatedAt,
  currentAt,
  checkedAt,
  changedAt,
  status,
  isSyncing = false,
}: SiteHeaderProps) {
  const meta = STATUS_META[status as keyof typeof STATUS_META] ?? {
    label: "UNKNOWN",
    className: "isStale",
  };

  return (
    <header className="siteHeader">
      <a className="brandLockup" href="/">
        <span className="brandMark" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 16L9 11L13 14L20 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M15 7H20V12"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className="brandText">
          <span className="brandTitle">KOSPI DAWN</span>
          <span className="brandSubtitle">Opening Range Tracker</span>
        </span>
      </a>

      <div className="statusRow">
        <div className={`statusLabel ${meta.className}`}>
          <div className={`statusDot ${isSyncing ? "isSyncing" : ""}`} />
          {meta.label}
        </div>
        <div className="statusTimeGroup">
          <div className="statusTime">시장 지표 갱신 시간: {dataUpdatedAt ?? lastUpdated ?? "-"}</div>
          {marketUpdatedAt ? <div className="statusMetaLine">최종 시장시각 {marketUpdatedAt} KST</div> : null}
          {currentAt ? <div className="statusMetaLine">현재 시각 {currentAt} KST</div> : null}
          {deployUpdatedAt || checkedAt || changedAt ? (
            <div className="statusMetaLine">
              {deployUpdatedAt ? `사이트 반영시각 ${deployUpdatedAt} KST` : ""}
              {deployUpdatedAt && checkedAt ? " · " : ""}
              {checkedAt ? `마지막 확인 ${checkedAt} KST` : ""}
              {(deployUpdatedAt || checkedAt) && changedAt ? " · " : ""}
              {changedAt ? `마지막 변경 ${changedAt} KST` : ""}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
