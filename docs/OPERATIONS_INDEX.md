# Operations Spec Index

Baseline date: 2026-05-04

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
9. `docs/HISTORY_DATA_GAP_INCIDENT_2026-05-22.md`
10. `docs/INTRADAY_INDICATOR_SERIES_WORK_SPEC_2026-05-23.md`
11. `docs/HOME_TOP_AD_BANNER_WORK_SPEC_2026-06-07.md`
12. `docs/MODEL2_CLOCK_SYNC_WORK_SPEC_2026-06-09.md`

## Current Production Summary

- Primary host: `https://kospipreview.com`
- `www` host: `https://www.kospipreview.com`
- Root domain edge: Cloudflare proxied
- `www` DNS: Cloudflare proxied CNAME to Firebase Hosting
- Static frontend hosting: Firebase Hosting
- Live refresh path: Cloud Run + Cloud Scheduler + Cloud Storage
- Model JSON rebuild path: GitHub Actions `retrain-model`
- Hosting-only deploy workflow: GitHub Actions `deploy-hosting`
- Cloud Run deploy workflow: GitHub Actions `cloudrun-deploy`
- Fallback-only JSON refresh workflow: GitHub Actions `refresh-night-futures`
- Independent Model2 JSON workflow: GitHub Actions `refresh-holiday-prediction`
- Header support button: Ko-fi link `https://ko-fi.com/sbgkp` shown as `연구 후원하기` to the right of `문의`
- Home top ad banner: three-column `320x140` style placement between the global header and homepage forecast hero.
  The left slot uses Coupang Partners widget `id=995011`, `trackingCode=AF1258921`; the center and right slots show
  `광고문의 ytbtheguy@gmail.com`.
- YouTube news source archive: root `news/YYYY-MM-DD/HHMMSS/`
- YouTube news public sync: `frontend/scripts/sync-news.mjs`
- YouTube news dynamic API: `/api/news/youtube-news.json`, `/api/news/reports/**`
- YouTube news page: `/youtube-news`
- YouTube news post detail: `/youtube-news/post?item=<id>`
- Current prediction engine: `EWY Synthetic K200 Ridge`
- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Scheduler cadence: KST weekdays, every two minutes outside `09:00~16:59`
- Cloud Run refresh backstop: `REFRESH_MIN_INTERVAL_SECONDS=120` returns `202 throttled` for non-window calls if Scheduler still attempts every minute
- Cloud Storage bucket: `kospipreview-live-data`
- Intraday indicator research archive: `gs://kospipreview-live-data/intraday_indicator_series/`
- Live refresh performance control: `YAHOO_FETCH_WORKERS` default `6`
- Artifact image cleanup: GitHub Actions `cleanup-artifact-images` keeps newest 30 `gcr.io/kospipreview/kospi-live-data` digests and selects older digests after the minimum age window. Actual deletion requires `artifactregistry.repositories.deleteArtifacts` on `projects/kospipreview/locations/us/repositories/gcr.io`.
- Data refresh workflows seed current JSON from `gs://kospipreview-live-data/`
  before rebuilding and merge archive fallback fields so archive/history state is
  not reset to incomplete bundled or bucket files. Before publish, regenerated
  `history.json` rows keep existing non-null bucket verification fields when the
  regenerated value is `null`. If a wildcard Cloud Storage seed copy is
  partially interrupted by live object churn, the workflow should warn, keep any
  copied JSON files, and continue only when critical live-state seeds are
  present. If no bucket JSON files, or no `live_prediction_series.json`, were
  copied, the workflow must fail before publish so the prediction trend history
  is not overwritten by bundled or newly shortened data. Before publishing,
  JSON refresh workflows must remove empty bundled Model2 placeholders when the
  independent model skipped outside the U.S. live/pre-market window so
  `holiday_prediction*.json` is not overwritten with null values.
  JSON refresh workflows must then run
  `scripts/guard_live_json_publish.py` before any Cloud Storage upload. The
  guard must fail the workflow if same-target `live_prediction_series.json`
  would shrink the bucket trend, or if `holiday_prediction.json` violates the
  independent Model2 no-night-futures invariants.
