# AdSense Value Recovery Plan

Date: 2026-05-12 KST

## Scope

This plan responds to the current AdSense rejection reason: low-value or no-value content.
It is based on a local review of `AGENTS.md`, `YOUTUBE_NEWS_WORK_SPEC.md`, the frontend pages,
the YouTube news source archive, and current Google AdSense / Publisher Policy guidance.

No deployment is required for this planning document.

## Operating Constraints Confirmed

- Frontend, copy, calculator, CSS, and static page changes must use `deploy-hosting`.
- Routine YouTube news publishing must use `publish_youtube_news.cmd` / `publish-youtube-news`.
- Routine JSON data refreshes must use Cloud Storage JSON upload paths.
- Cloud Run / Cloud Build must not be used unless Cloud Run code, Cloud Run environment variables,
  Firebase rewrite pinning, or Cloud Scheduler configuration changes are actually required.
- Before any cost-impacting deploy, confirm the workflow and why Cloud Run / Cloud Build is necessary.

## Policy Basis

Official Google guidance relevant to this rejection:

- AdSense eligibility requires high-quality, original content that attracts an audience:
  https://support.google.com/adsense/answer/9724
- AdSense approval guidance says pages should have unique, relevant content and clear navigation:
  https://support.google.com/adsense/answer/7299563
- AdSense disapproval guidance lists insufficient content, content quality issues, navigation issues,
  and auto-generated / little-original-content pages as common problems:
  https://support.google.com/adsense/answer/81904
- Publisher Policy disallows Google-served ads on pages without publisher content, low-value content,
  under-construction pages, dead-end pages, and automatically generated content without manual review:
  https://support.google.com/publisherpolicies/answer/11112688
- Publisher Policy disallows ads on replicated content from external sources unless the publisher adds
  meaningful commentary, curation, or other value:
  https://support.google.com/publisherpolicies/answer/11190248

## Current Local Findings

- `AGENTS.md` and `YOUTUBE_NEWS_WORK_SPEC.md` are present and consistent with the cost-safe deploy policy.
- YouTube news source inventory currently has 19 `digest_db.json` reports, 59 total items, and 0 non-Gemini
  items in the local source archive.
- The site has real publisher pages: home dashboard, stock calculator, history, model explanation,
  operations policy, terms, privacy, disclaimer, and contact.
- The strongest original asset is the KOSPI opening-range model and calculator, not the YouTube summary board.
- The YouTube news section is the highest AdSense risk because it summarizes third-party videos and can look
  like replicated or automatically generated content unless it contains visible original analysis and review.
- `/youtube-news/post?item=...` is a client-driven query page with generic metadata and a shared canonical.
  This can look thin to crawlers and reviewers, especially while it is in a loading or missing-item state.
- `LiveDashboard` initially gates the main forecast display behind a client sync state. The server-rendered
  page can show placeholder dashes even though initial data exists.
- The AdSense script is loaded globally from `frontend/src/app/layout.tsx`, so future auto ads could appear
  on thin, loading, error, policy, or navigation-only screens unless ad placement is controlled.
- Several non-home pages do not share the full footer link set, so legal and trust pages are less consistently
  discoverable outside the home page.

## Primary Recovery Strategy

The recovery direction is to make the site unmistakably a proprietary KOSPI opening research platform, then
either de-risk or enrich the YouTube news feature.

Priority order:

1. Make core model value visible in initial HTML.
2. Add enough original, crawlable research pages that are not summaries of third-party content.
3. Refactor YouTube news so it is either noindex/noads or clearly editorial, reviewed, and value-added.
4. Restrict ad eligibility to pages with substantial publisher content.
5. Rebuild, deploy with Hosting only, verify crawlability, then request AdSense review again.

## Phase 1: Fix Crawlable Core Value

Target files:

- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/app/page.tsx`
- `frontend/src/components/site-header.tsx`
- shared footer component if added

Tasks:

- Show server-provided prediction values immediately on first render instead of showing `-` until client sync.
- Keep the sync indicator, but do not make the initial page look empty or under construction.
- Add a reusable footer to all main pages with links to About, History, Calculator, Terms, Privacy,
  Disclaimer, Contact, and Operations Policy.
- Add a short visible "why this exists" research intro near the dashboard, not only inside collapsed details.
- Make the homepage's first viewport and first scroll clearly about proprietary model output and validation.

Acceptance criteria:

- View source / initial HTML contains meaningful forecast, methodology, or explanatory text.
- Non-home pages expose the same trust/navigation links.
- No primary page looks like a loading shell when JavaScript or API refresh is delayed.

## Phase 2: Add Original Research Pages

Add a small research library with original, durable pages.

Recommended pages:

- `/research/kospi-opening-mechanics`
- `/research/ewy-usdkrw-model`
- `/research/night-futures-bridge`
- `/research/model-validation`
- `/research/risk-and-limitations`
- `/research/data-sources-methodology`
- `/research/how-to-read-opening-range`
- `/research/calculator-guide`

Content requirements:

- Each page should be original Korean text, roughly 800 to 1,500 words.
- Each page should contain complete paragraphs, not only bullets.
- Use project-specific examples from current model data, backtest records, or calculator logic.
- Include source/data caveats and investment disclaimer where appropriate.
- Add unique metadata, canonical URL, JSON-LD where useful, and sitemap entries.

Acceptance criteria:

- At least 8 original research pages are linked from the homepage and sitemap.
- Each page gives a clear reason to visit that is independent of YouTube summaries.
- The site can pass a manual review as a model/research product even if the news board is ignored.

## Phase 3: De-Risk YouTube News

Target files:

- `frontend/scripts/sync-news.mjs`
- `frontend/src/lib/youtube-news-types.ts`
- `frontend/src/lib/youtube-news-board.ts`
- `frontend/src/lib/youtube-news-format.ts`
- `frontend/src/app/youtube-news/page.tsx`
- `frontend/src/app/youtube-news/post/page.tsx`
- `frontend/src/components/youtube-news-post-viewer.tsx`

Immediate safer option:

- Add `noindex` to individual YouTube query-detail pages until they are statically rendered and editorially enriched.
- Keep `/youtube-news` as a navigable board, but position it as a curated watchlist, not the site's core content.
- Do not place ads on YouTube detail/loading/missing-item pages during approval recovery.

Preferred durable option:

- Replace `/youtube-news/post?item=...` with static, canonical detail URLs such as `/youtube-news/<slug>` or
  `/news/youtube/<id>`.
- Generate per-post metadata, article JSON-LD, canonical URL, and sitemap entries only for reviewed posts.
- Carry `summary_provider` into the public JSON as `summaryProvider`.
- Add an explicit `reviewed` / `editorialReviewedAt` field before a post is eligible for sitemap or ads.
- Filter public board exposure by `summaryProvider === "gemini"` plus quality score.
- Add a 코스피프리뷰 interpretation block to each post:
  - "왜 중요한가"
  - "코스피 시초가 모델에 주는 시사점"
  - "관련 지표"
  - "유의점"
  - "출처와 원문 영상"
- Remove or correct misleading duplicate actions such as a same-page "원문 리포트(새 탭)" link.

Acceptance criteria:

- YouTube content is not just a rewritten video summary.
- Each published news post includes visible original analysis or remains noindex/noads.
- No fallback transcript, ad text, raw transcript fragment, or generic generated-summary language is visible.

## Phase 4: Ad Placement Policy

Target files:

- `frontend/src/app/layout.tsx`
- future ad slot components

Tasks:

- Keep the AdSense account verification meta/code if needed for review.
- Prefer manual ad slots after approval instead of broad auto ads during the recovery period.
- Do not serve ads on:
  - loading pages
  - missing-item pages
  - contact-only pages
  - login/error/dead-end screens
  - noindex YouTube detail pages
  - pages with little original publisher content
- Ensure ad labels are clear and ads never outnumber or dominate publisher content.

Acceptance criteria:

- Every page eligible for ads has substantial original content above and around the ad area.
- Empty and error states cannot receive Google-served ads.

## Phase 5: Verification And Resubmission

Verification steps:

- Run `npm run build` from `frontend`.
- Inspect initial HTML for `/`, `/about`, `/history`, `/quant-calculator`, `/youtube-news`, and new research pages.
- Check `robots.txt`, `sitemap.xml`, canonical URLs, metadata, and footer links.
- Confirm all policy/trust pages are reachable within one click from major pages.
- Confirm YouTube detail pages are either noindex/noads or fully enriched/static/canonical.
- Deploy with the Hosting-only workflow `deploy-hosting`.
- Do not run Cloud Run or Cloud Build unless server/API/Scheduler behavior changes.
- After deployment, verify production URLs on `https://kospipreview.com`.
- Let Search Console discover the improved pages before requesting AdSense review again.

Resubmission readiness checklist:

- 8 or more original research pages published and indexed in sitemap.
- Homepage initial render is not blank/placeholder-heavy.
- Calculator and model pages have visible explanatory content.
- YouTube summaries are not the dominant value proposition.
- AdSense script/ad placement is not active on thin states.
- Privacy, terms, disclaimer, contact, and operations policy are linked sitewide.
- No broken links, duplicate same-page "source" links, or under-construction language.

## Recommended First Implementation Batch

1. Add shared footer sitewide.
2. Show initial dashboard data immediately.
3. Add two high-value research pages first:
   - EWY + USD/KRW model methodology
   - How to read KOSPI opening range
4. Add `noindex` to `/youtube-news/post` until it becomes static and enriched.
5. Update `sync-news` to expose `summaryProvider` and enforce quality filtering.
6. Run `npm run build`.
7. Deploy with `deploy-hosting` only after review.

