# Operations Spec Index

Baseline date: 2026-04-14

## Read This First

If work resumes later, read these documents in order:

1. `docs/OPERATIONS_INDEX.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CLOUD_RUN_LIVE_REFRESH.md`
4. `docs/ALGORITHM.md`
5. `docs/DATA_SOURCES.md`
6. `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
7. `docs/SECURITY_OPERATIONS_RUNBOOK.md`
8. `docs/CHANGELOG.md`

## Current Production Summary

- Primary host: `https://kospipreview.com`
- `www` host: `https://www.kospipreview.com`
- Root domain edge: Cloudflare proxied
- `www` DNS: Cloudflare proxied CNAME to Firebase Hosting
- Static frontend hosting: Firebase Hosting
- Live refresh path: Cloud Run + Cloud Scheduler + Cloud Storage
- Full rebuild path: GitHub Actions `retrain-model`
- Production deploy workflow: GitHub Actions `deploy-production`
- Fallback-only refresh workflow: GitHub Actions `refresh-night-futures`
- YouTube news source archive: root `news/YYYY-MM-DD/HHMMSS/`
- YouTube news public sync: `frontend/scripts/sync-news.mjs`
- YouTube news dynamic API: `/api/news/youtube-news.json`, `/api/news/reports/**`
- YouTube news page: `/youtube-news`
- YouTube news post detail: `/youtube-news/post?item=<id>`
- Current prediction engine: `EWY Synthetic K200 Ridge`
- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Storage bucket: `kospipreview-live-data`
- Live refresh performance control: `YAHOO_FETCH_WORKERS` default `6`

## Current Operating Schedule

All times are Asia/Seoul.

- `09:00`
  - prediction target rolls to the next business day;
  - pending state is created outside the operating window.
- `15:30`
  - prediction operating window opens;
  - current KOSPI close becomes `prevClose`;
  - night-futures simple conversion can publish when the target night quote is available;
  - EWY + FX conversion and live model prediction stay blank until the U.S. premarket bridge is ready.
- `15:45`
  - KOSPI 200 day futures close can be final if the eSignal socket close timestamp is at or after this time.
- U.S. premarket open through `09:00`
  - live prediction trend chart records minute-level observations;
  - starts at `17:00 KST` during U.S. daylight time and `18:00 KST` during U.S. standard time.
  - during U.S. daylight time, the `18:00~18:08 KST` night-futures-open window is also a scheduled bridge sampling window when the `17:00 KST` window was not complete.

## Current Model Rules

- Model input basis: KRX `15:30 KST` sync basis plus a one-time night-futures bridge to the EWY premarket basis.
- Indicator card display basis: standard market displayed change.
- Yahoo EWY premarket displayed change versus prior U.S. close must not be used ahead of the KRX-sync EWY return.
- Night futures are used only once to bridge the `15:30 -> U.S. premarket open` EWY no-trade gap.
- Night futures remain separately published as comparison and validation data.
- `model.nightFuturesBridgeApplied` should be `true` after the bridge is ready.
- Strong EWY + USD/KRW trend moves can activate `model.trendFollowApplied`,
  which lifts compressed model output using EWY + USD/KRW after the bridge point.
- Night futures simple conversion should carry forward the last observed quote
  from the target night session through `09:00 KST`; session close alone must
  not blank the target operating day's displayed/simple-record value.

## Settlement And Actual Record Rules

- KOSPI actual close is read after `15:30 KST` from Naver or chart fallback.
- KOSPI 200 day futures final close is accepted after `15:45 KST` socket settlement.
- KOSPI 200 night futures simple conversion uses:
  - current KOSPI close;
  - final day futures close;
  - live night futures close.
- After night futures trading closes, the same conversion uses the last quote
  observed inside that target night session until the `09:00 KST` rollover.
- EWY + FX simple conversion uses:
  - current KOSPI close;
  - one-time night-futures bridge sampled from U.S. premarket open;
  - EWY return after the bridge timestamp;
  - USD/KRW return after the bridge timestamp.
- `history.json` recent actual rows track:
  - `actualOpen`
  - `actualClose`
  - `dayFuturesClose`, final same-date day futures settlement only
  - `nightFuturesClose`, fixed from the actual date's pre-open night session
  - fixed pre-open `modelPrediction`
  - fixed pre-open `nightFuturesSimpleOpen`
  - fixed pre-open `ewyFxSimpleOpen`
- The next prediction target may show live night-futures comparisons, but those
  live values must not be treated as recent-actual futures close fields until
  that target date has an actual open.