- Independent Model 2 JSON ownership:
  Cloud Run serves and seeds `holiday_prediction.json`,
  `holiday_prediction_series.json`, and `holiday_history.json`, but Cloud Run
  Scheduler refresh must not upload them. They are published only by
  `refresh-holiday-prediction` so the EWY/FX independent model cannot be
  overwritten by minute-level night-futures refresh.
- Model2 diagnostics guard:
  `refresh-holiday-prediction` must load a valid `backtest_diagnostics.json`
  artifact before publishing. If the Cloud Storage copy is missing, the workflow
  falls back to `/api/live/backtest_diagnostics.json`; if that is invalid too,
  the Model2 refresh must fail instead of publishing a degenerate forecast.
  A valid artifact must include EWY/FX correction coefficients and the learned
  `direct_blend_weight`; Model2 should report `directBlendSource:
  diagnostics` after a normal retrain.
- Model2 manual repair:
  the `refresh-holiday-prediction` workflow has a `force=on` dispatch input for
  repairing or reissuing Model2 JSON outside the U.S. live/pre-market window.
  It still uses only EWY, USD/KRW, KRX sync baselines, and diagnostics; it does
  not enable night-futures input. The same workflow also has `clear_stale=on`
  for manually clearing stale Model2 JSON from Cloud Storage when an invalid or
  outdated Model2 artifact should no longer be displayed. Use `clock_sync=on`
  only when Model2 must be manually aligned to the primary live model reference
  clock for the same prediction date. The repair uses primary
  `pointPrediction` once as the baseline anchor when available, falls back to
  `ewyFxSimplePoint` only if needed, records `clockSyncUsed: true`, and keeps
  night-futures input disabled. After a clock-sync baseline exists, `force=on`
  reissues must preserve that baseline unless another explicit `clock_sync=on`
  repair is requested.
- Model2 automatic clock sync:
  scheduled Model2 runs may auto-repair a same-target `kospi_close` baseline
  to the primary payload's `pointPrediction` once when the primary forecast is
  ready. This is only a reference-clock alignment for the active target; it
  must not repeat after a `primary_model_prediction_clock_sync` baseline exists
  for the same KRX session and prediction date, and it must not fall back to
  `ewyFxSimplePoint`.
- Model2 primary snapshot freshness:
  if the workflow-seeded `prediction.json` has a `generatedAt` older than 120
  seconds, Model2 must refetch the public primary JSON before recording
  `clockSyncPrimaryGeneratedAt` or `ewyFxReferencePoint`. These fields are for
  diagnostics and audit; the frontend must not use them to add client-side
  EWY/FX drift to Model2.
- Model2 production invariants:
  normal and forced production Model2 refreshes must publish
  `independentModel: true`, `usesOtherModelPrediction: false`,
  `nightFuturesUsed: false`, and `nightFuturesReadThisRun: false`. The
  historical one-time night-futures bootstrap path is disabled by default and
  exists only for explicit legacy migration tests, not routine operation. If the
  Model2 script exits with a `skip:` result, the workflow must not publish the
  seeded `holiday_prediction*.json` or `holiday_history.json` files again.
  The frontend must only display Model2 when `holiday_prediction.json`
  `predictionDateIso` matches the main `prediction.json` `predictionDateIso`.
  Model2 applies the EWY/FX trend-follow floor from its own EWY/KRW signal and
  raw return, while still keeping `usesOtherModelPrediction: false`. A manual
  or automatic clock-sync baseline must not receive a second residual/intercept
  offset at the sync instant; it tracks later EWY/KRW movement from that synced
  baseline by preserving the one-time absolute spread between
  `clockSyncPoint` and `clockSyncEwyFxReferencePoint`. It must not compound
  that spread as a percentage premium, and the trend-follow floor must be
  skipped after clock-sync tracking.
  A large live gap from Model1 can be valid only when Model1 later moves on a
  materially different bridge basis. The homepage must display the raw
  `holiday_prediction.json` Model2 point and must not add the latest primary
  `ewyFxSimplePoint` drift on top of it.
