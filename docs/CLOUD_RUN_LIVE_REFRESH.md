# Cloud Run Live Refresh

Baseline date: 2026-05-02

## Purpose

Cloud Run is the primary near-live JSON refresh path.

Goals:

- keep Firebase Hosting as the static frontend;
- refresh live data during the active off-hours window without redeploying Hosting;
- avoid a database for current product scale;
- keep live JSON recoverable through Cloud Storage objects and bundled fallbacks.

## Deployed Resources

- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Storage bucket: `kospipreview-live-data`
- Cloud Run refresh throttle: `REFRESH_MIN_INTERVAL_SECONDS=120`
- Cross-revision lease: `_locks/live-refresh.json`, generation precondition, `420s` TTL
- Runtime scale: minimum `0`, maximum `1`, concurrency `40`
- Firebase Hosting rewrite:
  - `/api/**`
  - service `kospi-live-data`
  - region `asia-northeast3`
  - pinned tag created during Firebase deploy

## Runtime Flow

1. Cloud Scheduler calls `POST /api/tasks/refresh`.
2. Cloud Run validates the bearer token.
3. Cloud Run acquires both the process lock and a generation-guarded Cloud
   Storage lease. An overlap returns `202 already_running`.
4. Cloud Run creates a temporary workspace and seeds JSON from Cloud Storage,
   falling back to repo-bundled JSON.
5. `scripts/refresh_night_futures.py` runs and the primary publish guard checks
   trend continuity.
6. Primary component JSON is uploaded, then `dashboard.json` is uploaded last.
7. During the U.S. active window, Cloud Run runs the unchanged independent
   Model2 calculator only when its target rolled or its last payload is at least
   five minutes old.
8. Model2 prediction, series, history, no-night-futures invariants, and a
   same-target `2.5%` clock-synced step limit are checked before upload.
9. Model2 component JSON is uploaded, then `holiday-dashboard.json` is uploaded
   last. A Model2 failure leaves the prior complete Model2 snapshot public and
   does not roll back a valid primary refresh.
10. Public dashboard reads prefer the atomic snapshots. Per-file reads remain
    available for compatibility and recovery.

Model2 keeps `nightFuturesUsed` and `nightFuturesReadThisRun` false. The legacy
night-futures bootstrap remains disabled by default. The normal Cloud Run lane
does not force a Model2 run outside the U.S. active window and does not copy the
primary forecast continuously; it only preserves the existing one-time clock
alignment rules. `refresh-holiday-prediction` is retained without a schedule
for explicit `force`, `clock_sync`, or `clear_stale` repairs. The frontend still
requires Model2 and primary `predictionDateIso` to match before displaying the
current value.

## Refresh Cadence And Performance

Cloud Scheduler attempts one refresh every two minutes outside the KST `09:00~16:59` quiet window.

Current Scheduler settings:

- cron: `*/2 0-8,17-23 * * 1-5`
- time zone: `Asia/Seoul`
- Cloud Run also enforces `REFRESH_MIN_INTERVAL_SECONDS=120`, so an older every-minute Scheduler configuration still skips the non-window minute with `202 {"ok": true, "status": "throttled"}`.
- If only Scheduler settings need to be applied after IAM is granted, dispatch `cloudrun-deploy` with `deploy_service=false` and `update_scheduler=true`; this skips Cloud Build, Cloud Run deploy, and Firebase Hosting deploy.

Operational target:

- a normal refresh run should finish well under `60s`;
- non-window refresh attempts should return `202 throttled` without running the expensive refresh script;
- if a refresh run exceeds roughly two minutes, the next Scheduler attempt can overlap with the active run;
- overlapping attempts are protected by the refresh lock and return `202 already_running`;
- the Cloud Storage lease protects overlap between old/new revisions as well as within one process;
- repeated over-two-minute runs make the effective dashboard cadence look closer to four minutes.

Current implementation:

- `scripts/refresh_night_futures.py` shares a per-run `market_snapshot_cache` for Yahoo display snapshots;
- independent Yahoo quote/display fetches are parallelized with `YAHOO_FETCH_WORKERS` defaulting to `6`;
- these changes affect collection throughput only and do not change model math, conversion formulas, or the no-night-futures model rule.