- `dayFuturesClose` and `nightFuturesClose` in `history.json` start from rows dated
  `2026-04-14`; the `2026-04-13` row is intentionally blank for both fields.

## Important Code

- `scripts/refresh_night_futures.py`
- `scripts/backtest_and_generate.py`
- `cloudrun/live_data_service.py`
- `frontend/scripts/sync-news.mjs`
- `frontend/src/lib/data.ts`
- `frontend/src/lib/youtube-news.ts`
- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/components/youtube-news-summary.tsx`
- `frontend/src/components/accuracy-table.tsx`
- `frontend/src/components/prediction-trend-chart.tsx`

## YouTube News Archive Rules

- Daily source reports live under `news/YYYY-MM-DD/HHMMSS/`.
- Each report directory should include `digest_db.json` and `index.html`.
- `npm run dev` and `npm run build` run `npm run sync-news` automatically.
- `sync-news` generates local fallback `frontend/public/data/youtube-news.json`.
- Cloud Run serves dynamic news from Cloud Storage:
  - `gs://kospipreview-live-data/youtube-news/youtube-news.json`
  - `gs://kospipreview-live-data/youtube-news/reports/**`
- The homepage displays the `유튜버 뉴스` section below the hero forecast and above `예측 추이`.
  - Desktop: up to 10 items (`2 x 5`).
  - Mobile: first 5 items.
- `/youtube-news` displays 게시판형 목록 and daily report cards.
- Each 게시글 opens internal post detail (`/youtube-news/post?item=<id>`) with:
  - top + bottom back buttons to board
  - section-based edited body rendering
  - newer/older post pager.
- Board exposure uses quality-first dedupe (source/title key + quality score) before recency ordering.
- Raw daily report cards remain available as archive references and open in a new tab.
- Dynamic news API fallback files are local deploy artifacts and should not be committed:
  - `frontend/public/data/youtube-news.json`
- The root `news/` directory is the durable source content and should be preserved.
- Daily operator helper:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\update_youtube_news_content.ps1 -Date 2026-04-23 -UploadDynamic`
  - optional first-time release or route changes only: add `-Build -Deploy`
  - If `-SourceRoot` is omitted, the script auto-detects `C:\Users\dw\Desktop\AntiGravity\*\results` containing the requested date.

## Important Docs

- Architecture: `docs/ARCHITECTURE.md`
- Live refresh: `docs/CLOUD_RUN_LIVE_REFRESH.md`
- Algorithm: `docs/ALGORITHM.md`
- Data sources: `docs/DATA_SOURCES.md`
- Model spec: `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
- Security / runbook: `docs/SECURITY_OPERATIONS_RUNBOOK.md`
- Firebase / Cloudflare / GA4 / AdSense guide: `docs/FIREBASE_CLOUDFLARE_GA4_ADSENSE_2026.md`

## Latest Verified Production State

Last verified on 2026-04-23 KST:

- Firebase Hosting manual release message: `Restore YouTube news tab after rebase`.
- Firebase Hosting release id:
  - `projects/303729438868/sites/kospipreview/channels/live/releases/1776933697045000`
- Firebase Hosting release time: `2026-04-23T08:41:37Z` (`2026-04-23 17:41 KST`).
- Custom domain root verified: `https://kospipreview.com/`.
- Firebase default host verified: `https://kospipreview.web.app/`.
- Both roots include:
  - top navigation link `/youtube-news`;
  - homepage `유튜버 뉴스` section;
  - desktop up to 10 items / mobile 5 items above `예측 추이`.
- `/youtube-news` verified on the custom domain.
- Static report verified with Firebase clean URL:
  - `/news/2026-04-23/042441`
- Cloudflare is in front of the custom domain:
  - response headers include `Server: cloudflare` and `CF-RAY`;
  - production verification must check both `kospipreview.web.app` and `kospipreview.com`.
- Overwrite risk and guardrail:
  - `retrain-model` redeploys hosting from `main` every 5 minutes on weekdays.
  - If local-only UI changes are manually deployed without pushing to `main`, the next scheduled run can remove those changes.
  - For static UI/content updates, always commit + push first, then deploy or verify the next scheduled deploy.

## Operating Principles

- Keep secrets out of git, chat, and issues.
- Treat Cloud Run live refresh as the primary freshness path.
- Treat `retrain-model` as the primary full rebuild and static publish path.
- Use fallback workflow only when Cloud Run live refresh is degraded.
- Never rely on local-only hosting deploys for persistent UI changes; push to `main` before final verification.
- Keep docs updated whenever time gates, model inputs, settlement rules, IAM, deploy flow, or content archive flow changes.