- Live prediction trend repair:
  if `live_prediction_series.json` is shortened or overwritten, use
  `recover-live-prediction-series` with the target `kst_date` and
  `prediction_date`. It rebuilds the trend from
  `intraday_indicator_series/kst_date=.../prediction_date=.../*.json` and
  refuses to publish if the recovered series is shorter than the current series
  or requested minimum. Cloud Run refresh must skip uploading
  `live_prediction_series.json` when the regenerated same-target series is
  shorter than the current Cloud Storage object, otherwise Scheduler can
  immediately overwrite a recovered trend with a shortened file. A full U.S.
  premarket-through-open trend can span two KST archive partitions, for example
  `17:00~23:59` on the prior KST date and `00:00~08:59` on the current KST
  date; recover both partitions before declaring the trend complete.
- Model2 calculation rule:
  the independent engine must use a hybrid EWY/FX core: the raw EWY+KRW
  fair-value axis remains the main night-futures replacement signal, while
  learned EWY/FX correction coefficients from `backtest_diagnostics.json`
  dampen overreaction. A bounded composite residual adjustment is applied after
  that core. The direct-vs-learned blend must be generated by backtest
  diagnostics and can be raised automatically for large EWY/FX moves or low
  EWY/FX fit confidence; it must not be hand-tuned in the live refresh code.
  Normal Model2 runs must not read or use night-futures values.
- Before publish, regenerated `prediction.json` must also keep same-target
  non-null prediction fields from the bucket seed, and can restore them from the
  latest pre-open `live_prediction_series.json` row when a non-operating-window
  rebuild would otherwise publish `null` values.

## Current Operating Schedule

All times are Asia/Seoul.

- `09:00`
  - prediction target rolls to the next business day;
  - pending state is created outside the operating window.
- `15:30`
  - prediction operating window opens;
  - current KOSPI close becomes `prevClose`;
  - intraday indicator archive snapshots can be written for each refresh;
  - night-futures simple conversion can publish when the target night quote is available;
  - EWY + FX conversion and live model prediction stay blank until the U.S. premarket bridge is ready.
- `15:45`
  - KOSPI 200 day futures close can be final if the eSignal socket close timestamp is at or after this time.
- U.S. premarket open through `09:00`
  - live prediction trend chart records minute-level observations;
  - intraday indicator archive snapshots are persisted under
    `intraday_indicator_series/` for later research use;
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
- `scripts/refresh_holiday_prediction.py`
- `scripts/backtest_and_generate.py`
- `cloudrun/live_data_service.py`
- `docs/INTRADAY_INDICATOR_SERIES_WORK_SPEC_2026-05-23.md`
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
- Publish-quality YouTube news items must have `summary_provider: "gemini"`.
- Items with `summary_provider: "transcript_extract"` are fallback transcript summaries and should be removed from root `news/**/digest_db.json` before publishing.
- After removing fallback items, update each report `count` to match the remaining `items.length`, then run `publish_youtube_news.cmd`.
- Routine quality cleanup and republish must use `publish_youtube_news.cmd` / `publish-youtube-news` only; do not run Cloud Build, Cloud Run deploy, or Firebase Hosting deploy.
- Raw daily report cards remain available as archive references and open in a new tab.
- Dynamic news API fallback files are local deploy artifacts and should not be committed:
  - `frontend/public/data/youtube-news.json`
- The root `news/` directory is the durable source content and should be preserved.
- Latest YouTube news quality cleanup verification:
  - verified on `2026-05-04 KST`;
  - removed `48` fallback transcript-summary items;
  - source inventory after cleanup: `59` items, `0` non-Gemini items;
  - production API: `200`, source `bucket`, `43` latest items, `19` reports, `0` fallback-summary matches.
