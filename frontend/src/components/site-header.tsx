type SiteHeaderProps = {
  lastUpdated: string;
  status: string;
};

export function SiteHeader({ lastUpdated, status }: SiteHeaderProps) {
  const isFresh = status === "fresh";

  return (
    <header className="topNavbar">
      <div className="navBrand">
        <a className="brandLogo" href="/">
          KOSPI DAWN
        </a>
        <nav className="navLinks">
          <a className="navLink active" href="/">Chart</a>
          <a className="navLink" href="/history">History</a>
          <a className="navLink" href="/about">Model</a>
        </nav>
      </div>
      
      <div className="navStatusRow">
        <div className="navStatusItem">
          <span className={`statusDot ${isFresh ? 'isFresh' : 'isStale'}`}></span>
          <span style={{ color: isFresh ? "var(--positive)" : "var(--gold)" }}>
            {isFresh ? "LIVE" : "DELAYED"}
          </span>
        </div>
        <div className="navStatusItem">
          Update: <span className="time">{lastUpdated}</span>
        </div>
      </div>
    </header>
  );
}