Latest verified production state after the refresh performance fix:

- commit: `81ee130`;
- Cloud Run revision: `kospi-live-data-00026-nf2`;
- observed Cloud Run refresh POST latency: `12.1s` to `14.9s`;
- verified date: `2026-04-14 KST`.

## Served Live Files

- `/api/live/prediction.json`
- `/api/live/indicators.json`
- `/api/live/history.json`
- `/api/live/live_prediction_series.json`
- `/api/live/backtest_diagnostics.json`
- `/api/live/holiday_prediction.json`
- `/api/live/holiday_prediction_series.json`
- `/api/live/holiday_history.json`
- `/api/live/dashboard.json`
- `/api/live/holiday-dashboard.json`

All should respond with:

- `Cache-Control: public, max-age=45, s-maxage=60, stale-while-revalidate=120`
- `X-Kospi-Live-Source: bucket-snapshot` when an atomic Cloud Storage snapshot is used
- `X-Kospi-Live-Source: bucket`, `bundled`, or `mixed` only on the legacy assembly fallback

Operational health is exposed at `/api/healthz`. It reports snapshot IDs,
source lane, target alignment, Model2 independence flags, and freshness without
returning credentials. `/api/livez` is the lightweight public liveness check.
The unprefixed `/healthz` path is not used because the Cloud Run public edge can
return its own 404 before the request reaches Flask.

## Legacy And Fallback Retention

The bundled endpoints `/api/live/dashboard.json` and
`/api/live/holiday-dashboard.json` are the preferred low-call production read
paths, but the older per-file live JSON endpoints remain part of the supported
surface. They are intentionally retained because the 2026-06-27 changes were
made to reduce high Cloud Run operating cost, not to remove rollback or recovery
options.

Do not remove legacy per-file endpoints, bundled JSON fallbacks, or the manual
`refresh-night-futures` fallback workflow without a separate work spec, a
production observation window, and an explicit rollback plan.

## Served News Files (Separated From Live Prediction)

- `/api/news/youtube-news.json`
- `/api/news/reports/**`

These routes are read-only and must not participate in:

- Scheduler refresh execution;
- model recalculation;
- live prediction JSON writes.

## Synced State Files

The refresh worker also syncs internal state files:

- `prediction_archive.json`
- `day_futures_close_cache.json`
- `night_futures_source_cache.json`

These files are needed for rollover, settlement, fallback, and actual-record continuity.

The primary Cloud Run upload set excludes the independent Model2 files:

- `holiday_prediction.json`
- `holiday_prediction_series.json`
- `holiday_history.json`

Those files are published only by Cloud Run's separate Model2 lane or the
manual `refresh-holiday-prediction` repair workflow. They can never enter the
primary upload loop.

Cloud Run refresh must also protect `live_prediction_series.json` continuity.
Before upload, it compares the regenerated file with the current Cloud Storage
object. If both files target the same `predictionDateIso` and the regenerated
series has fewer valid records, the primary guard rejects the refresh before a
new atomic dashboard snapshot can replace the last complete public snapshot.

## Operating Rules

All times are Asia/Seoul.

### 09:00 target rollover

At or after `09:00 KST`, the prediction target rolls to the next business day.

Expected behavior:

- `predictionDateIso` becomes the next business day;
- active prediction fields are cleared when outside the operation window;
- pending state remains until `15:30 KST`.

### 15:30 prediction operation

At `15:30 KST`, the prediction window opens.

Expected behavior:

- KOSPI actual close becomes `prevClose`;
- `prevCloseDate` and `latestRecordDate` become the current completed KOSPI session date;
- night-futures simple conversion can publish when the target night quote is available;
- EWY + FX conversion and live model prediction stay blank until the U.S. premarket bridge is ready;
- model input basis is the KRX `15:30 KST` sync baseline plus the one-time bridge to the EWY premarket basis.

### 15:45 day futures settlement

Same-day KOSPI 200 day futures close is final only after settlement.

Expected behavior:

