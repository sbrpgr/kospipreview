# Cloud Run Live Refresh

Baseline date: 2026-05-02

## Purpose

Cloud Run is the primary minute-level live JSON refresh path.

Goals:

- keep Firebase Hosting as the static frontend;
- refresh live data during the active off-hours window without redeploying Hosting;
- avoid a database for current product scale;
- keep live JSON recoverable through Cloud Storage objects and bundled fallbacks.

## Deployed Resources

- Cloud Run service: `kospi-live-data`
- Cloud Scheduler job: `kospi-live-refresh`
- Cloud Storage bucket: `kospipreview-live-data`
- Firebase Hosting rewrite:
  - `/api/**`
  - service `kospi-live-data`
  - region `asia-northeast3`
  - pinned tag created during Firebase deploy

## Runtime Flow

1. Cloud Scheduler calls `POST /api/tasks/refresh`.
2. Cloud Run validates the bearer token.
3. Cloud Run creates a temporary workspace.
4. Cloud Run seeds JSON files from Cloud Storage, falling back to repo-bundled JSON.
5. `scripts/refresh_night_futures.py` runs.
6. Refreshed JSON is uploaded back to Cloud Storage.
7. Public reads use `/api/live/*.json`.

Independent Model 2 files are a separate JSON ownership lane. Cloud Run may
serve and seed `holiday_prediction.json`, `holiday_prediction_series.json`, and
`holiday_history.json`, but the Scheduler refresh must not upload those files.
They are produced by the `refresh-holiday-prediction` workflow so minute-level
night-futures refreshes cannot overwrite the independent EWY/FX model output.
Model 2 production refreshes must keep `nightFuturesUsed` and
`nightFuturesReadThisRun` false; the legacy night-futures bootstrap path is
disabled by default and is not part of routine operation. When the Model 2
script exits with `skip:`, the workflow must not re-publish the seeded
`holiday_prediction*.json` or `holiday_history.json` files. Use the
workflow's `clear_stale=on` dispatch input to clear stale Model 2 JSON from
Cloud Storage without deploying Cloud Run. The frontend must only display
Model 2 when `holiday_prediction.json` `predictionDateIso` matches the main
`prediction.json` `predictionDateIso`.

## Refresh Cadence And Performance

Cloud Scheduler attempts one refresh per weekday minute outside the KST `09:00~16:59` quiet window.

Current Scheduler settings:

- cron: `* 0-8,17-23 * * 1-5`
- time zone: `Asia/Seoul`

Operational target:

- a normal refresh run should finish well under `60s`;
- if a refresh run exceeds roughly one minute, the next Scheduler attempt can overlap with the active run;
- overlapping attempts are protected by the refresh lock and return `202 already_running`;
- repeated over-one-minute runs make the effective dashboard cadence look closer to two minutes.

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

All should respond with:

- `Cache-Control: no-store, no-cache, must-revalidate, max-age=0`
- `X-Kospi-Live-Source: bucket` when Cloud Storage is being used

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

Cloud Run refresh upload excludes the independent Model 2 files:

- `holiday_prediction.json`
- `holiday_prediction_series.json`
- `holiday_history.json`

Those files are seeded for continuity and served through `/api/live/**`, but
only `refresh-holiday-prediction` should publish them.

Cloud Run refresh must also protect `live_prediction_series.json` continuity.
Before upload, it compares the regenerated file with the current Cloud Storage
object. If both files target the same `predictionDateIso` and the regenerated
series has fewer valid records, the upload is skipped so a transient no-seed
or shortened local run cannot overwrite the longer public trend.

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
- live trend series updates.

### `retrain-model`

Responsible for:

- full model rebuild;
- diagnostics;
- static fallback JSON;
- Cloud Storage JSON publish.

It must not deploy Firebase Hosting during routine scheduled runs. Before
publishing JSON, it must run `scripts/guard_live_json_publish.py` so a rebuild
cannot shrink the current live trend or publish a Model2 artifact that violates
the independent no-night-futures contract.

### `refresh-night-futures`

Manual fallback JSON refresh only.

Use it only when Cloud Run live refresh is degraded.
It uses the same pre-publish JSON guard as `retrain-model`.

## Recovery Checklist

When live values look stale:

1. check `/api/live/prediction.json` `generatedAt`;
2. check `/api/live/indicators.json` `generatedAt`;
3. check `/api/live/live_prediction_series.json` latest `observedAt`;
4. check Cloud Scheduler last attempt;
5. check Cloud Run latest ready revision and logs;
6. check Cloud Storage live object timestamps;
7. check source market data freshness by symbol.
