# Operations Spec Index

Baseline date: 2026-04-13

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
- Current prediction engine: `EWY Synthetic K200 Ridge`
- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Storage bucket: `kospipreview-live-data`

## Current Operating Schedule

All times are Asia/Seoul.

- `09:00`
  - prediction target rolls to the next business day;
  - pending state is created outside the operating window.
- `15:30`
  - prediction operating window opens;
  - current KOSPI close becomes `prevClose`;
  - model prediction can publish without night futures.
- `15:45`
  - KOSPI 200 day futures close can be final if the eSignal socket close timestamp is at or after this time.
- `18:00~09:00`
  - live prediction trend chart records minute-level observations.

## Current Model Rules

- Model input basis: KRX `15:30 KST` sync basis.
- Indicator card display basis: standard market displayed change.
- Yahoo EWY premarket displayed change versus prior U.S. close must not be used ahead of the KRX-sync EWY return.
- Night futures are excluded from the model path.
- Night futures remain comparison and validation data only.
- `model.nightFuturesExcluded` should be `true`.

## Settlement And Actual Record Rules

- KOSPI actual close is read after `15:30 KST` from Naver or chart fallback.
- KOSPI 200 day futures final close is accepted after `15:45 KST` socket settlement.
- KOSPI 200 night futures simple conversion uses:
  - current KOSPI close;
  - final day futures close;
  - live night futures close.
- EWY + FX simple conversion uses:
  - current KOSPI close;
  - KRX-close-synchronized EWY return;
  - KRX-close-synchronized USD/KRW return.
- `history.json` recent actual rows track:
  - `actualOpen`
  - `actualClose`
  - `dayFuturesClose`
  - `nightFuturesClose`
  - fixed pre-open `modelPrediction`
  - fixed pre-open `nightFuturesSimpleOpen`
  - fixed pre-open `ewyFxSimpleOpen`
- `dayFuturesClose` and `nightFuturesClose` in `history.json` start from rows dated
  `2026-04-14`; the `2026-04-13` row is intentionally blank for both fields.

## Important Code

- `scripts/refresh_night_futures.py`
- `scripts/backtest_and_generate.py`
- `cloudrun/live_data_service.py`
- `frontend/src/lib/data.ts`
- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/components/accuracy-table.tsx`
- `frontend/src/components/prediction-trend-chart.tsx`

## Important Docs

- Architecture: `docs/ARCHITECTURE.md`
- Live refresh: `docs/CLOUD_RUN_LIVE_REFRESH.md`
- Algorithm: `docs/ALGORITHM.md`
- Data sources: `docs/DATA_SOURCES.md`
- Model spec: `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
- Security / runbook: `docs/SECURITY_OPERATIONS_RUNBOOK.md`
- Firebase / Cloudflare / GA4 / AdSense guide: `docs/FIREBASE_CLOUDFLARE_GA4_ADSENSE_2026.md`

## Latest Verified Production State

Last verified on 2026-04-13:

- GitHub deploy workflow: `deploy-production` succeeded for commit `524ec64`.
- Cloud Run latest ready revision: `kospi-live-data-00019-tg2`.
- Cloud Run traffic: 100% to latest revision.
- Scheduler: enabled, weekday every minute.
- `/api/live/prediction.json`: served from bucket with no-store cache headers.
- Root host: Cloudflare dynamic, no cache for live API.
- `www` host: Cloudflare dynamic, no cache for live API.

## Operating Principles

- Keep secrets out of git, chat, and issues.
- Treat Cloud Run live refresh as the primary freshness path.
- Treat `retrain-model` as the primary full rebuild and static publish path.
- Use fallback workflow only when Cloud Run live refresh is degraded.
- Keep docs updated whenever time gates, model inputs, settlement rules, IAM, or deploy flow changes.
