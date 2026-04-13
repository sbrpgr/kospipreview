# Architecture

Baseline date: 2026-04-14

## Current Production Shape

The platform uses a split architecture.

1. Static frontend delivery
   - Next.js App Router project exported to static files.
   - Hosted on Firebase Hosting.
   - Firebase Hosting serves static pages and rewrites live API requests to Cloud Run.

2. Live JSON refresh
   - Cloud Run service: `kospi-live-data`
   - Cloud Scheduler job: `kospi-live-refresh`
   - Cloud Storage bucket: `kospipreview-live-data`
   - Scheduler cadence: every minute on weekdays.

3. Full model rebuild and static publish
   - GitHub Actions workflow: `retrain-model`
   - Rebuilds model artifacts and static fallback JSON.
   - Deploys Firebase Hosting.

4. Production deploy
   - GitHub Actions workflow: `deploy-production`
   - Deploys Cloud Run and Firebase Hosting.
   - Firebase Hosting rewrites are pinned to the latest Cloud Run revision by tag.

5. Fallback refresh path
   - GitHub Actions workflow: `refresh-night-futures`
   - Manual fallback only.
   - Not the primary production freshness path.

## Domains

- `kospipreview.com`
  - Cloudflare proxied root A record.
  - Primary public host.
- `www.kospipreview.com`
  - Cloudflare proxied CNAME to Firebase Hosting.
  - CNAME to `kospipreview.web.app`.

Both hosts should return live API data from the Cloud Run bucket-backed path.

## Request Flow

### Static flow

1. Browser requests an HTML page or static asset.
2. Firebase Hosting serves `frontend/out`.
3. `/_next/static/**` assets can be immutable cached.
4. HTML, text, and `/data/**` fallback JSON are served with strict no-cache headers.

### Live flow

1. Cloud Scheduler calls `POST /api/tasks/refresh` on Cloud Run.
2. Cloud Run seeds a temporary workspace from Cloud Storage live JSON, then repo-bundled fallback JSON when needed.
3. `scripts/refresh_night_futures.py` refreshes indicators, prediction, history, archive, caches, and live trend data.
4. Cloud Run uploads refreshed JSON back to Cloud Storage.
5. Public live JSON reads use a short Cloud Run instance-local cache to absorb bursts without changing client no-store semantics.
6. Browser requests `/api/live/*.json`.
7. Firebase Hosting rewrites the request to the pinned Cloud Run revision.
8. Cloud Run reads the JSON object from Cloud Storage and returns it with `Cache-Control: no-store`.

The refresh task endpoint is token protected and fails closed if
`REFRESH_BEARER_TOKEN` is missing. Unauthenticated refresh is only allowed when
`ALLOW_UNAUTHENTICATED_REFRESH=true` is explicitly set for a local/dev service.

The refresh worker reuses Yahoo display snapshots inside a single run and
parallelizes independent Yahoo fetches with `YAHOO_FETCH_WORKERS` defaulting to
`6`. This is an operational throughput control only. It must not alter model
math, conversion formulas, settlement rules, or the night-futures exclusion
rule.

## Live JSON Files

Served through `/api/live/**`:

- `prediction.json`
- `indicators.json`
- `history.json`
- `live_prediction_series.json`
- `backtest_diagnostics.json`

Synced by the refresh worker:

- all served files above
- `day_futures_close_cache.json`
- `night_futures_source_cache.json`
- `prediction_archive.json`

## Operating Schedule

All times are Asia/Seoul.

- `09:00`
  - prediction target rolls to the next business day;
  - prediction fields enter pending state outside operation window.
- `15:30`
  - live prediction operation begins;
  - KOSPI close is used as `prevClose`;
  - the model can publish without night futures.
- `15:45`
  - same-day KOSPI 200 day futures close can be accepted as final only when the eSignal socket close timestamp is at or after this time.
- `18:00~09:00`
  - live prediction trend chart records one row per minute.

## Model And Data Rules

- Current engine: `EWY Synthetic K200 Ridge`.
- Model input basis: KRX close sync basis at `15:30 KST`.
- Indicator display basis: market-standard displayed change.
- Night futures: comparison and validation only.
- `model.nightFuturesExcluded` must stay `true` for the current production model.
- Night futures simple conversion uses:
  - current completed KOSPI close;
  - final KOSPI 200 day futures close;
  - live KOSPI 200 night futures quote.

## Live Prediction Trend Layer

`live_prediction_series.json` is the minute-level trace for the active prediction target.

Rules:

- written by `scripts/refresh_night_futures.py`;
- read by `frontend/src/components/prediction-trend-chart.tsx`;
- one observation per minute-level `observedAt`;
- duplicate minute rows are replaced;
- only the active `predictionDateIso` is retained;
- max retained rows: `1080`;
- rows are appended only during `18:00~09:00 KST`.

Fields:

- `predictionDateIso`
- `observedAt`
- `kstTime`
- `pointPrediction`
- `nightFuturesSimplePoint`
- `ewyFxSimplePoint`
- `nightFuturesClose`
- `predictedChangePct`
- `nightFuturesSimpleChangePct`
- `ewyFxSimpleChangePct`

## Recent Actual Record Layer

`history.json` tracks verification rows.

For each actual trading date, the row should include:

- fixed pre-open model prediction;
- fixed pre-open night futures simple conversion;
- fixed pre-open EWY + FX simple conversion;
- actual KOSPI open;
- actual KOSPI close when available;
- KOSPI 200 day futures close;
- KOSPI 200 night futures close.

## Operationally Important Files

- `firebase.json`
- `.github/workflows/deploy-production.yml`
- `.github/workflows/retrain-model.yml`
- `.github/workflows/refresh-night-futures.yml`
- `cloudrun/live_data_service.py`
- `scripts/backtest_and_generate.py`
- `scripts/refresh_night_futures.py`
- `frontend/src/components/live-dashboard.tsx`
- `frontend/src/components/prediction-trend-chart.tsx`
- `frontend/src/components/accuracy-table.tsx`

## Current Truth Source

If a future session needs to resume work quickly, read in this order:

1. `docs/OPERATIONS_INDEX.md`
2. `docs/ARCHITECTURE.md`
3. `docs/CLOUD_RUN_LIVE_REFRESH.md`
4. `docs/ALGORITHM.md`
5. `docs/DATA_SOURCES.md`
6. `docs/MODEL_EWY_SYNTHETIC_K200_2026-04-10.md`
7. `docs/SECURITY_OPERATIONS_RUNBOOK.md`
