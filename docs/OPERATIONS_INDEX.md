# Operations Spec Index

## Read This First

If work resumes in a later chat or from another machine, start here and then open the following documents in order:

1. `docs/OPERATIONS_INDEX.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CLOUD_RUN_LIVE_REFRESH.md`
4. `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
5. `docs/SECURITY_OPERATIONS_RUNBOOK.md`
6. `docs/CHANGELOG.md`

## Current Production Summary (2026-04-11)

- Primary domain: `https://kospipreview.com`
- Edge / protection: Cloudflare
- Static frontend hosting: Firebase Hosting
- Live refresh path: Cloud Run + Cloud Scheduler + Cloud Storage
- Full rebuild path: GitHub Actions `retrain-model`
- Fallback-only refresh workflow: GitHub Actions `refresh-night-futures`
- Current prediction engine: `EWY Synthetic K200 Ridge`
- Current live rewrite:
  - `/api/live/** -> Cloud Run service kospi-live-data (asia-northeast3)`
- Current live chart data:
  - `/api/live/live_prediction_series.json`
  - Stores minute-level snapshots for the active prediction date
  - Used by the homepage `예측 추이` chart to compare model prediction vs night-futures simple conversion

## Current Model Rules

- Internal prediction correction keeps the `KRX 15:30 KST` sync basis
- Indicator card display uses standard market display basis
- Internal prediction correction must not leak into displayed card change values
- Night futures are excluded from the current model path
- Night futures remain comparison / validation data only

Related code:

- `scripts/backtest_and_generate.py`
- `scripts/refresh_night_futures.py`
- `cloudrun/live_data_service.py`
- `frontend/src/lib/data.ts`
- `frontend/src/components/prediction-trend-chart.tsx`

## Current Operations Docs

- Architecture: `docs/ARCHITECTURE.md`
- Live refresh: `docs/CLOUD_RUN_LIVE_REFRESH.md`
- Security / runbook: `docs/SECURITY_OPERATIONS_RUNBOOK.md`
- Data sources: `docs/DATA_SOURCES.md`
- Model spec: `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
- Changelog: `docs/CHANGELOG.md`
- Firebase / Cloudflare / GA4 / AdSense guide: `docs/FIREBASE_CLOUDFLARE_GA4_ADSENSE_2026.md`

## Recent Important Incident

- GitHub Actions runs `24246079902` and `24248400402` failed at `Deploy to Firebase Hosting`
- Root cause:
  - Cloud Run rewrite with `pinTag: true`
  - missing IAM roles on the Firebase deploy service account
- Fix:
  - add `roles/firebasehosting.admin`
  - add `roles/run.developer`
- Verification:
  - next scheduled run `24250747384` succeeded

## Latest Feature Handoff

- Added live prediction trend chart on the homepage
- Data file:
  - `live_prediction_series.json`
- Live endpoint:
  - `/api/live/live_prediction_series.json`
- Update behavior:
  - every Cloud Scheduler refresh appends / replaces one minute-level observation
  - duplicate `observedAt` minute values are collapsed
  - only the active `predictionDateIso` series is retained
  - max retained points: `1080`
- Chart lines:
  - `모델 예측`
  - `야간선물 단순환산`
- Deployment note:
  - Cloud Run must be redeployed when `cloudrun/live_data_service.py` serving list changes
  - Firebase Hosting must be redeployed after Cloud Run so `pinTag: true` pins the latest revision

## Operating Principles

- Keep secrets out of git, chat, and issues
- Treat Cloud Run live refresh as the primary freshness path
- Treat `retrain-model` as the primary full rebuild and static publish path
- Use the fallback workflow only when Cloud Run live refresh is degraded
- Update docs whenever architecture, IAM, or deploy flow changes
