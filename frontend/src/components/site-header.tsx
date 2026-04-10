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
  operationState?: "operating" | "closed" | "holiday";
  operationLabel?: string;
};

const STATUS_META = {
  fresh: { label: "데이터 정상", className: "" },
  aging: { label: "데이터 확인중", className: "isAging" },
  stale: { label: "데이터 지연", className: "isStale" },
} as const;

const OPERATION_META = {
  operating: { label: "운영중", className: "isOperating" },
  closed: { label: "운영 종료", className: "isClosed" },
  holiday: { label: "휴장", className: "isHoliday" },
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
  operationState = "closed",
  operationLabel,
}: SiteHeaderProps) {
  const operationMeta = OPERATION_META[operationState] ?? {
    label: "운영 종료",
    className: "isClosed",
  };
  const freshnessMeta = STATUS_META[status as keyof typeof STATUS_META] ?? {
    label: "데이터 지연",
    className: "isStale",
  };
  const compactUpdatedAt = dataUpdatedAt ?? lastUpdated;
  const showCompactUpdatedAt =
    Boolean(compactUpdatedAt) &&
    !marketUpdatedAt &&
    !deployUpdatedAt &&
    !currentAt &&
    !checkedAt &&
    !changedAt;

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
        <div className={`statusLabel ${operationMeta.className}`}>
          <div className={`statusDot ${isSyncing ? "isSyncing" : ""}`} />
          {operationLabel ?? operationMeta.label}
        </div>
        <div className={`statusLabel isSubtle ${freshnessMeta.className}`}>{freshnessMeta.label}</div>
        {showCompactUpdatedAt ? (
          <div className="statusTimeGroup">
            <div className="statusTime">마지막 반영: {compactUpdatedAt}</div>
          </div>
        ) : null}
      </div>

      <nav className="headerNav" aria-label="주요 메뉴">
        <a href="/">홈</a>
        <a href="/history">기록</a>
        <a href="/about">모델</a>
        <a href="/contact">문의</a>
      </nav>
    </header>
  );
}
