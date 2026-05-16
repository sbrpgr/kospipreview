export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="siteFooter">
      <div className="siteFooterInner">
        <div className="siteFooterBrand">
          <span className="siteFooterTitle">KOSPI DAWN</span>
          <span className="siteFooterDesc">
            코스피 시초가 예측 연구 플랫폼 · 투자 권유 아님
          </span>
        </div>
        <nav className="siteFooterNav" aria-label="사이트 하단 메뉴">
          <a href="/about">모델 안내</a>
          <a href="/research">리서치</a>
          <a href="/papers">연구논문</a>
          <a href="/history">예측 기록</a>
          <a href="/contact">문의</a>
          <a href="/disclaimer">면책공시</a>
          <a href="/privacy">개인정보처리방침</a>
          <a href="/terms">이용약관</a>
        </nav>
        <div className="siteFooterLegal">
          © {year} KOSPI Dawn. 본 서비스의 예측값은 연구 참고용이며 투자 결과에 대한 책임은 이용자 본인에게 있습니다.
        </div>
      </div>
    </footer>
  );
}