- a `15:30` socket close is treated as provisional;
- eSignal socket close at or after `15:45 KST` is final;
- only final same-day socket settlement should be trusted as the final cached day futures close;
- provisional same-day values must be refetched after settlement.

### U.S. premarket through 09:00 trend series

`live_prediction_series.json` is updated only from U.S. premarket open through `09:00 KST`.
This is `17:00 KST` during U.S. daylight time and `18:00 KST` during U.S. standard time.
Because that window crosses midnight, a single prediction target can have
archive snapshots under two KST partitions: the prior evening partition and the
current pre-open partition.

Expected behavior:

- the bridge samples KOSPI 200 night-futures movement every 2 minutes for 5 slots;
- one row per minute-level `observedAt`;
- records keep only the active `predictionDateIso`;
- chart compares `pointPrediction`, `nightFuturesSimplePoint`, and `ewyFxSimplePoint`.
- a shorter same-target `live_prediction_series.json` must never replace a
  longer Cloud Storage copy; repair shortened trends with
  `recover-live-prediction-series` and then verify the next Scheduler refresh
  keeps the recovered record count.
- a full daylight-time session is about `960` minute records from `17:00` to
  `08:59 KST`, so recovery tools must not cap the series below that range.

### Night futures session close carry-forward

The KOSPI 200 night futures simple conversion is tied to the prediction
operating date, not only to whether the night market is still live at the exact
refresh moment.

Expected behavior:

- when a quote was observed during the target night session, keep using that
  last observed value through `09:00 KST`;
- do not clear `nightFuturesSimplePoint`, `nightFuturesSimpleChangePct`, or
  `nightFuturesClose` only because the night futures session has closed;
- do not reuse a previous night-session quote for the next prediction target
  during the `15:30~18:00 KST` gap before the new night session starts.

## Recent Actual Record Updates

`history.json` is updated during refresh once actual data is available.

The current actual trading day row should track:

- `actualOpen`
- `actualClose`
- `dayFuturesClose`
- `dayFuturesClose`, only after final eSignal socket settlement for that same actual date;
- `nightFuturesClose`, fixed from the target date's pre-open night session, not from the following night session;
- fixed pre-open `modelPrediction`
- fixed pre-open `nightFuturesSimpleOpen`
- fixed pre-open `ewyFxSimpleOpen`

For example, the `2026-04-14` actual row must use the night-futures close from
the night session that ended before the `2026-04-14 09:00 KST` open. Once the
`2026-04-15` night session starts at `2026-04-14 18:00 KST`, those live values
must not overwrite the `2026-04-14` actual row.

Day/night futures close fields are tracked only for actual rows dated
`2026-04-14` or later. The `2026-04-13` actual row must keep both fields blank.

## Role Split

### Cloud Run + Cloud Scheduler

Responsible for:

- live indicators;
- live prediction recalculation;
- recent actual record updates;
- day/night futures cache updates;
- live trend series updates;
- routine independent Model2 refresh at the guarded five-minute minimum interval;
- atomic primary and Model2 snapshot publication.

### `retrain-model`

Responsible for:

- full model rebuild;
- diagnostics;
- static fallback JSON;
- Cloud Storage JSON publish.

It must not deploy Firebase Hosting during routine scheduled runs. Before
publishing JSON, it must run `scripts/guard_live_json_publish.py` so a rebuild
cannot shrink the current live trend. Its explicit primary allowlist must not
contain any Model2 artifact.

### `refresh-night-futures`

Manual fallback JSON refresh only.

Use it only when Cloud Run live refresh is degraded.
It uses the same pre-publish JSON guard as `retrain-model`.

## Recovery Checklist

When live values look stale:

1. check `/api/healthz` status, sources, snapshot IDs, and target alignment;
2. check `/api/live/dashboard.json` and `/api/live/holiday-dashboard.json` source headers;
3. check `/api/live/prediction.json` `generatedAt` and the live series latest `observedAt`;
4. check Cloud Scheduler last attempt;
5. check Cloud Run latest ready revision and logs;
6. check Cloud Storage component, snapshot, and `_locks/live-refresh.json` timestamps;
7. check source market data freshness by symbol.
