"use client";

import { useEffect, useRef, useState } from "react";
import { ARTICLE_REFRESH_MS, SPIRIT_ORIGIN, articleTrackingUrl, fetchSpiritArticles, type SpiritArticle } from "@/lib/spirit-articles";

export function SpiritArticleBanner() {
  const [articles, setArticles] = useState<SpiritArticle[]>([]);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [failed, setFailed] = useState(false);
  const region = useRef<HTMLElement>(null);
  const touchStart = useRef<number | null>(null);
  const impressions = useRef(new Set<number>());

  useEffect(() => {
    let disposed = false;
    let busy = false;
    let lastAttempt = 0;
    let lastSuccess = 0;
    async function refresh() {
      if (document.hidden || busy || Date.now() - lastAttempt < ARTICLE_REFRESH_MS) return;
      busy = true;
      lastAttempt = Date.now();
      try {
        const next = await fetchSpiritArticles();
        if (!disposed) { setArticles(next); setActive(index => Math.min(index, Math.max(next.length - 1, 0))); setFailed(false); lastSuccess = Date.now(); }
      } catch {
        if (!disposed) {
          setFailed(true);
          // Never retain withdrawn content indefinitely during a prolonged outage.
          if (Date.now() - lastSuccess > 60 * 60 * 1000) setArticles([]);
        }
      } finally { busy = false; }
    }
    const visibility = () => { setVisible(!document.hidden); void refresh(); };
    const small = window.matchMedia("(max-width: 720px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preferences = () => { setMobile(small.matches); setReducedMotion(motion.matches); };
    preferences();
    small.addEventListener("change", preferences);
    motion.addEventListener("change", preferences);
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("focus", visibility);
    void refresh();
    const interval = window.setInterval(() => void refresh(), ARTICLE_REFRESH_MS);
    return () => {
      disposed = true;
      clearInterval(interval);
      small.removeEventListener("change", preferences);
      motion.removeEventListener("change", preferences);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("focus", visibility);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), { threshold: 0.5 });
    if (region.current) observer.observe(region.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobile || paused || hovered || reducedMotion || !visible || !onScreen || articles.length < 2) return;
    const interval = window.setInterval(() => setActive(index => (index + 1) % articles.length), 7000);
    return () => clearInterval(interval);
  }, [mobile, paused, hovered, reducedMotion, visible, onScreen, articles.length]);

  useEffect(() => {
    if (!visible || !onScreen) return;
    for (const article of mobile ? articles.slice(active, active + 1) : articles) {
      if (impressions.current.has(article.id) || !window.gtag) continue;
      window.gtag("event", "spirit_article_impression", { article_id: article.id, placement: "home_top" });
      impressions.current.add(article.id);
    }
  }, [active, articles, mobile, visible, onScreen]);

  const move = (direction: number) => {
    setPaused(true);
    setActive(index => (index + direction + articles.length) % Math.max(articles.length, 1));
  };

  return (
    <section ref={region} className="spiritArticles" aria-label="인사이트 스피릿 마켓 최신 기사"
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={event => { if (!(event.target as HTMLElement).closest("[data-playback]")) setPaused(true); }}
      onKeyDown={event => { if (mobile && ["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <div className="spiritArticlesHeading"><h2>인사이트 스피릿 <span>마켓</span></h2><a href={`${SPIRIT_ORIGIN}/`}>전체 기사 ↗</a></div>
      <div className="spiritArticleGrid" onTouchStart={event => { touchStart.current = event.touches[0].clientX; }}
        onTouchEnd={event => { if (mobile && touchStart.current !== null) { const distance = event.changedTouches[0].clientX - touchStart.current; if (Math.abs(distance) > 45) move(distance > 0 ? -1 : 1); } touchStart.current = null; }}
        aria-live="off">
        {articles.map((article, index) => (
          <a className={`spiritArticle${index === active ? " isActive" : ""}`} key={article.id}
            tabIndex={mobile && index !== active ? -1 : 0} href={articleTrackingUrl(article)}
            onClick={() => window.gtag?.("event", "spirit_article_click", { article_id: article.id, placement: "home_top", position: index + 1 })}>
            {article.image ? (
              // Public WordPress medium-size thumbnails; no image optimization server required.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={article.image} width="300" height="169" alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
            ) : <span className="spiritArticleMonogram" aria-hidden="true">IS</span>}
            <span className="spiritArticleCopy"><small>경제·기술 인사이트</small><strong>{article.title}</strong><time dateTime={article.date}>{new Date(article.date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "long", day: "numeric" })}</time></span>
          </a>
        ))}
        {!articles.length && <p className="spiritArticleFallback">{failed ? "최신 기사를 불러오지 못했습니다. " : "최신 기사를 확인하고 있습니다. "}<a href={SPIRIT_ORIGIN}>마켓에서 바로 읽기 ↗</a></p>}
      </div>
      <div className="spiritArticlesFooter"><small>{failed && articles.length ? "연결 복구 후 자동 갱신됩니다" : "자사 콘텐츠 · 최신 공개 글 자동 업데이트"}</small>
        {articles.length > 1 && <div className="spiritArticleControls" aria-label="기사 순환 제어">
          <button type="button" aria-label="이전 기사" onClick={() => move(-1)}>‹</button><span aria-live="polite" aria-atomic="true">{active + 1} / {articles.length}</span><button type="button" aria-label="다음 기사" onClick={() => move(1)}>›</button>
          {!reducedMotion && <button type="button" data-playback aria-label={paused ? "기사 자동 순환 재생" : "기사 자동 순환 일시정지"} onClick={() => setPaused(value => !value)}>{paused ? "재생" : "일시정지"}</button>}
        </div>}
      </div>
    </section>
  );
}
