# Intraday Indicator Series Work Spec

Date: 2026-05-23 KST

## Purpose

Persist the platform's live collected indicators as durable intraday research data, not only as the current dashboard JSON.

This archive is for later analysis, model review, backtests, and incident recovery. It is intentionally separate from the public current-state files such as `prediction.json`, `indicators.json`, `history.json`, and `live_prediction_series.json`.

## Implemented Behavior

- `scripts/refresh_night_futures.py` writes one small JSON snapshot after each successful refresh during the prediction operating window.
- The operating window is `15:30~09:00 KST`, matching `is_prediction_operation_window()`.
- Cloud Run uploads generated snapshot files to Cloud Storage after the normal live JSON upload.
- GitHub Actions fallback/model workflows also upload the generated archive directory when present.
- Cloud Run uses create-only upload semantics for archive files, so an existing archive object is not overwritten.

## Storage Path

Cloud Storage path:

```text
gs://kospipreview-live-data/intraday_indicator_series/
  kst_date=YYYY-MM-DD/
    prediction_date=YYYY-MM-DD/
      YYYYMMDDTHHMMSSZ.json
```

Example:

```text
gs://kospipreview-live-data/intraday_indicator_series/
  kst_date=2026-05-23/
    prediction_date=2026-05-25/
      20260522T235912Z.json
```

The filename uses UTC seconds. The folder uses KST date and prediction target date.

## Snapshot Schema

Top-level fields:

- `schemaVersion`
- `generatedAt`
- `observedAt`
- `observedAtKst`
- `observedMinute`
- `observedMinuteKst`
- `predictionDateIso`
- `predictionDate`
- `operation`
- `marketIndicators`
- `nightFutures`
- `dayFutures`
- `prediction`
- `model`
- `quality`

`marketIndicators` stores one object per indicator key, including:

- `label`
- `ticker`
- `section`
- `value`
- `changePct`
- `updatedAt`
- `checkedAt`
- `dataSource`
- `marketSession`
- `displayValue`
- `displayChangePct`
- `displayTag`
- `isPremarket`
- `sourceUrl`

Core prediction/conversion fields preserved in each snapshot include:

- `pointPrediction`
- `rangeLow`
- `rangeHigh`
- `predictedChangePct`
- `nightFuturesSimplePoint`
- `nightFuturesSimpleChangePct`
- `ewyFxSimplePoint`
- `ewyFxSimpleChangePct`
- `nightFuturesClose`
- `nightFuturesCloseUpdatedAt`
- `prevClose`
- `latestRecordDate`
- `futuresDayClose`
- `futuresDayCloseDate`

## Null And Overwrite Policy

- Archive rows may contain `null` when a value was genuinely unavailable at that observation time.
- Archive rows must not overwrite existing archive objects in Cloud Run.
- Current-state JSON null protection remains separate:
  - `prediction.json` same-target non-null values are preserved during JSON publish.
  - `history.json` existing non-null verification fields are preserved during JSON publish.
- The archive is an observation log, not the source of truth for current dashboard display.

## Cost And Resource Notes

- The archive is text JSON and expected to stay small for the current cadence.
- No new database is required.
- No Firebase Hosting deploy is required for routine archive writes.
- Activating the primary Cloud Run archive upload path requires a Cloud Run deploy because `cloudrun/live_data_service.py` changed.

## Backfill Notes

- Future raw intraday indicator observations are captured after this change is deployed.
- Historical full raw indicator intraday values before this change cannot be fully reconstructed from existing current-state JSON.
- Some historical prediction/conversion values can still be recovered from `live_prediction_series.json` and `prediction_archive.json`.

## Files Changed

- `scripts/refresh_night_futures.py`
- `cloudrun/live_data_service.py`
- `.github/workflows/refresh-night-futures.yml`
- `.github/workflows/retrain-model.yml`
- `tests/test_operating_windows.py`
- `tests/test_live_data_service_security.py`
- `docs/INTRADAY_INDICATOR_SERIES_WORK_SPEC_2026-05-23.md`
- `docs/OPERATIONS_INDEX.md`
- `docs/CLOUD_RUN_LIVE_REFRESH.md`
- `YOUTUBE_NEWS_WORK_SPEC.md`

## Verification

Local verification:

```text
python -m unittest tests.test_operating_windows tests.test_live_data_service_security
```

Result:

```text
Ran 49 tests
OK
```