- Daily operator helper:
  - `powershell -ExecutionPolicy Bypass -File .\scripts\update_youtube_news_content.ps1 -Date 2026-04-23 -UploadDynamic`
  - optional first-time release or route changes only: add `-Build -Deploy`
  - If `-SourceRoot` is omitted, the script auto-detects `C:\Users\dw\Desktop\AntiGravity\*\results` containing the requested date.

## Important Docs

- Architecture: `docs/ARCHITECTURE.md`
- Live refresh: `docs/CLOUD_RUN_LIVE_REFRESH.md`
- Algorithm: `docs/ALGORITHM.md`
- Data sources: `docs/DATA_SOURCES.md`
- Intraday indicator series: `docs/INTRADAY_INDICATOR_SERIES_WORK_SPEC_2026-05-23.md`
- Home top ad banner: `docs/HOME_TOP_AD_BANNER_WORK_SPEC_2026-06-07.md`
- Model2 EWY/FX clock sync: `docs/MODEL2_CLOCK_SYNC_WORK_SPEC_2026-06-09.md`
- Model spec: `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
- Security / runbook: `docs/SECURITY_OPERATIONS_RUNBOOK.md`
- Firebase / Cloudflare / GA4 / AdSense guide: `docs/FIREBASE_CLOUDFLARE_GA4_ADSENSE_2026.md`

## Latest Frontend Deployment Verification

Last verified on 2026-06-07 KST:

- Change: homepage top three-column ad banner.
- Placement: immediately below `SiteHeader` and above the homepage forecast hero.
- Left slot: Coupang Partners carousel widget, `id=995011`, `trackingCode=AF1258921`, `320x140`.
- Center/right slots: `광고문의 ytbtheguy@gmail.com`.
- Commit: `1a839cb7 Add home top ad banner`.
- Workflow: GitHub Actions `deploy-hosting`.
- Run: `https://github.com/sbrpgr/kospipreview/actions/runs/27069768423`.
- Result: success.
- Production check:
  - `https://kospipreview.com/` returned `200 OK`;
  - rendered HTML included `homeTopAdBanner`, `쿠팡 파트너스 광고`, `광고문의`, and `ytbtheguy@gmail.com`;
  - live prediction trend API still returned `899` records matching `predictionDateIso=2026-06-08`.
- Cost guardrail: Cloud Run and Cloud Build were not used.

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
- Deploy cost guardrail:
  - Frontend, calculator, copy, and static page changes use `deploy-hosting` only.
  - Routine news publish uses `publish_youtube_news.cmd` / `publish-youtube-news` only.
  - Routine model/data refresh uses JSON upload to Cloud Storage only.
  - `cloudrun-deploy` is reserved for Cloud Run code, Cloud Run env vars, Firebase rewrite pinning, or Scheduler changes.
  - `deploy-production` is deprecated and requires `RUN_DEPRECATED_DEPLOY`; prefer `cloudrun-deploy`.
  - Do not run Cloud Build or Cloud Run deploy for routine frontend, calculator, copy, news, or JSON-only changes.
  - Firebase Hosting deploy workflows may treat "current active version" as an already-deployed state; verify production URLs when this warning appears.
  - Use `cleanup-artifact-images` for old container image cleanup; it runs scheduled dry-runs by default. Use `dry_run=false` only after Artifact Registry delete IAM is confirmed.
  - Do not add Cloud Storage lifecycle deletion for research/news prefixes until prefix-level size and retention value are reviewed.

## Operating Principles

- Keep secrets out of git, chat, and issues.
- Treat Cloud Run live refresh as the primary freshness path.
- Treat `retrain-model` as the primary model JSON rebuild and Cloud Storage publish path.
- Use fallback workflow only when Cloud Run live refresh is degraded.
- Never rely on local-only hosting deploys for persistent UI changes; push to `main` before final verification.
- Keep docs updated whenever time gates, model inputs, settlement rules, IAM, deploy flow, or content archive flow changes.
