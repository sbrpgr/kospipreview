type SiteHeaderProps = {
  title: string;
  eyebrow: string;
  description: string;
};

const navItems = [
  { href: "/", label: "대시보드" },
  { href: "/history", label: "예측 기록" },
  { href: "/about", label: "모델 설명" },
];

export function SiteHeader({ title, eyebrow, description }: SiteHeaderProps) {
  return (
    <header className="siteHeader">
      <div className="siteHeaderTop">
        <a className="brandLockup" href="/">
          <span className="brandKicker">KOSPI DAWN</span>
          <strong>코스피 시초가 예측</strong>
        </a>
        <nav className="topNav" aria-label="주요 메뉴">
          {navItems.map((item) => (
            <a className="topNavLink" href={item.href} key={item.href}>
              {item.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="pageIntro">
        <p className="brandKicker">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="pageIntroText">{description}</p>
      </div>
    </header>
  );
}
