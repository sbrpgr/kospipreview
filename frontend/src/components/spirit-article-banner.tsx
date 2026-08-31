"use client";

import { useEffect, useRef, useState } from "react";
import { ARTICLE_REFRESH_MS, ROTATION_MS, articleTrackingUrl, fetchSpiritChannels, emptyChannels, mobileSequence, desktopEntries, type SpiritChannel } from "@/lib/spirit-articles";

export function SpiritArticleBanner() {
  const [channels, setChannels] = useState<SpiritChannel[]>(emptyChannels);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [visible, setVisible] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const region = useRef<HTMLElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const impressions = useRef(new Set<string>());
  const sequence = mobileSequence(channels);
  const count = mobile ? sequence.length : Math.max(0, ...channels.map(channel => channel.articles.length));
  const position = active % Math.max(count, 1);
  const entries = mobile && sequence.length ? [sequence[position]] : desktopEntries(channels, position);

  useEffect(() => {
    let disposed = false;
    let busy = false;
    let lastAttempt = 0;
    async function refresh() {
      if (document.hidden || busy || Date.now() - lastAttempt < ARTICLE_REFRESH_MS) return;
      busy = true;
      lastAttempt = Date.now();
      try {
        const next = await fetchSpiritChannels();
        if (!disposed) setChannels(previous => JSON.stringify(previous) === JSON.stringify(next) ? previous : next);
      } finally { busy = false; }
    }
    const visibility = () => { setVisible(!document.hidden); void refresh(); };
    const small = window.matchMedia("(max-width: 1000px)");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const preferences = () => { setMobile(small.matches); setReducedMotion(motion.matches); setActive(0); };
    preferences();
    setVisible(!document.hidden);
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
    if (paused || hovered || reducedMotion || !visible || !onScreen || count < 2) return;
    const interval = window.setInterval(() => setActive(index => (index + 1) % count), ROTATION_MS);
    return () => clearInterval(interval);
  }, [paused, hovered, reducedMotion, visible, onScreen, count]);

  useEffect(() => {
    if (!visible || !onScreen) return;
    const shown = mobile ? mobileSequence(channels).slice(position, position + 1) : desktopEntries(channels, position);
    for (const { article, channel } of shown) {
      if (!article) continue;
      const key = `${channel.id}:${article.id}`;
      if (impressions.current.has(key) || !window.gtag) continue;
      window.gtag("event", "spirit_article_impression", { article_id: article.id, article_channel: channel.id, placement: "home_top" });
      impressions.current.add(key);
    }
  }, [position, channels, mobile, visible, onScreen]);

  const move = (direction: number) => {
    setPaused(true);
    setActive((position + direction + Math.max(count, 1)) % Math.max(count, 1));
  };

  return (
    <section ref={region} className="spiritArticles" aria-label="마켓·돈 되는 소식·건강 최신 기사"
      onPointerEnter={event => { if (event.pointerType === "mouse") setHovered(true); }} onPointerLeave={() => setHovered(false)}
      onFocusCapture={event => { if (!(event.target as HTMLElement).closest("[data-playback]")) setPaused(true); }}
      onKeyDown={event => { if (["ArrowLeft", "ArrowRight"].includes(event.key)) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); } }}>
      <div className="spiritArticlesHeading"><h2>인사이트 스피릿 <span>함께 읽는 최신 소식</span></h2>
        <div className="spiritArticleControls" aria-label="기사 순환 제어">
          <button type="button" aria-label="이전 기사" disabled={count < 2} onClick={() => move(-1)}>‹</button>
          <span>{count ? position + 1 : 0} / {count}</span>
          <button type="button" aria-label="다음 기사" disabled={count < 2} onClick={() => move(1)}>›</button>
          {!reducedMotion && count > 1 && <button type="button" data-playback aria-label={paused ? "기사 자동 순환 재생" : "기사 자동 순환 일시정지"} onClick={() => setPaused(value => !value)}>{paused ? "재생" : "일시정지"}</button>}
        </div>
      </div>
      <div className="spiritArticleGrid" aria-live="off"
        onTouchStart={event => { setPaused(true); touchStart.current = { x: event.touches[0].clientX, y: event.touches[0].clientY }; }}
        onTouchEnd={event => { const start = touchStart.current; if (mobile && start) { const dx = event.changedTouches[0].clientX - start.x; const dy = event.changedTouches[0].clientY - start.y; if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) move(dx > 0 ? -1 : 1); } touchStart.current = null; }}>
        {entries.map(({ channel, article }) => (
          <div className="spiritChannel" data-channel={channel.id} key={channel.id}>
            <div className="spiritChannelHeading"><a href={channel.url} target="_blank" rel="noopener noreferrer">{channel.label} ↗</a><small>{article ? "최신 글" : "분야 안내"}</small></div>
            {article ? <a className="spiritArticle" key={article.url} href={articleTrackingUrl(article)} target="_blank" rel="noopener noreferrer" aria-label={article.title} title={article.title}
              onClick={() => window.gtag?.("event", "spirit_article_click", { article_id: article.id, article_channel: channel.id, placement: "home_top" })}>
              <span className="spiritArticleMedia" aria-hidden="true"><span>INSIGHT SPIRIT</span>
                {article.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={article.image} width={article.imageWidth} height={article.imageHeight} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={event => { event.currentTarget.style.visibility = "hidden"; }} />
                )}
              </span>
              <span className="spiritArticleCopy"><strong>{article.title}</strong></span>
            </a> : <a className="spiritChannelFallback" href={channel.url} target="_blank" rel="noopener noreferrer"><strong>{channel.label}</strong><span>{channel.failed ? "연결이 복구되면 최신 글이 자동으로 표시됩니다." : "새 공개 글이 올라오면 이곳에 자동으로 표시됩니다."}</span><small>분야 둘러보기 ↗</small></a>}
          </div>
        ))}
      </div>
    </section>
  );
}
