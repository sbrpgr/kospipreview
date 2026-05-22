# History Data Gap Incident - 2026-05-22

## Scope

The affected production rows are `2026-05-18` through `2026-05-21` in
`/api/live/history.json`.

The KOSPI actual values were not lost:

- `actualOpen` is present for all four dates.
- `actualClose` is present for all four dates.

The visible blanks were futures-derived verification fields:

- `2026-05-18`: `dayFuturesClose` is missing.
- `2026-05-19` to `2026-05-21`: `dayFuturesClose`, `nightFuturesClose`,
  `nightFuturesSimpleOpen`, and `nightFuturesError` are missing.

## Cause

There were two contributing data-retention failures.

1. The scheduled `save-market-snapshot` workflow failed from `2026-05-18`
   through the scheduled `2026-05-22` run because `google-cloud-storage` was
   not installed in the workflow environment. The failure was:
   `ModuleNotFoundError: No module named 'google.cloud'`.

2. The GitHub Actions JSON refresh workflows rebuilt from the checked-out
   repository's bundled JSON files before publishing to Cloud Storage. Because
   the bundled `prediction_archive.json` was older than production bucket state,
   recent archive entries could be dropped on a rebuild. When the archive rows
   were not available, the history rebuild had no authoritative source for the
   missing futures-derived fields.

The `/api/live/dashboard.json` bundled API was not the cause. It serves the same
bucket-backed `history.json` payload together with the other live JSON files.

## Fixes Applied

- `save-market-snapshot` now installs `google-cloud-storage`; the manual
  `2026-05-22` run succeeded after this fix.
- `retrain-model` now authenticates to Google Cloud and downloads the current
  bucket JSON into `frontend/public/data/` before rebuilding artifacts. The
  seed step merges bucket `prediction_archive.json` with the bundled fallback
  archive so non-null historical fields are not dropped.
- `refresh-night-futures` now follows the same seed-then-refresh pattern and
  publishes JSON directly to Cloud Storage instead of redeploying Firebase
  Hosting for routine JSON refreshes.
- `prediction_archive.json` normalization now preserves both
  `nightFuturesClose` and `nightFuturesSimpleChangePct` across the backtest and
  live refresh scripts.
- Before publishing rebuilt JSON, existing bucket `history.json` verification
  fields are merged back when the regenerated row would otherwise replace a
  non-null historical field with `null`.

These fixes do not change model formulas, frontend rendering, Cloud Run code, or
Scheduler cadence.

## Recovery Policy

Do not invent historical futures close values. Backfill the missing fields only
from an authoritative source such as retained production archive JSON, retained
eSignal settlement data, or another verified market-data source.

If a verified backfill source is available, repair should be a Cloud Storage JSON
update only. Do not run Cloud Build, Cloud Run deploy, or Firebase Hosting deploy
for this data-only correction.
