type SiteHeaderProps = {
  lastUpdated: string;
  status: string;
};

export function SiteHeader({ lastUpdated, status }: SiteHeaderProps) {
  const isFresh = status === "fresh";

  return (
    <header className="siteHeader">
      <a className="brandLockup" href="/">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 22H22L12 2Z" fill="var(--accent-bright)" />
        </svg>
        KOSPI DAWN
      </a>
      
      <div className="statusRow">
        <div className={`statusLabel ${isFresh ? '' : 'isStale'}`}>
          <div className="statusDot" />
          {isFresh ? "LIVE" : "DELAYED"}
        </div>
        <div className="statusTime">Update: {lastUpdated}</div>
      </div>
    </header>
  );
}
