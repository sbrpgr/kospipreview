# Architecture

## Current Production Shape (2026-04-11)

The platform now runs as a split architecture:

1. Static frontend delivery
   - Next.js App Router project exported to static files
   - Hosted on Firebase Hosting
   - Fronted by Cloudflare on `kospipreview.com`

2. Fast live-data refresh
   - Cloud Run service: `kospi-live-data`
   - Cloud Scheduler job: `kospi-live-refresh`
   - Cloud Storage bucket: `kospipreview-live-data`
   - Purpose: refresh live JSON every minute without redeploying Hosting

3. Heavier model rebuild and static publish
   - GitHub Actions workflow: `retrain-model`
   - Rebuilds model artifacts and static pages
   - Syncs `frontend/public/data/*.json` into `frontend/out/data`
   - Deploys Firebase Hosting

4. Fallback refresh path
   - GitHub Actions workflow: `refresh-night-futures`
   - Kept as manual fallback only
   - No longer the primary live refresh path

## Why The Platform Is Structured This Way

The service intentionally avoids a database-first design.

- No Firestore / SQL dependency in the main read path
- Latest state is stored as JSON artifacts
- Static pages stay cheap and easy to cache
- Live values can still refresh quickly through Cloud Run
- Operational burden stays low because there is no always-on custom backend state store to manage

This is a deliberate tradeoff:

- simpler operations
- cheaper infra
- easier rollback
- fewer moving parts

instead of:

- complex DB schema management
- migration overhead
- extra query billing
- more failure points

## Request Flow

### A. Static page and static data flow

1. Source code lives in GitHub.
2. `retrain-model` runs on weekdays every 5 minutes or by manual dispatch.
3. `scripts/backtest_and_generate.py` rebuilds prediction artifacts.
4. Next.js static export is reused from cache when possible.
5. Firebase Hosting deploy publishes the latest static site.

### B. Live data flow

1. Cloud Scheduler triggers Cloud Run every minute.
2. Cloud Run seeds a local temp workspace from:
   - Cloud Storage live JSON
   - bundled default JSON from the repo when needed
3. `scripts/refresh_night_futures.py` recomputes live indicator and prediction payloads.
4. Updated JSON is written back to Cloud Storage.
5. Browser requests `/api/live/*.json` through Firebase Hosting rewrite to Cloud Run.
6. If live API is unavailable, the app can still fall back to `/data/*.json`.

## Frontend Runtime Rules

- Main dashboard prefers live endpoints for:
  - `prediction.json`
  - `indicators.json`
  - `history.json`
- Static files remain as the cold-start / fallback baseline
- Cache headers are intentionally strict for HTML and `/data/**`
- Immutable caching is only used for `/_next/static/**`

## Current Model / Data Layers

- Core prediction engine:
  - `EWY Synthetic K200 Ridge`
- Displayed market cards:
  - standard market change display
  - not the internal KRX sync correction basis
- Internal prediction correction:
  - KRX close sync baseline (`15:30 KST`)
  - used only inside prediction math
- Night futures:
  - comparison / validation reference only
  - excluded from the current model prediction path

## Key Infrastructure Settings

- Firebase Hosting rewrite:
  - `/api/live/** -> Cloud Run (asia-northeast3)`
  - `pinTag: true`
- Cloudflare:
  - domain proxied
  - WAF / bot protection in front
- Firebase Hosting:
  - security headers enabled
  - `ads.txt` served directly

## Operationally Important Files

- `firebase.json`
- `.github/workflows/retrain-model.yml`
- `.github/workflows/refresh-night-futures.yml`
- `scripts/backtest_and_generate.py`
- `scripts/refresh_night_futures.py`
- `cloudrun/live_data_service.py`
- `docs/CLOUD_RUN_LIVE_REFRESH.md`
- `docs/SECURITY_OPERATIONS_RUNBOOK.md`

## Known Operational Boundaries

- Cloud Scheduler minimum cadence is 1 minute
- Browser can poll faster, but server-side source refresh remains 1 minute
- Static pages such as history diagnostics still depend on `retrain-model` deploy cycles
- Public market data source freshness can vary by symbol even when our refresh path is healthy

## Current Truth Source

If a future session needs to resume work quickly, read in this order:

1. `docs/OPERATIONS_INDEX.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CLOUD_RUN_LIVE_REFRESH.md`
4. `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
5. `docs/SECURITY_OPERATIONS_RUNBOOK.md`
